import { NODE_ENV, port } from "../config/config.service.js";
import { globalErrorHandling } from "./common/utlis/index.js";
import { connectDB, connectRedis, redisClient } from "./DB/index.js";
import { authRouter, userRouter } from "./modules/index.js";
import express from "express";
import cors from "cors";
import { resolve } from "path";
import { set } from "./common/services/redis.service.js";

async function bootstrap() {
  const app = express();
  //convert buffer data
  // app.use(cors(),express.json())
  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(resolve('../uploads/')))

  // DB
  await connectDB();
  await connectRedis();

  await set({key:"name" , value:"Taha" , ttl:50})
  //application routing
  app.get("/", (req, res) => res.send("Hello World!"));
  app.use("/auth", authRouter);
  app.use("/user", userRouter);

  //invalid routing
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });

  //error-handling
  app.use(globalErrorHandling);

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
export default bootstrap;
