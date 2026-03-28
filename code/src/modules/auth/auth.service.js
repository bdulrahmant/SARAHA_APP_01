import {
  conflictException,
  notFoundException,
  generateHash,
  generateEncryption,
  generateDecryption,
  createLoginCredentials,
  emailTemplete,
  createNumberOtp,
  compareHash,
  BadRequestException,
  emailEvent,
  generateToken,
  verifyToken,
} from "../../common/utlis/index.js";

import { UserModel, createOne, findOne, updateOne } from "../../DB/index.js";
import { compare } from "bcrypt";

import { sendEmail } from "../../common/services/email.service.js";
import {
  encryptWithPublicKey,
  decryptWithPrivateKey,
} from "../../common/utlis/security/asymmetric.security.js";

import {OAuth2Client} from'google-auth-library';
import { providerEnum, roleEnum } from "../../common/utlis/enums/user.enum.js";
import { baseRevokeTokenKey, blockOtpKey, deleteKey, get, incr, keys, MaxAttemptOtpKey, otpKey, revokeTokenKey, set, ttl, update } from "../../common/services/redis.service.js";
import { emailEnum } from "../../common/utlis/enums/email.enum.js";


const sendEmailOtp = async ({email , subject , title}) => {
    const isBlocked =await  ttl(blockOtpKey({email, subject }))
  if (isBlocked>0) {
    throw BadRequestException({message:`Sorry we can not request new otp while you are blocked please try again after ${isBlocked}`})
  }

  const reminingOtpTTL =await  ttl(otpKey({email, subject }))
  if (reminingOtpTTL>0) {
    throw BadRequestException({message:`Sorry we can not request new otp while current otp still active please try again after ${reminingOtpTTL}`})
  }
  
  const maxTrial = await get(MaxAttemptOtpKey({email, subject }))
  if (maxTrial>=3) {
    await set({
      key:blockOtpKey({email , subject}),
      value:"blocked",
      ttl:7 * 60
    })
    throw BadRequestException({message:`You have riched the max trial`})

  }

  const code =await createNumberOtp()
  await set({
    key: otpKey({email, subject }) , 
    value: await generateHash(`${code}`),
    ttl: 120
  }),
  emailEvent.emit('sendEmail' , async () => {
      await sendEmail({
    to: email,
    subject,
    html:emailTemplete({code , title})
  });

  await incr(MaxAttemptOtpKey({email, subject }))
  })

}


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


await sendEmailOtp({email , subject: emailEnum.ConfirmEmail , title:"verify Email"})

  return {
    message: "User created successfully. OTP sent to email",
    user,
  };
};


export const confirmEmail = async (inputs) => {
  const { email, otp } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: { email, isVerified: false, provider: providerEnum.System },
  });

  if (!account) {
    throw notFoundException({ message: "Fail to found matching account" });
  }

  const hashOtp = await get(otpKey({email , subject:emailEnum.ConfirmEmail}));

  if (!hashOtp) {
    throw notFoundException({ message: "Expired OTP" });
  }

  const isMatch = await compareHash({
    plaintext: otp,
    ciphertext: hashOtp,
  });

  if (!isMatch) {
    throw conflictException({ message: "Invalid OTP" });
  }

  account.isVerified = true;
  account.confirmEmail = new Date();
  account.unconfirmedExpiry = undefined;
  await account.save();
await deleteKey(await keys(otpKey({email , subject:emailEnum.ConfirmEmail}))) 
return;
};


export const resendConfirmEmail = async (inputs) => {
  const { email } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: { 
      email ,
      isVerified:false  , 
      provider:providerEnum.System
     },
  });

  if (!account) {
    throw notFoundException({ message: "Fail to found matching account" });
  }

  await sendEmailOtp({email , subject: emailEnum.ConfirmEmail , title:"Verify Email"})

  return;
};


export const requestForgotPasswordOtp = async (inputs) => {
  const { email } = inputs;

  const account = await findOne({
    model: UserModel,
    filter: {
      email ,
      provider:providerEnum.System
    },
  });

  if (!account) {
    throw notFoundException({ message: "Fail to found matching account" });
  }

  await sendEmailOtp({email , subject: emailEnum.ForgotPassword , title:"Reset Login Code"})

  return;
};

export const verifyForgotPasswordOtp = async (inputs) => {
  const { email , otp } = inputs;
  const hashOtp = await get(otpKey({email , subject:emailEnum.ForgotPassword}))
  if (!hashOtp) {
    throw notFoundException({message:"Expired OTP"})
  }
  if (!await compareHash({plaintext:otp , ciphertext:hashOtp})) {
    throw conflictException({message:"Invalid OTP"})
  }
  return;
};

