import { Router } from "express";
import { profile } from "./user.service.js";
import { successResponse } from "../../common/utlis/respons/success.respons.js";
const router = Router();

router.get("/", async (req, res, next) => {
  const account = await profile(req.headers.authorization);

  return successResponse({ res, data: { account } });
});
export default router;
