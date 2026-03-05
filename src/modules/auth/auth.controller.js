import { Router } from "express";
import { signup, login, verifyOTP, signupWithGmail } from "./auth.service.js";
import {
  BadRequestException,
  successResponse,
} from "../../common/utlis/index.js";
import joi from "joi";
const router = Router();

const loginSchema = joi
  .object()
  .keys({
    email: joi.string().email({minDomainSegments:2 , maxDomainSegments:3 , tlds:{allow:['com', 'net']}}),
    password:joi.string().pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,16}$/)).required(),
  }).required()

const signupSchema = loginSchema
  .append()
  .keys({
    email: joi.string().email({minDomainSegments:2 , maxDomainSegments:3 , tlds:{allow:['com', 'net']}}).required(),
    username: joi.string().pattern(new RegExp(/^(?=.{3,20}$)(?!.*[_.]{2})[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*$/)
).required().case("lower").messages({
      "any.required": "username is required",
      "string-empty": "username cannot be empty",
    }),
    password:joi.string().required(),
    phone: joi.string().pattern(/^01[0125][0-9]{8}$/).required(),
    confirmPassword:joi.string().valid(joi.ref("password")).required()

  }).required()







router.post("/signup", async (req, res, next) => {
  const validationResult = await signupSchema.validateAsync(req.body, {
    abortEarly: false,
  });

  if (validationResult.error) {
    throw BadRequestException({ message: "validation error", extra: error });
  }
  return successResponse({ res, status: 201, data: { validationResult } });
});

router.post("/login", async (req, res, next) => {
  const validationResult = await loginSchema.validateAsync(req.body, {
    abortEarly: false,
  });

  if (validationResult.error) {
    throw BadRequestException({ message: "validation error", extra: error });
  }
  return successResponse({ res, data: { credentials } });
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
