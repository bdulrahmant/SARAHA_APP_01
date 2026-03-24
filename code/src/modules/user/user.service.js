import { createOne, deleteMany, findOne } from "../../DB/database.repository.js";
import { tokenModel, UserModel } from "../../DB/index.js";
import { compareHash, conflictException, createLoginCredentials, decodeToken, generateDecryption, generateEncryption, generateHash, notFoundException } from "../../common/utlis/index.js";
import { logoutEnum, TokentypeEnum } from "../../common/utlis/enums/security.enum.js";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../../../config/config.service.js";
import { baseRevokeTokenKey, deleteKey, keys, revokeTokenKey, set } from "../../common/services/redis.service.js";


const createRvokeToken = async ({userId , jti , ttl}) => {
        await set({
        key:revokeTokenKey({userId , jti}),
        value:jti,
        ttl
      })
      return;
}


export const logout = async ({ flag }, user , {jti , iat}) => {
  let status=200
  switch (flag) {
    case logoutEnum.All:
        user.changeCredentialTime= new Date()
        await user.save()

        await deleteKey(await keys(baseRevokeTokenKey(user._id)))

      break;
  
    default:
      // await createOne({
      //   model:tokenModel,
      //   Data:{
      //     userId:user._id,
      //     jti,
      //     expiresIn:new Date((iat + REFRESH_TOKEN_EXPIRES_IN)*1000)
      //   }
      // })
      await createRvokeToken({
        userId:user._id,
        jti,
        ttl: iat + REFRESH_TOKEN_EXPIRES_IN
      })
      status=201
      break;
  }

  return status;
};


export const profileImage = async (files  , user) => {

  user.profilePicture = files?.finalPath
  await user.save()

  return user;
};



export const profileCoverImages = async (file , user) => {

  user.coverPictures = file.finalPath
  await user.save()

  return user;
};


export const profile = async (authorization) => {
  const token = authorization?.startsWith("Bearer ")
    ? authorization.split(" ")[1]
    : authorization;
  const account = await decodeToken(token);

  return account;
};


export const shareProfile = async (userId) => {
  const account = await findOne({model:UserModel , filter:{_id:userId}, select:"-password"});
  if (!account) {
    throw notFoundException({message:"invalid shared account"})
  }
  if (account.phone) {
    account.phone =await generateDecryption(account.phone)
  }
  return account

}


export const rotateToken = async (user , {sub,jti , iat} ,issuer) => {

      if ((iat+ACCESS_TOKEN_EXPIRES_IN) * 1000 > Date.now()+(30000)) {
        throw conflictException({message:"Current access tokin still valid"})
      }
      await createRvokeToken({
        userId:sub,
        jti,
        ttl: iat + REFRESH_TOKEN_EXPIRES_IN
      })
return await createLoginCredentials(user, issuer)
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


export const updatePassword = async ({ oldPassword , password }, user , issuer) => {
  console.log({ oldPassword, userPassword: user?.password });
  if (!await compareHash({ plaintext:oldPassword , ciphertext:user.password })) {
    throw conflictException({message:'invalid old password'})
  }
  for (const hash of user.oldPassword || []) {
     if (await compareHash({ plaintext:password , ciphertext:hash })) {
    throw conflictException({message:'this password is already used before'})
  }
  }

  user.oldPassword.push(user.password)
  user.password = await generateHash(password)
  user.changeCredentialTime = new Date();
  await user.save()

  await deleteKey(await keys(baseRevokeTokenKey(user._id)))
  return await createLoginCredentials(user , issuer);

};