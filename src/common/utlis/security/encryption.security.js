import crypto, { Decipheriv } from "node:crypto";
import {
  IV_LENGTH,
  ENC_SECRET_KEY,
} from "../../../../config/config.service.js";

export const generateEncryption = async (plainText) => {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipherIV = crypto.createCipheriv("aes-256-cbc", ENC_SECRET_KEY, iv);
  let ciphertext = cipherIV.update(JSON.stringify(plainText), "utf-8", "hex");
  ciphertext = cipherIV.final("hex");
  console.log({ iv, IVT: iv.toString("hex"), cipherIV, ciphertext });
  return `${iv.toString("hex")}:${ciphertext}`;
};

export const generateDecryption = async (ciphertext) => {
  const [iv, encryptedData] = ciphertext.split(":") || [];
  const ivLikeBinary = Buffer.from(iv, "hex");
  let dicipherIV = crypto.createDecipheriv("aes-256-cbc", ENC_SECRET_KEY, ivLikeBinary)
  let plainText = dicipherIV.update(encryptedData , 'hex' , 'utf-8')
  plainText += dicipherIV.final('utf-8')
  console.log({ iv, encryptedData, ivLikeBinary ,dicipherIV , plainText });
  return plainText
};
