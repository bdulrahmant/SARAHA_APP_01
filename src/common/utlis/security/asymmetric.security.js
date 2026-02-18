import fs from "fs";
import path from "path";
import crypto from "crypto";


const publicKey = fs.readFileSync(
  path.resolve("keys/public.key"),
  "utf8"
);

const privateKey = fs.readFileSync(
  path.resolve("keys/private.key"),
  "utf8"
);



export const encryptWithPublicKey = (data) => {

  const buffer = Buffer.from(data, "utf8");

  const encrypted = crypto.publicEncrypt(
    publicKey,
    buffer
  );

  return encrypted.toString("base64");

};



export const decryptWithPrivateKey = (encryptedData) => {

  const buffer = Buffer.from(encryptedData, "base64");

  const decrypted = crypto.privateDecrypt(
    privateKey,
    buffer
  );

  return decrypted.toString("utf8");

};
