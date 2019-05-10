/**
 * @desc: 调试工具服务器
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-30 10:30:31
 * @LastEditTime: 2019-04-30 10:58:46
 */
import Koa from "koa";
import KoaBodyParser from "koa-bodyparser";
import KoaRouter from "koa-router";
import cors from "koa2-cors";
import BasicServer, { IOptions } from "./basicServer";

export default class MiddleServer extends BasicServer {
  public middlewares: Koa.Middleware[];
  constructor() {
    super();
    this.middlewares = [];
  }

  /**
   * 启动中转服务器
   */
  public startMid(option?: IOptions) {
    if (option) {
      option.name = "调试工具";
    }
    this.init();
    this.server.use(KoaBodyParser());
    this.server.use(cors());
    if (this.middlewares.length) {
      this.middlewares.forEach(mid => {
        this.server.use(mid);
      });
    }
    this.start(option);
  }

  /**
   * 添加中转服务器路由中间件
   */
  public addMiddleware(
    middlewareConfigs: Array<{
      method: string;
      url: string;
      middleware: KoaRouter.IMiddleware;
    }> = []
  ) {
    this.middlewares = [];
    if (middlewareConfigs.length) {
      middlewareConfigs.map(config => {
        const { method, url, middleware } = config;
        const router = new KoaRouter();
        this.middlewares.push(
          (router as any)[method](url, middleware).routes()
        );
      });
    }
  }
}
