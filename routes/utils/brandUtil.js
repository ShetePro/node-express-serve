import { getDatabaseCollection } from "../../database/mongodb.js";
import { ObjectId } from "mongodb";
import { clear_id } from "../../utils/responseUtil.js";
import { getCurrentTimestamp } from "../../utils/date.js";

export async function addBrand(body) {
  const collection = getDatabaseCollection("brand");
  const result = await collection.insertOne({
    ...body,
  });
  return result.insertedId.toString();
}

export async function getBrandDetail(params) {
  const collection = getDatabaseCollection("brand");
  const result = await collection.findOne(params);
  return clear_id(result);
}
export async function getBrandMonthStatistics(id) {
  const recordCollection = getDatabaseCollection("goods_profits");
  const [startTime, endTime] = getCurrentTimestamp();
  const statisticsData = {
    sellNum: 0,
    sellPrice: 0,
    profitPrice: 0,
  };
  const result = await recordCollection.find({
    brand: id,
    createDate: {
      $gte: startTime,
      $lte: endTime,
    },
  });
  for await (const record of result) {
    statisticsData.sellNum += record.quantity;
    statisticsData.sellPrice += record.totalNum;
    statisticsData.profitPrice += record.netProfit;
  }
  return statisticsData;
}
