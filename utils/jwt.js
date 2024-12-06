import jwt from "jsonwebtoken";

export const secretKey = "sheteprolin@1998";
export const refreshKey = "sheteprolin@0511";

// 创建jwt
export function createJwt(userInfo) {
  return jwt.sign(
    { id: userInfo._id, userName: userInfo.userName },
    secretKey,
    { expiresIn: "1h" },
  );
}
export function createRefreshToken (userInfo) {
  return jwt.sign(
    { id: userInfo._id, userName: userInfo.userName },
    refreshKey,
  );
}
export function refreshJWT(refreshToken) {
  try {
    // 验证 Refresh Token
    const decoded = jwt.verify(refreshToken, refreshKey);
    console.log(decoded, 'decoded');
    // 生成新的 Access Token
    return jwt.sign({ id: decoded.id, userName: decoded.userName }, secretKey, {
      expiresIn: "1h",
    });
  } catch (err) {}
}

// 获取jwt 信息
export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({ msg: "未提供 Token" });
  }
  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, secretKey);
    next();
  } catch (err) {
    return res.status(401).json({ msg: "无效的 Token" });
  }
}
