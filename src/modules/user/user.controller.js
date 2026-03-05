import { Router } from "express";
import multer from "multer";
import { profile ,rotateToken, uploadProfilePicture } from "./user.service.js";
import { successResponse } from "../../common/utlis/respons/success.respons.js";
import { authentictaion, authorization } from "../../middleware/authentication.middleware.js";
import { endPoint } from "./user.authorization.js";
const router = Router();

const upload = multer({ dest: "uploads" });

router.get("/", 
  authentictaion(),
  authorization(endPoint.profile),
  async (req, res, next) => {
  const account = await profile(req.headers.authorization);

  return successResponse({ res, data: { account } });
});

router.get('/rotate-token', async (req , res , next) => {
  const credential =  await rotateToken(req.headers.authorization , `${req.protocol}://${req.host}`)
    return successResponse({ res, data: { credential } });

})

router.post(
  "/profile-picture",
  authentictaion(),
  authorization(endPoint.profile),
  upload.single("profilePicture"),
  async (req, res, next) => {
    const account = await uploadProfilePicture(req.user._id, req.file);

    return successResponse({ res, data: { account } });
  },
);
export default router;
