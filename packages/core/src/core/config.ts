const sudoBlock = require("sudo-block");
const pkg = require("../../package.json");

// 禁止 sudo 执行 PI 命令
sudoBlock();

/**
 * 初始化开发环境
 * 需要在require其他包之前先进行初始化
 * @param obj
 */
function initConfig(obj: any) {
  Object.keys(obj).forEach(item => {
    if (!process.env[item]) {
      process.env[item] = obj[item];
    }
  });
}
function setEnvKey(key: string) {
  return `PI_${key.toLocaleUpperCase()}`;
}

// function setEnvConfig(key: string, val: any) {
//   return { [setEnvKey(key)]: val };
// }

// const obj = {
//   VERSION: pkg.version,
//   PACKAGE: pkg.name,
//   MODULE_PREFIX:'pi',
//   "CONFIG_FILE":""
// }
// 运行前的一些初始化配置工作，这些内容将存于PI的运行时
initConfig({
  [setEnvKey("VERSION")]: pkg.version,
  [setEnvKey("PACKAGE")]: pkg.name,
  [setEnvKey("BIN")]: Object.keys(pkg.bin)[0], // 获取套件命令
  [setEnvKey("MODULE_PREFIX")]: "pi",
  [setEnvKey("CONFIG_FILE")]: "pi.config.js",
  [setEnvKey("HOME_FOLDER")]: ".pi"
});
