import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  SYSTEM_ACCESS_TOKEN_SECRET_KEY,
  SYSTEM_REFRESH_TOKEN_SECRET_KEY,
  USER_ACCESS_TOKEN_SECRET_KEY,
  USER_REFRESH_TOKEN_SECRET_KEY,
} from "../../../../config/config.service.js";
import { UserModel, findOne } from "../../../DB/index.js";
import { TokentypeEnum } from "../enums/security.enum.js";
import { conflictException } from "../respons/error.response.js";
import { roleEnum } from "../enums/user.enum.js";
import {  notFoundException } from "../respons/error.response.js";

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


// export const detectSignturesLevel = async (level) => {
//   let signtures = {accessSignture:undefined , refreshSignture:undefined}
//   switch (tokenType) {
//     case roleEnum.Admin :
//       signtures = {accessSignture:SYSTEM_ACCESS_TOKEN_SECRET_KEY ,refreshSignture:SYSTEM_REFRESH_TOKEN_SECRET_KEY }
//       break;
  
//     default:
//       signtures = {accessSignture:USER_ACCESS_TOKEN_SECRET_KEY ,refreshSignture:USER_REFRESH_TOKEN_SECRET_KEY }
//       break;
//   }
//   return signtures
// }

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



// export const decodeToken = async (token , tokenType =TokentypeEnum.Access) => {
//   const decodeToken = jwt.decode(token);
//   console.log(decodeToken);

//   if (!decodeToken.aud?.length) {
//     throw BadRequestException({message:'Missing token audience'})

//   }
//   const[tokenApproach ,level]=decodeToken.aud || [];
//   console.log(tokenApproach);


//   if (tokenType !== tokenApproach) {
//     throw conflictException({message: `unexpected Token mechanism we expected ${tokenType} while you have used ${tokenApproach}`})
//   }
//   const secret =await getTokenSignture({tokenType:tokenApproach , level})
  
//   const verfiedData = jwt.verify(token, secret);
//   console.log({ verfiedData });
//   const user = await findOne({
//     model: UserModel,
//     filter: { _id: verfiedData.sub },
//   });

//   if (!user) {
//     throw notFoundException({ message: "Not register account" });
//   }

//   return user
// };

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

  return user;
};


export const createLoginCredentials = async (user, issuer) => {
  const {accessSignture , refreshSignture} = await detectSignturesLevel(user.role)
  // const access_token = await generateToken({
  //   options: {
  //     subject: user._id.toString(),
  //     secret:accessSignture,
  //     issuer,
  //     audience: [TokentypeEnum.Access , user.role],
  //     // noTimestamp:true,
  //     // notBefore:60,
  //     expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  //   },
  // });

  const access_token = await generateToken({
  secret: accessSignture,
  options: {
    subject: user._id.toString(),
    issuer,
    audience: [TokentypeEnum.Access, user.role],
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
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
    },
  });

  return {
    message: "Login successful",
    access_token,
    refresh_token,
  };
};
