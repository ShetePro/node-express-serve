import crypto from "crypto";

const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
export const rsaPublicKey = publicKey;

// 配置加密参数
const algorithm = "aes-256-cbc"; // 加密算法
// const key = crypto.randomBytes(32); // 32字节的密钥
const iv = Buffer.from("1234567890abcdef", "utf8"); // 16字节的初始化向量
function aesEncrypt(text, key) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "base64"); // 输入为utf8字符串，输出为hex
  encrypted += cipher.final("base64");
  console.log(encrypted, "aes加密后");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "base64", "utf8"); // 输入为hex，输出为utf8字符串
  decrypted += decipher.final("utf8");
  console.log(decrypted, "解密后");
  return encrypted;
}

// 解密 AES 密钥
function decryptAESKey(encryptedKey) {
  const buffer = Buffer.from(encryptedKey, "base64");
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    buffer,
  );
}
// 解密函数
export const aesDecrypt = (encryptedText, key) => {
  try {
    console.log("RSA解密前", key);
    const aesKey = decryptAESKey(key);
    console.log("RSA解密后的AES Key", aesKey.toString("base64"));
    const decipher = crypto.createDecipheriv(algorithm, aesKey, iv);
    let decrypted = decipher.update(encryptedText, "base64", "utf8");
    decrypted += decipher.final("utf8");
    console.log("解密完成:", decrypted);
    return decrypted;
  } catch (e) {
    console.log(e);
  }
};

// const text = aesEncrypt("abac");
// console.log(text)
// console.log('解密成功', aesDecrypt(text))
