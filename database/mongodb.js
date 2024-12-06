import { MongoClient } from "mongodb";
const uri =
  "mongodb+srv://sheteprolin:z6Ck1N7veonU79HP@cluster0.yci6a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let client = null;
let database = null;
export async function initMongoDB() {
  try {
    client = new MongoClient(uri);
    // Get the database and collection on which to run the operation
    database = client.db("stock_keeper");
  } catch (error) {
    console.log(error, 'close mongodb');
    await client.close();
  }
}

export function getDatabaseCollection(collectionName) {
  if (collectionName) {
    return database.collection(collectionName);
  }
}
