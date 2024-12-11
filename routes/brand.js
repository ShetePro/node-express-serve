import { urlPrefix } from "./index.js";
import { getDatabaseCollection } from "../database/mongodb.js";
import {
  clear_id,
  getMongodbList,
  successResponse,
} from "../utils/responseUtil.js";
import {
  addBrand,
  getBrandDetail,
  getBrandMonthStatistics,
} from "./utils/brandUtil.js";
import { ObjectId } from "mongodb";

export default function initBrandRouter(app) {
  // 新增
  app.post(`${urlPrefix}/brand`, async (req, res) => {
    const body = {
      ...req.body,
      createDate: Date.now(),
      addUser: req.user.id,
    };
    if (!body.brandName) {
      return res.send({
        code: 400,
        data: null,
        msg: "品牌名称不能为空",
      });
    }
    const result = await addBrand(body);
    return res.send(successResponse(result));
  });
  // 品牌列表
  app.get(`${urlPrefix}/brand/list`, async (req, res) => {
    const user = req.user;
    const sort = { createDate: -1 };
    const collection = getDatabaseCollection("brand");
    const result = collection.find({ addUser: user.id }).sort(sort);
    const list = await getMongodbList(result);
    return res.send(successResponse(list));
  });
  // 品牌详情
  app.get(`${urlPrefix}/brand/:id`, async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const result = await getBrandDetail({
      addUser: user.id,
      _id: new ObjectId(id),
    });
    return res.send(successResponse(result));
  });
  // 品牌月度销售
  app.get(`${urlPrefix}/brand/month-statistics/:id`, async (req, res) => {
    const { id } = req.params;
    const result = await getBrandMonthStatistics(id);
    return res.send(successResponse(result));
  });
}
