import Intl from "@pi/intl";
import logs from "@pi/log";
import * as fs from "fs";
import * as path from "path";
import message from "./locale";

const log = logs("core-config");

export class Config {
  // 先从环境变量里获取pi配置文件的目录，这样方便做调试
  public CWD = process.cwd();

  /**
   * 当前目录下是否存在pi.config.js文件
   * @param {string} dir 需要判断文件是否存在的目录,可选,默认取值:当前运行目录
   */
  public exist(dir?: string) {
    const cwd = dir || this.getConfigPath();
    const configPath = path.join(cwd, this.getConfigName());
    return fs.existsSync(configPath);
  }

  /**
   * 根据key获取pi.config.js的单个对象
   * @param key 配置的键名
   * @param dir 配置文件的路径
   * @return object
   */
  public get(key: string, dir?: string) {
    const file = this.getAll(dir || "");
    log.debug("key = %s ,all config = %o", key, file);

    return file ? file[key] : null;
  }

  /**
   * 获取整个pi.config.js文件的内容
   */
  public getAll(dir: string) {
    const cwd = dir || this.getConfigPath();
    const configName = this.getConfigName();
    // 先判断文件是否存在,存在的话才读取
    if (!this.exist(cwd)) {
      return null;
    }
    // 直接使用require的话,会有缓存， 需要先删除 require 的缓存
    const configPath = path.join(cwd, configName);
    delete require.cache[configPath];
    try {
      const file = require(configPath);
      log.debug("get %s , file = %o", configName, file);
      return file;
    } catch (e) {
      const intl = new Intl(message);
      log.error(intl.get("readConfigError", { file: configName }));
      log.error(intl.get("moreDetail"));
      log.error(e && e.stack);
      // report.error(e.code || "config-error", e.stack || e, true);
      return process.exit(1);
    }
  }

  /**
   * 获取套件的名字
   */
  public getToolkitName(dir?: string) {
    const config = this.getAll(dir || "");
    if (!config) {
      return null;
    }
    if (config.toolkit) {
      return config.toolkit;
    } else if (config.toolkitName) {
      return config.toolkitName;
    }
    return null;
  }

  /**
   * 获取配置文件的名称
   * @returns {string|string}
   */
  public getConfigName() {
    return process.env.PI_CONFIG_FILE || "pi.config.js";
  }

  /**
   * 获取config.js的文件路径
   */
  public getConfigPath() {
    return process.env.PI_CONFIG_PATH || this.CWD;
  }

  /**
   * 获取运行时的pi命令
   */
  public getBinName() {
    return process.env.PI_BIN || "pi";
  }

  /**
   * 获取运行时的pi版本
   */
  public getBinVersion() {
    return process.env.PI_VERSION || "无版本号";
  }
}
export default new Config();
