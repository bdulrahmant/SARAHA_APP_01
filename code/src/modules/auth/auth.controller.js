import { Router } from "express";
import { signup, login, verifyOTP, signupWithGmail, confirmEmail, resendConfirmEmail, requestForgotPasswordOtp, verifyForgotPasswordOtp, resetForgotPasswordOtp } from "./auth.service.js";
import {
  BadRequestException,
  successResponse,
} from "../../common/utlis/index.js";
import * as validators from './auth.validation.js'
import { validation } from "../../middleware/validation.middleware.js";
import geoip from 'geoip-lite'
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { redisClient } from "../../DB/redis.connection.db.js";
import { deleteKey } from "../../common/services/redis.service.js";
const router = Router();

  const loginLimiter = rateLimit({
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
    skipSuccessfulRequests:true,
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


router.post("/login",loginLimiter,validation(validators.login), async (req, res, next) => {


  const credentials = await login (req.body , `${req.protocol}://${req.host}`)
  await deleteKey(`${req.ip}-${req.path}`)
  return successResponse({ res, data: { ...credentials } });
});


router.post("/signup",
  validation(validators.signup),
   async (req, res, next) => {


  const account =await signup(req.body)
  return successResponse({ res, status: 201, data: { account } });
});

router.patch("/confirm-email",
  validation(validators.confirmEmail),
   async (req, res, next) => {


  await confirmEmail(req.body)
  return successResponse({ res,  });
});

router.patch("/resend-confirm-email",
  validation(validators.resendConfirmEmail),
   async (req, res, next) => {
  await resendConfirmEmail(req.body)
  return successResponse({ res,  });
});

router.post("/request-forgot-password-code",
  validation(validators.resendConfirmEmail),
   async (req, res, next) => {
  await requestForgotPasswordOtp(req.body)
  return successResponse({ res });
}); 

router.patch("/verify-forgot-password-code",
  validation(validators.confirmEmail),
   async (req, res, next) => {
  await verifyForgotPasswordOtp(req.body)
  return successResponse({ res });
}); 

router.patch("/reset-forgot-password-code",
  validation(validators.resetForgotPasswordCode),
   async (req, res, next) => {
  await resetForgotPasswordOtp(req.body)
  return successResponse({ res });
}); 



router.post("/verify-otp", async (req, res, next) => {
  const result = await verifyOTP(req.body);

  return successResponse({
    res,
    data: result,
  });
});

router.post("/signup/gmail", async (req, res, next) => {
  const { status, credentials } = await signupWithGmail(
    req.body.idToken,
    `${req.protocol}://${req.get("host")}`,
  );
  return successResponse({ res, status, data: { ...credentials } });
});

export default router;
