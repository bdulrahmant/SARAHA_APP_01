import { Router } from "express";
import multer from "multer";
import { logout, profile ,profileCoverImages,profileImage,rotateToken, shareProfile, updatePassword, uploadProfilePicture } from "./user.service.js";
import { successResponse } from "../../common/utlis/respons/success.respons.js";
import { authentictaion, authorization } from "../../middleware/authentication.middleware.js";
import { endPoint } from "./user.authorization.js";
import * as validators from "./user.validation.js"
import { validation } from "../../middleware/validation.middleware.js";
import { localFileUpload } from "../../common/utlis/multer/local.multer.js";
import { fileFieldValidation } from "../../common/utlis/multer/index.js";
import { messageRouter } from "../messages/index.js";
const router = Router();

const upload = multer({ dest: "uploads" });


router.use("/:recieverId/message" , messageRouter)

router.post("/logout" , authentictaion(), async (req , res , next) => {
  
  const status = await logout(req.body , req.user , req.decoded)
  return successResponse({res , status})
})




router.patch("/profile-image" ,
  authentictaion(),
  localFileUpload({
    customPath:"users/profile",
    validation:fileFieldValidation.image,
    maxSize:5
  }).single("attachment"),
  validation(validators.profileImage),
  async (req , res , next) => {
    const account = await profileImage(req.file , req.user)
  return successResponse({res , data:{account}})
})



router.patch(
  "/profile-cover-image",
  authentictaion(),
  localFileUpload({
    customPath: "users/profile/cover",
    validation: fileFieldValidation.image,
    maxSize: 5
  }).array("atrtachments",5),
  validation(validators.profileCoverImage),
  async (req, res, next) => {

    const account = await profileCoverImages(req.files , req.user)

    return successResponse({
      res,
      data: { account }
    });

  }
);



router.patch(
  "/update-password",
  authentictaion(),
  validation(validators.updatePassword),
  async (req, res, next) => {

    const credentials = await updatePassword(req.body , req.user, `${req.protocol}://${req.host}`)

    return successResponse({
      res,
      data: { ...credentials }
    });

  }
);


router.get("/", 
  authentictaion(),
  authorization(endPoint.profile),
  async (req, res, next) => {
  const account = await profile(req.headers.authorization);

  return successResponse({ res, data: { account } });
});


router.get("/:userId/share-profile", 
  validation(validators.shareProfile),
  async (req, res, next) => {
  const account = await shareProfile(req.params.userId);

  return successResponse({ res, data: { account } });
});



router.get('/rotate-token', authentictaion("refresh"), async (req , res , next) => {
  const credential =  await rotateToken(req.user , req.decoded , `${req.protocol}://${req.host}`)
    return successResponse({ res, status:201 , data: { ...credential } });

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
