/**
 * @desc: 多语言类
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-12 18:13:20
 * @LastEditTime: 2019-05-09 14:31:06
 */
import home from "@pi/home";
import logs from "@pi/log";
import fs from "fs-extra";
import IntlMessageFormat from "intl-messageformat";
import osLocale from "os-locale";
import * as path from "path";

const log = logs("core-intl");

let cacheLocale: any = null;

const FILE_LOCALE = "pi.locale.json";
const defaultLocale = "zh_CN";

class Intl {
  public message: any = "";
  public locale: any;
  constructor(message?: any, locale?: any) {
    this.message = message || "";
    this.locale = locale || this.getLocale();
  }

  /**
   * 初始化语言文件
   */
  public initLocale() {
    // 如果有全局语言文件的话，则退出
    const localeGlobal = process.env.PI_LOCALE;
    if (localeGlobal) {
      return;
    }

    const localeFile = path.join(home.getHomePath(), FILE_LOCALE);
    // 初始化
    if (!fs.existsSync(localeFile)) {
      const sysLocale = osLocale.sync();
      this.setLocale(sysLocale);
    }
  }
  /**
   * 获取语言信息
   */
  public getLocale() {
    // 如果有环境变量,则优先使用环境变量的值
    const localeGlobal = process.env.PI_LOCALE;
    if (localeGlobal) {
      return localeGlobal;
    }
    // 由于该方法调用频繁,在这里使用一个cache对象做为缓存,避免频繁的IO操作
    let localeData;
    if (cacheLocale) {
      localeData = cacheLocale;
    } else {
      const localeFile = path.join(home.getHomePath(), FILE_LOCALE);
      if (fs.existsSync(localeFile)) {
        localeData = fs.readJsonSync(localeFile);
        cacheLocale = localeData;
      }
    }

    // 默认返回中文
    if (!localeData) {
      return defaultLocale;
    }
    return localeData.locale;
  }

  /**
   * 设置语言信息
   */
  public setLocale(locale: any) {
    const localeFile = path.join(home.getHomePath(), FILE_LOCALE);
    const localeData = {
      locale
    };
    log.debug("set pi locale data : %o", localeData);
    log.debug("set pi to : %s", localeFile);
    cacheLocale = null;
    fs.outputJsonSync(localeFile, localeData);
  }

  /**
   * 获取所需的语言
   * @param key
   * @param values 语言中的变量信息
   */
  public get(key: string, values?: any) {
    const localeMessage = this.message[this.locale];
    let msg = !localeMessage
      ? this.message[defaultLocale][key]
      : localeMessage[key];

    if (msg) {
      msg = new IntlMessageFormat(msg, this.locale);
      return msg.format(values);
    }
    log.warn(`intl key : ${key} not defined!`);
    log.debug("message = %o", this.message);
    return "";
  }
}

export default Intl;
