// 获取当前月份时间戳
export function getCurrentTimestamp() {
  const now = new Date();
  const startOfMonth = +new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = +new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return [startOfMonth, endOfMonth];
}
