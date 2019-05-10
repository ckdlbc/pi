/**
 * @desc: 缓存模块
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-11 15:44:26
 * @LastEditTime: 2019-04-25 17:34:35
 */

import home from "@pi/home";
import logs from "@pi/log";
import fs from "fs-extra";
import * as path from "path";

const log = logs("core-cache");

export class Cache {
  /**
   * 获取缓存内容,如果不存在或已过期则返回 null
   * @param {string} key 缓存的键
   * @returns {mix}
   */
  public get(key: string) {
    const cacheFile = this.getCacheFile();
    log.debug("pi缓存文件的路径:", cacheFile);
    if (!key || !fs.existsSync(cacheFile)) {
      return null;
    }
    // 如果不是json文件，也不抛出异常
    let data = fs.readJsonSync(cacheFile, { throws: false }) || {};
    if (typeof data !== "object") {
      data = {};
    }

    // 有效期判断
    if (data.__expires && data.__expires[key]) {
      if (data.__expires[key] < Date.now()) {
        return null;
      }
    }
    return data[key];
  }

  /**
   * 设置缓存内容
   * @param key {string} 缓存的键
   * @param value {mix} 缓存的值
   * @param options {object}
   * @param options.expires {number} 有效时长,毫秒为单位, 如 1分钟为 360000
   * @returns {boolean}
   */
  public set(key: string, value: any, options: any) {
    if (!key) {
      return false;
    }

    const cacheFile = this.getCacheFile();

    options = {
      expires: null,
      ...options
    };

    let data: any = {};
    if (fs.existsSync(cacheFile)) {
      data = fs.readJsonSync(cacheFile, { throws: false }) || {};
      if (typeof data !== "object") {
        data = {};
      }
    }

    // 有效期处理
    data.__expires = data.__expires || {};
    data.__expires[key] = options.expires ? Date.now() + options.expires : null;

    data[key] = value;

    fs.outputJsonSync(cacheFile, data);
    return true;
  }

  /**
   * 获取缓存文件
   */
  public getCacheFile() {
    return path.resolve(home.getHomePath(), "pi.cache.json");
  }

  /**
   * 清除所有的缓存
   */
  public clear() {
    const cacheFile = this.getCacheFile();
    fs.removeSync(cacheFile);
  }
}
export default new Cache();
