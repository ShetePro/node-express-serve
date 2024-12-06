import { getDatabaseCollection } from "../database/mongodb.js";
import {
  clear_id,
  getMongodbList,
  successResponse,
} from "../utils/responseUtil.js";
import { urlPrefix } from "./index.js";
import { ObjectId } from "mongodb";

export default function initGoodsRouter(app) {
  app.post(`${urlPrefix}/goods`, async (req, res) => {
    const body = {
      ...req.body,
      createDate: Date.toString(),
    };
    const collection = getDatabaseCollection("goods");
    if (!body.goodsName) {
      return res.send({
        code: 400,
        data: null,
        msg: "商品名称不能为空",
      });
    }
    const result = await collection.insertOne({
      ...body,
      addUser: req.user?.id,
    });
    return res.send(successResponse(result?._id));
  });
  // 商品列表
  app.get(`${urlPrefix}/goodsList`, async (req, res) => {
    const user = req.user;
    const sort = { createDate: -1 };
    const collection = getDatabaseCollection("goods");
    const result = collection.find({ addUser: user.id }).sort(sort);
    const list = await getMongodbList(result);
    return res.send(successResponse(list));
  });

  // 商品详情
  app.get(`${urlPrefix}/goods/:id`, async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const collection = getDatabaseCollection("goods");
    const result = await collection.findOne({
      addUser: user.id,
      _id: new ObjectId(id),
    });
    return res.send(successResponse(clear_id(result)));
  });
  app.post(`${urlPrefix}/goods/record`, async (req, res) => {
    const body = {
      ...req.body,
      createDate: Date.now(),
      operator: req.user.id,
    };

    if (!body.goodsId) {
      return res.send({
        code: 400,
        data: null,
        msg: "商品不存在",
      });
    }
    if (!body.type) {
      return res.send({
        code: 400,
        data: null,
        msg: "操作类型不能为空",
      });
    }
    const collection = getDatabaseCollection("goods_record");
    const goodsCollection = getDatabaseCollection("goods");
    const num = body.type === 1 ? body.quantity : -body.quantity;
    const goods = await goodsCollection.updateOne(
      {
        _id: new ObjectId(body.goodsId),
      },
      {
        $currentDate: {
          updateDate: true,
        },
        $inc: { quantity: num },
      },
    );
    const result = await collection.insertOne(body);
    return res.send(successResponse(result?._id));
  });
  // 商品销售记录列表
  app.post(`${urlPrefix}/goods/recordList`, async (req, res) => {
    const user = req.user;
    const { goodsId, type } = req.body;
    if (!goodsId) {
      return res.send({
        code: 400,
        data: null,
        msg: "商品id不能为空",
      });
    }
    const sort = { createDate: -1 };
    const query = { operator: user.id, goodsId };
    if (type) {
      query.type = type;
    }
    const collection = getDatabaseCollection("goods_record");
    const result = collection.find(query).sort(sort);
    const list = await getMongodbList(result);
    return res.send(successResponse(list));
  });
}
