import jwt from "jsonwebtoken";
import { findOne } from "../../DB/database.repository.js";
import { UserModel } from "../../DB/index.js";
import { ACCESS_TOKEN_SECRET_KEY } from "../../../config/config.service.js";

export const profile = async (token) => {
  const decodeToken = jwt.decode(token);
  console.log(decodeToken);
  const verfiedData = jwt.verify(
    token,
    ACCESS_TOKEN_SECRET_KEY,
  );
  console.log({ verfiedData });

  const account = await findOne({ model: UserModel, filter: { _id:verfiedData.sub } });
  return account;
};
