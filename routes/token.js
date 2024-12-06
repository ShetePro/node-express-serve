import { getDatabaseCollection } from "../database/mongodb.js";
import { getRequestBody } from "../utils/request.js";
import { successResponse } from "../utils/responseUtil.js";
import { aesDecrypt, rsaPublicKey } from "../utils/aes.js";
import bcrypt from "bcrypt";
import { createJwt, createRefreshToken, refreshJWT } from "../utils/jwt.js";
import { urlPrefix } from "./index.js";

export default function initTokenRouter(app) {
  app.get("/rsaKey", async (req, res) => {
    res.setHeader("Content-Type", "text/plain");
    res.send(
      successResponse(rsaPublicKey.export({ type: "pkcs1", format: "pem" })),
    );
  });
  app.post("/refreshToken", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "未提供 Refresh Token" });
    }

    const token = refreshJWT(refreshToken);
    console.log(token, "new token");
    if (!token) {
      return res.status(403).json({ message: "token已过期 请重新登陆" });
    }
    return res.send(successResponse(token));
  });
  app.post("/token", async (req, res, next) => {
    console.log("token");
    const { userName, password, key } = getRequestBody(req);
    const originPassword = aesDecrypt(password, key);
    if (!key) {
      res.send({
        code: 400,
        data: null,
        msg: "错误的加密信息",
      });
      return;
    }
    const collection = getDatabaseCollection("user");
    const userInfo = await collection.findOne({ userName: userName });
    if (!userInfo) {
      return res.send({
        code: 400,
        data: null,
        msg: "账号不存在",
      });
    }
    const result = await bcrypt.compare(originPassword, userInfo.password);
    if (result) {
      // 生成 Token (有效期 1 小时)
      const token = createJwt(userInfo);
      const refreshToken = createRefreshToken(userInfo);
      return res.send(
        successResponse({
          token,
          refreshToken,
        }),
      );
    }
    return res.send({
      code: 400,
      data: null,
      msg: "账号或密码错误",
    });
  });
  // 获取用户详情
  app.get(`${urlPrefix}/user`, async function (req, res) {
    const user = req.user;
    const collection = getDatabaseCollection("user");
    const userInfo = await collection.findOne({ userName: user.userName });
    return res.send(successResponse(userInfo));
  });
  app.post(`${urlPrefix}/userExist`, async function (req, res) {
    const { userName } = getRequestBody(req);
    const collection = getDatabaseCollection("user");
    const isExist = collection.findOne({ userName });
    return res.send(successResponse(isExist));
  });
  app.post("/register", async function (req, res) {
    const { userName, password, key } = getRequestBody(req);
    const collection = getDatabaseCollection("user");
    console.log(userName);
    const isExist = await collection.findOne({ userName });
    console.log(isExist);
    if (isExist) {
      return res.send({
        code: 400,
        data: null,
        msg: "用户名已存在",
      });
    }
    const originPassword = aesDecrypt(password, key);
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(originPassword, salt, async function (err, hash) {
        if (err) {
          res.send({
            code: 500,
            data: null,
            msg: "密码hash出错",
          });
          return;
        }
        await collection.insertOne({ userName, password: hash });
        res.send(successResponse(true));
      });
    });
  });
}
