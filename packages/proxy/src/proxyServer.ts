/**
 * @desc: 代理服务器
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-30 10:25:43
 * @LastEditTime: 2019-04-30 11:22:34
 */
import BasicServer, { IOptions } from "./basicServer";
const koaServerProxy = require("koa-server-http-proxy");

export default class ProxyServer extends BasicServer {
  public proxyRules: any;
  constructor() {
    super();
  }

  /**
   * 启动代理服务器
   */
  public startProxy(option?: IOptions) {
    if (option) {
      option.name = "代理";
    }
    this.init();
    // 若存在代理规则，则生成规则中间件
    if (
      typeof this.proxyRules === "object" &&
      Object.keys(this.proxyRules).length
    ) {
      const mids = Object.entries(this.proxyRules).map(([key, val]) =>
        koaServerProxy(key, val)
      );
      mids.forEach(mid => {
        this.server.use(mid);
      });
    }

    return this.start(option);
  }

  /**
   * 重启代理服务器
   */
  public restartProxy() {
    this.stop();
    return this.startProxy();
  }

  /**
   * 添加代理规则
   * @param proxyRules
   */
  public addProxyRule(proxyRules: any) {
    this.proxyRules = proxyRules || {};
  }
}