export const resetForgotPasswordOtp = async (inputs) => {
  const { email , otp  , password} = inputs;
  await verifyForgotPasswordOtp({email , otp })
  const account = await findOne({
    model: UserModel,
    filter: {
      email ,
      provider:providerEnum.System
    },
  });
  if (!account) {
    throw notFoundException({message:"account not exist"})
  }
  const updateResult = await updateOne({
    model:UserModel,
    filter:{
      email ,
      provider:providerEnum.System
    },
    update:{
      password:await generateHash(password),
      changeCredentialTime:new Date()
    }
  })
  if (!updateResult.matchedCount) {
    throw notFoundException({message:"account not exist"})
  }

  const tokenKeys = await keys(baseRevokeTokenKey(account._id))
  const otpKeys = await keys(otpKey({email , subject:emailEnum.ForgotPassword}))
  await deleteKey([...tokenKeys , ...otpKeys])
  return;
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

  const failedKey = `fail:${email}`;
  const failed = await get(failedKey);
  if (failed === "blocked") throw notFoundException({ message: "Account is blocked for 5 minutes due to too many failed login attempts." });

  const user = await UserModel.findOne({ email }).select("+password").lean();

  if (!user) {
    throw notFoundException({ message: "invalid login credentials ,email is false" });
  }

  if (!user.password) {
    throw notFoundException({ message: "invalid login credentials ,password is false" });
  }

  const match = await compare(password, user.password);

  if (!match) {
    const attempts = Number(failed || 0) + 1;
    await set({ key: failedKey, value: attempts >= 5 ? "blocked" : attempts, ttl: 300 });
    throw notFoundException({ message: attempts >= 5 ? "Blocked for 5m" : "invalid login credentials" });
  }
  await deleteKey([failedKey]);

  if (user.phone) {
    user.phone = await generateDecryption(user.phone);
  }

  if (user.twoStepVerification) {
    await sendEmailOtp({email , subject: emailEnum.TwoStepsVerification , title:"2FA Code"});
    return { message: "OTP sent. Please confirm 2FA.", twoStepVerification: true, email }; 
  }

  return createLoginCredentials(user , issuer)
};

export const enable2FA = async (user) => {
  await sendEmailOtp({email: user.email , subject: emailEnum.TwoStepsVerification , title:"Enable 2FA Code"});
  return { message: "OTP sent to email to enable 2FA." };
};

export const confirm2FA = async (user, otp) => {
  const hashOtp = await get(otpKey({email: user.email , subject: emailEnum.TwoStepsVerification}));
  if (!hashOtp) throw notFoundException({ message: "Expired OTP" });
  if (!await compareHash({ plaintext: otp, ciphertext: hashOtp })) throw conflictException({ message: "Invalid OTP" });
  user.twoStepVerification = true;
  await user.save();
  await deleteKey(await keys(otpKey({email: user.email , subject: emailEnum.TwoStepsVerification})));
  return { message: "2FA enabled successfully" };
};

export const confirmLogin2FA = async (inputs , issuer) => {
  const { email, otp } = inputs;
  const hashOtp = await get(otpKey({email , subject: emailEnum.TwoStepsVerification}));
  if (!hashOtp) throw notFoundException({ message: "Expired OTP" });
  if (!await compareHash({ plaintext: otp, ciphertext: hashOtp })) throw conflictException({ message: "Invalid OTP" });
  const user = await UserModel.findOne({ email }).lean();
  if (user.phone) {
    user.phone = await generateDecryption(user.phone);
  }
  await deleteKey(await keys(otpKey({email , subject: emailEnum.TwoStepsVerification})));
  return createLoginCredentials(user, issuer);
};

export const requestForgotPasswordLink = async ({ email }, protocolHost) => {
  const account = await UserModel.findOne({ email, provider: providerEnum.System });
  if (!account) throw notFoundException({ message: "Account not found" });
  const token = await generateToken({ payload: { email }, secret: "RESET_LINK_SECRET", options: { expiresIn: '15m' } });
  const link = `${protocolHost}/auth/reset-forgot-password-link?token=${token}`;
  emailEvent.emit('sendEmail' , async () => {
    await sendEmail({ to: email, subject: "Reset Password Link", html: `<a href='${link}'>Reset Password</a>` });
  });
  return { message: "Reset link sent" };
};

export const resetForgotPasswordLink = async ({ token, password }) => {
  const decoded = await verifyToken({ token, secret: "RESET_LINK_SECRET" });
  const email = decoded.email;
  const isUsed = await get(`usedLink:${token}`);
  if (isUsed) throw conflictException({ message: "Link already used" });
  
  const account = await UserModel.findOne({ email, provider: providerEnum.System });
  if (!account) throw notFoundException({ message: "Account not found" });
  
  account.password = await generateHash(password);
  account.changeCredentialTime = new Date();
  await account.save();
  await set({ key: `usedLink:${token}`, value: "used", ttl: 15 * 60 });
  const tokenKeys = await keys(baseRevokeTokenKey(account._id));
  if(tokenKeys && tokenKeys.length) await deleteKey(tokenKeys);
  return { message: "Password reset successful" };
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


