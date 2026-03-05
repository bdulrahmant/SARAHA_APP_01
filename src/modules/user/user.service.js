import jwt from "jsonwebtoken";
import { findOne } from "../../DB/database.repository.js";
import { UserModel } from "../../DB/index.js";
import { USER_ACCESS_TOKEN_SECRET_KEY, USER_REFRESH_TOKEN_SECRET_KEY } from "../../../config/config.service.js";
import { createLoginCredentials, decodeToken, notFoundException } from "../../common/utlis/index.js";
import { TokentypeEnum } from "../../common/utlis/enums/security.enum.js";

export const profile = async (authorization) => {
  const token = authorization?.startsWith("Bearer ")
    ? authorization.split(" ")[1]
    : authorization;
  const account = await decodeToken(token);

  return account;
};



export const rotateToken = async (authorization ,issuer) => {
  // const decodeToken = jwt.decode(token);
  // console.log(decodeToken);
  // const verfiedData = jwt.verify(
  //   token,
  //   USER_REFRESH_TOKEN_SECRET_KEY,
  // );
  // console.log({ verfiedData });

  // const user = await findOne({ model: UserModel, filter: { _id:verfiedData.sub } });
  const token = authorization?.startsWith("Bearer ")
    ? authorization.split(" ")[1]
    : authorization;
  const user = await decodeToken(token, TokentypeEnum.Refresh);
  return createLoginCredentials(user , issuer)

};


export const uploadProfilePicture = async (userId, file) => {
  await UserModel.updateOne(
    { _id: userId },
    {
      profilePicture: file?.filename,
    },
  );

  const account = await UserModel.findById(userId);

  return account;
};