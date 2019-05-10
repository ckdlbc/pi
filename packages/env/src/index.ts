import home from "@pi/home";
import fs from "fs-extra";
import * as path from "path";

// PI env的配置文件
const FILE_ENV = "pi.env.json";
let cacheEnv: any = null;

export class Env {
  /**
   * 往配置文件(pi.env.json)写入用户自定义的环境配置
   * @param env
   */
  public setEnv(env: string) {
    home.initHomeDir();
    const envFile = path.join(home.getHomePath(), FILE_ENV);
    const envData = {
      env
    };
    // debug('set PI env data : %o', envData);
    // debug('set PI to : %s', envFile);
    cacheEnv = null;
    fs.outputJsonSync(envFile, envData);
  }

  /**
   * 判断PI环境配置文件(pi.env.json)是否存在
   * 可用做PI环境是否已初始化的判断
   * @returns {boolean}
   */
  public hasConfigFile() {
    const envFile = path.join(home.getHomePath(), FILE_ENV);
    return fs.existsSync(envFile);
  }

  /**
   * 是否是内网环境
   * 优先判断process.env.PI_ENV变量,值为intranet,则返回true
   * @returns {boolean} 若是公司内网,则返回true,否则为false
   */
  public isIntranet() {
    // 如果有环境变量,则优先使用环境变量的值
    const envGlobal = process.env.PI_ENV;
    if (envGlobal && envGlobal === "intranet") {
      return true;
    } else if (envGlobal && envGlobal === "extranet") {
      return false;
    }

    // 内外网判断
    // 由于该方法调用频繁,在这里使用一个cacheEnv对象做为缓存,避免频繁的IO操作
    let envData;
    if (cacheEnv) {
      envData = cacheEnv;
    } else {
      const envFile = path.join(home.getHomePath(), FILE_ENV);

      if (fs.existsSync(envFile)) {
        envData = fs.readJsonSync(envFile);
        cacheEnv = envData;
      }
    }
    // 注意: 若json文件不存在时,默认视为内网环境,向下兼容
    return !(envData && envData.env === "extranet");
  }

  /**
   * 删除PI环境配置文件(pi.env.json)
   */
  public removeConfigFile() {
    fs.removeSync(path.join(home.getHomePath(), FILE_ENV));
    cacheEnv = null;
  }
}

const env = new Env();

export default env;
