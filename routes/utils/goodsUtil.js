import { getDatabaseCollection } from "../../database/mongodb.js";
import { ObjectId } from "mongodb";
import { getBrandDetail } from "./brandUtil.js";

export async function getGoodsById(id) {
  const goodsCollection = getDatabaseCollection("goods");
  return await goodsCollection.findOne({
    _id: new ObjectId(id),
  });
}
export async function setGoodsProfit(body, collection) {
  let num = body.quantity;
  let buyTotal = 0;
  const profitCollection = getDatabaseCollection("goods_profits");
  const buyRecords = await collection.find({
    goodsId: body.goodsId,
    type: 1,
    $expr: { $ne: ["$quantity", "$sellNum"] },
  });
  const sellData = [];
  for await (const buy of buyRecords) {
    const { price, sellNum, quantity } = buy;
    const over = quantity - sellNum; // 剩余的入库数量
    if (over === 0) break;
    const isOver = num > over; // 是否全部出售
    buyTotal += isOver ? over * price : num * price;
    sellData.push({
      id: buy._id.toString(),
      price: buy.price,
      quantity: num > over ? quantity : num,
    });
    // 处理入库的商品
    if (isOver) {
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
    netProfit: body.totalNum - buyTotal,
    brand: body.brand,
    quantity: body.quantity,
    price: body.price,
    totalNum: body.totalNum,
    sellData,
    createDate: Date.now(),
  });
}
export async function getGoodsDetailSearch(params) {
  const collection = getDatabaseCollection("goods");
  const result = await collection.findOne(params);
  if (result.brand) {
    result.brandData = await getBrandDetail({
      _id: new ObjectId(result.brand),
    });
  }
  return result;
}
export async function setGoodsSales(id, sales) {
  const goodsCollection = getDatabaseCollection("goods");
  goodsCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $inc: { sales: sales },
    },
  );
}
