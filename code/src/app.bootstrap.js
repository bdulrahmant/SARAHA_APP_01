import { NODE_ENV, ORIGINS, port } from "../config/config.service.js";
import { globalErrorHandling } from "./common/utlis/index.js";
import { connectDB, connectRedis, redisClient } from "./DB/index.js";
import { authRouter, messageRouter, userRouter } from "./modules/index.js";
import express from "express";
import cors from "cors";
import path, { resolve } from "path";
import { set } from "./common/services/redis.service.js";
import helmet from "helmet";
import {ipKeyGenerator, rateLimit} from 'express-rate-limit'
import axios from "axios";
import geoip from "geoip-lite"

async function bootstrap() {
  const app = express();
  //convert buffer data


const fromWhere = async (ip) => {
try {
  const response = await axios.get(`https://ipapi.co/${ip}/json`);
  console.log(response.data);
  return response.data
} catch (error) {
  console.error(error);
}
}  
var corsOptions = {
  origin: function (origin, callback) {
    if (!ORIGINS.includes(origin)) {
      callback(new Error("Not authorized origin"), {cause:{status:403}}, ORIGINS)
    }else{
      callback(null, ORIGINS )
    }
  }
}


  
//   app.get("/" , (req, res)=>{
//     res.send(`<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Document</title>
// </head>
// <body>
//     <script>
//         alert("Congrats you been hacked")
//     </script>
// </body>
// </html>`)
//   })

  const limiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    limit:async function (req) {
    console.log(geoip.lookup(req.ip));

    const {country}= geoip.lookup(req.ip)
    return country == 'EG'? 5:0

    
    },
    // message:"",
    // statusCode:500,
    legacyHeaders:true,
    standardHeaders:'draft-8',
    requestPropertyName:"rateLimit",
    // skipFailedRequests:true,
    // skipSuccessfulRequests:true,
    handler:function (req , res, next) {
      return res.status(429).json({message:'Too many trial requests!'})
    },
    keyGenerator: (req , res , next) => {
      // console.log(req.headers['x-forwarded-for']);
      
      const ip = ipKeyGenerator(req.ip , 56)
      console.log( `${ip}-${req.path}`);
      
      return `${ip}-${req.path}`
    },
     store: {
    async incr(key, cb) { // get called by keyGenerator
      try {
        const count = await redisClient.incr(key);
        if (count === 1) await redisClient.expire(key, 60); // 1 min TTL
        cb(null, count);
      } catch (err) {
        cb(err);
      }
    },
 
    async decrement(key) {  // called by kipFailedRequests:true ,  skipSuccessfulRequests:true,
      await redisClient.decr(key);
    },
  },
  })
  app.set("trust proxy" , true)
  app.use(cors(), helmet());
  app.use(express.json());
  app.use("/uploads", express.static(resolve('../uploads/')))

  // DB
  await connectDB();
  await connectRedis();




  await set({key:"name" , value:"Taha" , ttl:50})
  //application routing
  app.get("/",async (req, res) =>{
    console.log(await fromWhere(req.ip));
    
     res.send("Hello World!")
  });
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/message", messageRouter);

  //invalid routing
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });

  //error-handling
  app.use(globalErrorHandling);

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
export default bootstrap;
