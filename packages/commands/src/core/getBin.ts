/**
 * 获取pi的实际命令
 * @returns {*|string}
 */
export function getBin() {
  return process.env.PI_BIN || "pi";
}

export default getBin;
