import initTokenRouter from "./token.js";
import initGoodsRouter from "./goods.js";
import { authenticateJWT } from "../utils/jwt.js";
import initBrandRouter from "./brand.js";

export const urlPrefix = "/api";
export default function initRoutes(app) {
  // 认证路由
  app.use(urlPrefix, authenticateJWT);
  initTokenRouter(app);
  initGoodsRouter(app);
  initBrandRouter(app);
}
