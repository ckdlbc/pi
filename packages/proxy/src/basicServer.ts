import { Server } from "http";
import Koa from "koa";

import logs from "@pi/log";
const log = logs("core-proxy-server");

export interface IOptions {
  // 服务器名称
  name: string;
  // 服务器端口
  port: number;
}

export default class BasicServer {
  public options!: IOptions;
  public server!: Koa;
  public serverListen: Server | null;
  constructor() {
    this.serverListen = null;
    this.options = {
      name: "",
      port: 9999
    };
  }
  /**
   * 初始化服务器
   */
  public init() {
    this.serverListen = null;
    this.server = new Koa();
  }
  /**
   * 启动服务
   * @param options
   */
  public start(options?: IOptions) {
    if (this.serverListen) {
      return;
    }
    this.options = options || this.options;
    this.serverListen = this.server.listen(this.options.port);
    if (this.serverListen) {
      log.success(
        `${this.options.name}服务器已启动,端口：${this.options.port}`
      );
    } else {
      log.error(`${this.options.name}服务器启动失败`);
    }
    return !!this.serverListen;
  }

  /**
   * 重启服务
   */
  public restart(options: any) {
    if (!this.serverListen) {
      return;
    }
    log.info(`准备重启${this.options.name}服务器...`);

    this.stop();
    this.start();
    return !!this.serverListen;
  }

  /**
   * 停止服务
   */
  public stop() {
    if (!this.serverListen) {
      return;
    }
    log.info(`正在停止${this.options.name}服务器...`);
    this.serverListen.close();
    this.serverListen = null;
  }
}
