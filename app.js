import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "node:fs";
import { initMongoDB } from "./database/mongodb.js";
import initRoutes from "./routes/index.js";
const app = express();
const __filename = fileURLToPath(import.meta.url);
// 获取 __dirname（当前文件所在的目录）
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.set("view engine", "ejs");
app.set("doc", path.join(__dirname, "doc"));
app.all("*", function (req, res, next) {
  //设置允许跨域的域名，*代表允许任意域名跨域
  res.header("Access-Control-Allow-Origin", "*");
  //允许的header类型
  res.header("Access-Control-Allow-Headers", "content-type");
  //跨域允许的请求方式
  res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS");
  if (req.method.toLowerCase() === "options")
    res.send(200); //让options尝试请求快速结束
  else next();
});

app.get("/", (req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  fs.createReadStream(__dirname + "/doc/index.html").pipe(res);
});

initMongoDB().then(() => {
  console.log("初始化MongoDb");
});
// 初始化接口
initRoutes(app);

let port = process.env.PORT || "8796";
console.log("Node服务地址: http://localhost:" + port);
app.listen(port);
