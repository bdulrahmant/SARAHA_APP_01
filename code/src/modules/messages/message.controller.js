import { Router } from "express";
import { successResponse } from "../../common/utlis/respons/success.respons.js";
import { deleteMessage, getMessage, getMessages, sendMessage } from "./message.service.js";
import {
  BadRequestException,
  decodeToken,
  fileFieldValidation,
  localFileUpload,
} from "../../common/utlis/index.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./message.validation.js";
import { TokentypeEnum } from "../../common/utlis/enums/security.enum.js";
import { authentictaion } from "../../middleware/authentication.middleware.js";
const router = Router({caseSensitive:true , strict:true ,mergeParams:true });

router.post(
  "/:recieverId",
  async (req, res, next) => {
    if (req.headers.authorization) {
      const { user, decoded } = await decodeToken({
        token: req.headers.authorization.split(" ")(1),
        tokenType: TokentypeEnum.Access,
      });
      req.user = user;
      req.decoded = decoded;
    }
    next();
  },
  localFileUpload({
    validation: fileFieldValidation.image,
    customPath: "Messages",
    maxSize: 1,
  }).array("attachments", 2),
  validation(validators.sendMessage),
  async (req, res, next) => {
    if (!req.body?.content && !req.files?.length) {
      throw BadRequestException({
        message: `Validation Error`,
        extra: { key: "body", path: ["content"], message: `Missing content` },
      });
    }
    const message = await sendMessage(
      req.params.recieverId,
      req.body,
      req.files,
      req.user,
    );
    return successResponse({ res, status: 201, data: { message } });
  },
);


router.get(
  "/list",
  authentictaion(),
  async (req, res, next) => {

    const messages = await getMessages(
      req.user,
    );
    return successResponse({ res, status: 200, data: { messages } });
  },
);


router.get(
  "/:messageId",
  authentictaion(),
  validation(validators.getMessage),
  async (req, res, next) => {

    const message = await getMessage(
      req.params.messageId,
      req.user,
    );
    return successResponse({ res, status: 200, data: { message } });
  },
);


router.delete(
  "/:messageId",
  authentictaion(),
  validation(validators.getMessage),
  async (req, res, next) => {

    const message = await deleteMessage(
      req.params.messageId,
      req.user,
    );
    return successResponse({ res, status: 200, data: { message } });
  },
);

export default router;
