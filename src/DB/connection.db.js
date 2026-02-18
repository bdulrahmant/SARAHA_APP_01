import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import { UserModel } from "./models/user.model.js";

export const connectDB = async () => {
  try {
    const result = await mongoose.connect(DB_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("DB connected Successfuly👌🏻");
    await UserModel.syncIndexes()
  } catch (error) {
    console.log("Fail to connect on DB👀");
    console.log(error);
  }
};
