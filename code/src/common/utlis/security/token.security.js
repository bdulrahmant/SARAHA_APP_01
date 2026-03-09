import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  SYSTEM_ACCESS_TOKEN_SECRET_KEY,
  SYSTEM_REFRESH_TOKEN_SECRET_KEY,
  USER_ACCESS_TOKEN_SECRET_KEY,
  USER_REFRESH_TOKEN_SECRET_KEY,
} from "../../../../config/config.service.js";
import { UserModel, findOne, tokenModel } from "../../../DB/index.js";
import { TokentypeEnum } from "../enums/security.enum.js";
import { conflictException } from "../respons/error.response.js";
import { roleEnum } from "../enums/user.enum.js";
import {  notFoundException } from "../respons/error.response.js";
import { randomUUID } from "crypto";

export const generateToken = async ({
  payload = {},
  secret = USER_ACCESS_TOKEN_SECRET_KEY,
  options = {},
} = {}) => {
  return jwt.sign(payload, secret, options);
};


export const verifyToken = async ({
  token,
  secret = USER_ACCESS_TOKEN_SECRET_KEY,
} = {}) => {
  return jwt.verify(token, secret);
};



export const detectSignturesLevel = async (level) => {
  let signtures = { accessSignture: undefined, refreshSignture: undefined };

  switch (level) {
    case roleEnum.Admin:
      signtures = {
        accessSignture: SYSTEM_ACCESS_TOKEN_SECRET_KEY,
        refreshSignture: SYSTEM_REFRESH_TOKEN_SECRET_KEY,
      };
      break;

    default:
      signtures = {
        accessSignture: USER_ACCESS_TOKEN_SECRET_KEY,
        refreshSignture: USER_REFRESH_TOKEN_SECRET_KEY,
      };
      break;
  }

  return signtures;
};



export const getTokenSignture = async ({tokenType =TokentypeEnum.Access ,level}) => {
  const { accessSignture , refreshSignture} =await  detectSignturesLevel(level)
  let signture = undefined
  switch (tokenType) {
    case TokentypeEnum.Refresh :
      signture = refreshSignture
      break;
  
    default:
      signture = accessSignture
      break;
  }
  return signture
}




export const decodeToken = async (token, tokenType = TokentypeEnum.Access) => {

  const decoded = jwt.decode(token);

  if (!decoded) {
    throw new Error("Invalid token format");
  }

  if (!decoded.aud || !decoded.aud.length) {
    throw new Error("Missing token audience");
  }

  const [tokenApproach, level] = decoded.aud;

  if (tokenType !== tokenApproach) {
    throw conflictException({
      message: `unexpected Token mechanism we expected ${tokenType} while you have used ${tokenApproach}`
    });
  }
  if (decoded.jti && await findOne({model:tokenModel , filter:{jti:decoded.jti}})) {
    throw notFoundException({message:"invalid login session"}) 
  }
  const secret = await getTokenSignture({
    tokenType: tokenApproach,
    level
  });

  const verifiedData = jwt.verify(token, secret);

  const user = await findOne({
    model: UserModel,
    filter: { _id: verifiedData.sub },
  });

  if (!user) {
    throw notFoundException({ message: "Not register account" });
  }

  if (user.changeCredentialTime && user.changeCredentialTime?.getTime() >= decoded.iat*1000 ) {
   throw notFoundException({message:"invalid login session"}) 
  }
  

  return {user,decoded};
};


export const createLoginCredentials = async (user, issuer) => {
  const {accessSignture , refreshSignture} = await detectSignturesLevel(user.role)

  const jwtId = randomUUID()

  const access_token = await generateToken({
  secret: accessSignture,
  options: {
    subject: user._id.toString(),
    issuer,
    audience: [TokentypeEnum.Access, user.role],
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    jwtId
  },
});

  const refresh_token = await generateToken({
    secret:refreshSignture,
    options: {
      subject: user._id.toString(),
      issuer,
      audience: [TokentypeEnum.Refresh , user.role],
      // noTimestamp:true,
      // notBefore:60,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      jwtId
    },
  });

  return {
    message: "Login successful",
    access_token,
    refresh_token,
  };
};
