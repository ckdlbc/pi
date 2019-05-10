import env from "@pi/env";
import logs from "@pi/log";
import spawn from "cross-spawn";
import dargs from "dargs";
import _ from "lodash";

const fly = require("flyio");
const log = logs("core-npm");
export class NPM {
  /**
   * 安装 npm 包
   * @param pkg {string|array} 需要安装的包或包列表, 需要带版本号直接在包名后面 @ 版本号即可
   * @param options
   */
  public async install(pkg: string | string[], options: any) {
    const installer = require("npminstall/bin/install.js");
    await this.runInstall(installer, pkg, options);
  }

  /**
   * 移除npm包
   */
  public async unInstall(pkg: string | string[], options: any) {
    const installer = require("npminstall/bin/uninstall.js");
    await this.runInstall(installer, pkg, options);
  }

  /**
   * 安装package.json 中的依赖
   */
  public async installDependencies(options?: any) {
    const installer = require.resolve("npminstall/bin/install.js");
    await this.runInstall(installer, [], options);
  }

  /**
   * 安装 npm 包
   * @param installer {string} 安装工具路径
   * @param paths {string|array} 需要安装的包或包列表,需要带版本号直接在包名后面 @ 版本号即可, 留空安装当前目录下的 package.json 依赖
   * @param options
   */
  public async runInstall(installer: string, paths: any, options: any) {
    const registry = this.getRegistry();
    // npm默认值
    const option = _.defaults(options || {}, {
      registry,
      china: true,
      stdio: "inherit",
      cwd: process.cwd()
    });

    // 云构建下，使用npminstall包，有时候会卡住装不上。
    // 还是使用云构建自带的tnpm版本进行安装吧。
    if (process.env.BUILD_ENV === "cloud") {
      installer = "tnpm";
      paths = ["ii"].concat(paths);
      delete option.registry;
      delete option.china;
    }

    log.debug("installer = %s", installer);

    // 将pkg进行扁平化
    if (!Array.isArray(paths) && paths) {
      paths = paths.split(" ") || [];
    }

    // TODO 确认一下是不是这样用法
    const args = paths.concat(
      dargs(option, {
        aliases: {
          S: "-save",
          D: "-save-dev",
          O: "-save-optional",
          E: "-save-exact"
        }
      })
    );
    log.debug("args = %o", args);
    log.debug("options = %o", option);
    return new Promise((resolve, reject) => {
      spawn(installer, args, option)
        .on("error", e => {
          reject(e);
        })
        .on("exit", err => {
          if (err) {
            reject(new Error(`install ${paths} error`));
          } else {
            resolve();
          }
        });
    });
  }

  /**
   * 是否存在模块
   * @param name
   */
  public async has(name: string, options: any) {
    const registry = this.getRegistry();
    options = {
      registry,
      ...options
    };
    const url = `${options.registry}${encodeURIComponent(name)}/latest`;
    log.debug("check module has =%s", url);
    const res = await fly.request({
      url: `${options.registry}${encodeURIComponent(name)}/latest`,
      method: "HEAD"
    });
    return /4\d\d/.test(res.statusCode) === false;
  }

  /**
   * 根据内外网区分来获取npm地址
   * @returns {string}
   */
  public getRegistry() {
    const isIntranet = env.isIntranet();
    const registry = isIntranet
      ? "http://111.231.133.21:4873/"
      : "http://registry.npm.taobao.org/";
    log.debug(registry);
    return registry;
  }

  /**
   * 获取最新的包信息
   */
  public async latest(name: string, options?: any) {
    const registry = this.getRegistry();
    options = {
      registry,
      version: "latest",
      ...options
    };

    let data = null;
    try {
      const url = `${options.registry}${encodeURIComponent(name)}/${
        options.version
      }`;
      log.debug(`get ${name} url = %s`, url);
      const res: any = await fly.request(url);
      data = res.data;
      if (!data) {
        data = null;
      }
    } catch (e) {
      // 返回数据出错
      data = null;
    }
    return data;
  }
}
export default new NPM();
