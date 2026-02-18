import { Router } from "express";
import { signup , login , verifyOTP } from "./auth.service.js";
import { successResponse } from "../../common/utlis/index.js";
const router = Router();


router.post("/signup", async (req, res, next) => {

  const account = await signup(req.body);
  return successResponse({ res, status: 201, data: { account } });
});

router.post("/login", async (req, res, next) => {
  const credentials = await login(req.body);
  return successResponse({ res, data: { credentials } });
});


router.post("/verify-otp", async (req, res, next) => {

  const result = await verifyOTP(req.body);

  return successResponse({
    res,
    data: result
  });

});


export default router;
