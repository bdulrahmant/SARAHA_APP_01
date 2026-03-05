import {
  conflictException,
  notFoundException,
  generateHash,
  generateEncryption,
  generateDecryption,
  createLoginCredentials,
} from "../../common/utlis/index.js";

import { UserModel, createOne, findOne } from "../../DB/index.js";
import { compare } from "bcrypt";

import { sendEmail } from "../../common/services/email.service.js";
import {
  encryptWithPublicKey,
  decryptWithPrivateKey,
} from "../../common/utlis/security/asymmetric.security.js";

import {OAuth2Client} from'google-auth-library';
import { providerEnum, roleEnum } from "../../common/utlis/enums/user.enum.js";



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

  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

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
      <p>This code is valid for 5 minutes.</p>
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

export const login = async (inputs , issuer) => {
  const { email, password } = inputs;

  const user = await UserModel.findOne({ email }).select("+password").lean();

  if (!user) {
    throw notFoundException({ message: "invalid login credentials ,email is false" });
  }

  if (!user.password) {
    throw notFoundException({ message: "invalid login credentials ,password is false" });
  }

  const match = await compare(password, user.password);

  if (!match) {
    throw notFoundException({ message: "invalid login credentials" });
  }

  if (user.phone) {
    user.phone = await generateDecryption(user.phone);
  }

  return createLoginCredentials(user , issuer)
};




// {
//   iss: 'https://accounts.google.com',
//   azp: '767987134630-ss2og52g00f3ga58q9ds5qj3eb38b19h.apps.googleusercontent.com',
//   aud: '767987134630-ss2og52g00f3ga58q9ds5qj3eb38b19h.apps.googleusercontent.com',
//   sub: '100880872523072637130',
//   email: 'bdulrahman.t@gmail.com',
//   email_verified: true,
//   nbf: 1772665969,
//   name: 'Abdulrahman Taha',
//   picture: 'https://lh3.googleusercontent.com/a/ACg8ocKTl0lR0W8I4xnMlUeBVHpB4e5lRLBbKWccMnoVm4zp_D5IPsk=s96-c',
//   given_name: 'Abdulrahman',
//   family_name: 'Taha',
//   iat: 1772666269,
//   exp: 1772669869,
//   jti: 'ad26709bb70369d88547b5c0f67edb560c47ad00'
// }

const verifyGoogleAccount = async (idToken) => {
   
const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
      idToken,
      audience: "767987134630-ss2og52g00f3ga58q9ds5qj3eb38b19h.apps.googleusercontent.com",  
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw new Error("fail to verify google")
  }
  return payload
}


  export const loginWithGmail = async (idToken , issuer) => {
  
    const payload = await verifyGoogleAccount(idToken)
  
    console.log(payload)
  
    const user = await findOne({
      model:UserModel,
      filter:{email:payload.email, provider:providerEnum.Google}
   } )
  if (!user) {
    throw notFoundException({message:"Not register account"})
   }
  
    return await createLoginCredentials(user,issuer)
  
  }




export const signupWithGmail = async (idToken , issuer) => {

  const payload = await verifyGoogleAccount(idToken)

  console.log(payload)

  const checkExist = await findOne({
    model:UserModel,
    filter:{email:payload.email}
 } )
if (checkExist) {

  if (checkExist.provider != providerEnum.Google) {
    throw conflictException({message:"invalid login provider"})
  }

  return {status:200 , credentials:await loginWithGmail(idToken , issuer)}

  
 }
 const user = await createOne({
  model:UserModel,
  data:{
    firstName:payload.given_name,
    lastName:payload.family_name,
    email:payload.email,
    profilePicture:payload.picture,
    confirmEmail:new Date(),
    provider:providerEnum.Google,
    role:roleEnum.User
  }
 })
  return {status:201, credentials:await createLoginCredentials(user, issuer)}

}




