import { genSalt, hash } from "bcrypt";
import { SALT_ROUND } from "../../../../config/config.service.js";

export const generateHash = async (plainText, salt = SALT_ROUND) => {

    const generateSalt = await genSalt(salt);

    console.log("generated salt =", generateSalt);

    return await hash(String(plainText), generateSalt);
}
