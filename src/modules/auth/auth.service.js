import {
  conflictException,
  notFoundException,
  generateHash,
  generateEncryption,
  generateDecryption,
} from "../../common/utlis/index.js";

import { UserModel, createOne, findOne } from "../../DB/index.js";
import { compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET_KEY } from "../../../config/config.service.js";
import { sendEmail } from "../../common/services/email.service.js";
import {
  encryptWithPublicKey,
  decryptWithPrivateKey,
} from "../../common/utlis/security/asymmetric.security.js";

// export const signup = async (inputs) => {
//   const { username, email, password, phone } = inputs;

//   const checkUserExist = await findOne({
//     model: UserModel,
//     filter: { email },
//   });

//   if (checkUserExist) {
//     throw conflictException({ message: "Email is exist" });
//   }

//   const user = await createOne({
//     model: UserModel,
//     data: {
//       username,
//       email,

//       password: await generateHash(password),

//       phone: await generateEncryption(phone),
//     },
//   });

//   return {
//     message: "User created successfully",
//     user,
//   };
// };

// import { conflictException, generateHash, generateEncryption } from "../../common/utlis/index.js"
// import { UserModel, createOne, findOne } from "../../DB/index.js"
// import { sendEmail } from "../../common/services/email.service.js"

// export const generateOTP = () => {

//   const otp = Math.floor(100000 + Math.random() * 900000)

//   return otp.toString()

// }

// export const signup = async (inputs) => {

//   const { username, email, password, phone } = inputs

//   const checkUserExist = await findOne({
//     model: UserModel,
//     filter: { email },
//   })

//   if (checkUserExist) {
//     throw conflictException({ message: "Email is exist" })
//   }

//   const user = await createOne({
//     model: UserModel,
//     data: {
//       username,
//       email,

//       password: await generateHash(password),

//       phone: await generateEncryption(phone),
//     },
//   })

//   const otp = generateOTP()

//   await sendEmail({

//     to: email,

//     subject: "Verify your account",

//     html: `
//       <h2>Hello ${username}</h2>
//       <p>Your OTP code is:</p>
//       <h1>${otp}</h1>
//       <p>This code is valid for 10 minutes.</p>
//     `

//   })

//   console.log("OTP:", otp)

//   return {
//     message: "User created successfully. OTP sent to email",
//     user
//   }

// }

// export const login = async (inputs) => {
//   const { email, password } = inputs;

//   const user = await UserModel.findOne({ email }).select("+password").lean();

//   if (!user) {
//     throw notFoundException({ message: "invalid login credentials" });
//   }

//   if (!user.password) {
//     throw notFoundException({ message: "invalid login credentials" });
//   }

//   const match = await compare(password, user.password);

//   if (!match) {
//     throw notFoundException({ message: "invalid login credentials" });
//   }

//   if (user.phone) {
//     user.phone = await generateDecryption(user.phone);
//   }

//   const access_token = jwt.sign({  }, ACCESS_TOKEN_SECRET_KEY,{
//     subject:user._id.toString(),
//     // noTimestamp:true
//     // notBefore:60*60

//     expiresIn:30

//     }
//   )
//   return {
//     message: "Login successful",
//     access_token,
//   };
// };

export const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);

  return otp.toString();
};

export const signup = async (inputs) => {
  const { username, email, password, phone } = inputs;

  const checkUserExist = await findOne({
    model: UserModel,
    filter: { email },
  });

  if (checkUserExist) {
    throw conflictException({ message: "Email is exist" });
  }

  const otp = generateOTP();

  const encryptedOTP = encryptWithPublicKey(otp);

  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  const user = await createOne({
    model: UserModel,
    data: {
      username,
      email,

      password: await generateHash(password),

      phone: await generateEncryption(phone),

      otp: encryptedOTP,
      otpExpires: otpExpires,
      isVerified: false,
    },
  });

  await sendEmail({
    to: email,

    subject: "Verify your account",

    html: `
      <h2>Hello ${username}</h2>
      <p>Your OTP code is:</p>
      <h1>${otp}</h1>
      <p>This code is valid for 10 minutes.</p>
    `,
  });

  console.log("OTP:", otp);

  return {
    message: "User created successfully. OTP sent to email",
    user,
  };
};

export const verifyOTP = async ({ email, otp }) => {
  const user = await findOne({
    model: UserModel,
    filter: { email },
  });

  if (!user) {
    throw notFoundException({ message: "User not found" });
  }

  if (user.isVerified) {
    return {
      message: "Account already verified",
    };
  }

  if (!user.otp) {
    throw notFoundException({ message: "No OTP found" });
  }

  const decryptedOTP = decryptWithPrivateKey(user.otp);

  if (decryptedOTP !== otp) {
    throw notFoundException({ message: "Invalid OTP" });
  }

  if (new Date() > user.otpExpires) {
    throw notFoundException({ message: "OTP expired" });
  }

  await UserModel.updateOne(
    { email },
    {
      isVerified: true,
      otp: null,
      otpExpires: null,
    },
  );

  return {
    message: "Account verified successfully",
  };
};

export const login = async (inputs) => {
  const { email, password } = inputs;

  const user = await UserModel.findOne({ email }).select("+password").lean();

  if (!user) {
    throw notFoundException({ message: "invalid login credentials" });
  }

  if (!user.password) {
    throw notFoundException({ message: "invalid login credentials" });
  }

  const match = await compare(password, user.password);

  if (!match) {
    throw notFoundException({ message: "invalid login credentials" });
  }

  if (user.phone) {
    user.phone = await generateDecryption(user.phone);
  }

  const access_token = jwt.sign({}, ACCESS_TOKEN_SECRET_KEY, {
    subject: user._id.toString(),
    expiresIn: 30,
  });

  return {
    message: "Login successful",
    access_token,
  };
};
