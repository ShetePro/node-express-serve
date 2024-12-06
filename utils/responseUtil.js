export function successResponse(data) {
  return {
    code: 200,
    data,
    msg: "success",
  };
}
export async function getMongodbList(result) {
  const list = [];
  for await (const doc of result) {
    list.push(clear_id(doc));
  }
  return list;
}

export function clear_id(data) {
  const obj = {
    ...data,
    id: data._id.toString(),
  };
  delete obj._id;
  return obj;
}
