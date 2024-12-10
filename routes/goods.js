import { getDatabaseCollection } from "../database/mongodb.js";
import {
  clear_id,
  getMongodbList,
  successResponse,
} from "../utils/responseUtil.js";
import { urlPrefix } from "./index.js";
import { ObjectId } from "mongodb";
import { getCurrentTimestamp } from "../utils/date.js";

export default function initGoodsRouter(app) {
  // 新增
  app.post(`${urlPrefix}/goods`, async (req, res) => {
    const body = {
      ...req.body,
      createDate: Date.toString(),
    };
    if (!body.goodsName) {
      return res.send({
        code: 400,
        data: null,
        msg: "商品名称不能为空",
      });
    }
    const collection = getDatabaseCollection("goods");
    const result = await collection.insertOne({
      ...body,
      addUser: req.user?.id,
    });
    const goods = await collection.findOne({
      _id: result.insertedId,
    });
    // 同步添加到goods record中
    const recordCollection = await getDatabaseCollection("goods_record");
    recordCollection.insertOne({
      goodsId: goods._id.toString(),
      quantity: goods.quantity,
      totalNum: goods.quantity * goods.price,
      price: goods.price,
      type: 1,
      createDate: Date.now(),
      operator: req.user.id,
    });
    return res.send(successResponse(goods?._id));
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
  // 入库 or 出货
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
    if (body.type === 2) {
      await setGoodsProfit(body, collection);
    } else {
      body.sellNum = 0;
    }
    await goodsCollection.updateOne(
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
  // 商品月度统计
  app.post(`${urlPrefix}/goods/month-statistics`, async (req, res) => {
    const { goodsId } = req.body;
    if (!goodsId) {
      return res.send({
        code: 400,
        data: null,
        msg: "商品id不能为空",
      });
    }
    const sort = { createDate: -1 };
    const [startTime, endTime] = getCurrentTimestamp();
    console.log(startTime, endTime);
    const query = {
      goodsId,
      // createdDate: {
      //   $gte: startTime,
      //   $lte: endTime,
      // },
    };
    const statisticsData = {
      sellNum: 0,
      sellPrice: 0,
      profitPrice: 0,
    };
    const collection = getDatabaseCollection("goods_profits");
    const result = await collection.find(query).sort(sort);
    for await (const record of result) {
      console.log(record, "record");
      statisticsData.sellNum += record.quantity;
      statisticsData.sellPrice += record.price * record.quantity;
      statisticsData.profitPrice += record.netProfit;
    }
    console.log(statisticsData);
    return res.send(successResponse(statisticsData));
  });
}
export async function setGoodsProfit(body, collection) {
  let profit = 0;
  let num = body.quantity;
  const profitCollection = getDatabaseCollection("goods_profits");
  const buyRecords = await collection.find({
    goodsId: body.goodsId,
    type: 1,
    $expr: { $ne: ["$quantity", "$sellNum"] },
  });
  const sellData = [];
  for await (const buy of buyRecords) {
    const { price, sellNum, quantity } = buy;
    const over = quantity - sellNum;
    if (over === 0) break;
    const isOver = num > over; // 是否全部出售
    const sellPrice = isOver
      ? over * (body.price - price)
      : num * (body.price - price);
    sellData.push({
      id: buy._id.toString(),
      price: buy.price,
      quantity: num > over ? quantity : num,
      sellPrice,
    });
    // 处理入库的商品
    if (isOver) {
      profit += sellPrice;
      num -= over;
      collection.updateOne(
        {
          _id: buy._id,
        },
        {
          $set: { sellNum: Number(quantity) },
        },
      );
    } else {
      profit += sellPrice;
      collection.updateOne(
        {
          _id: buy._id,
        },
        {
          $set: { sellNum: Number(sellNum + num) },
        },
      );
      break;
    }
  }
  return await profitCollection.insertOne({
    goodsId: body.goodsId,
    netProfit: profit,
    quantity: body.quantity,
    price: body.price,
    sellData,
    createDate: Date.now(),
  });
}
