/**
 * @desc: 获取模块名字的相关信息、例如前缀
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-10 15:58:41
 * @LastEditTime: 2019-04-16 16:36:54
 */
import env from "@pi/env";

const utils = {
  /**
   * 获取模块的前缀
   * @returns {string|string}
   */
  prefix() {
    return process.env.PI_MODULE_PREFIX || "pi";
  },

  /**
   * 获取套件的前缀
   */
  toolkitPrefix() {
    return `toolkit-`;
  },

  /**
   * 获取插件的前缀
   */
  pluginPrefix() {
    return `plugin-`;
  },

  /**
   * 获取套件模块完整名字
   * @param name 可传入的参数可能是：xxx,toolkit-xxx,@pi/toolkit-xxx
   * @returns {string}
   */
  toolkitFullName(name: string) {
    let full = "";
    const prefix = utils.prefix();
    const tPrefix = utils.toolkitPrefix();
    const isIntranet = env.isIntranet();
    name = name.replace("@pi/", "");
    if (name.indexOf(tPrefix) === 0 || name.indexOf("toolkit") > 0) {
      full = name;
    } else if (name.indexOf("toolkit") === 0) {
      full = `${prefix}-${name}`;
    } else {
      full = `${tPrefix}${name}`;
    }
    return isIntranet ? `@pi/${full}` : full;
  },

  /**
   * 获取插件模块完整名字
   * 传入的可能是 @pi/plugin-xxx plugin-xxx
   * @returns {string}
   */
  pluginFullName(name: string) {
    let full = "";
    const prefix = utils.prefix();
    const pPrefix = utils.pluginPrefix();
    const isIntranet = env.isIntranet();
    name = name.replace("@pi/", "");
    // pi-plugin-xxx 的情况，和 另外有个 lzd-plugin-xxx 的情况(即name不是prefix开头的)
    if (name.indexOf(pPrefix) === 0 || name.indexOf("plugin") > 0) {
      full = name;
    } else if (name.indexOf("plugin") === 0) {
      // plugin-xxx 的情况
      full = `${prefix}-${name}`;
    } else {
      full = `${pPrefix}${name}`;
    }
    return isIntranet ? `@pi/${full}` : full;
  },

  /**
   * 根据传入的插件名称缩写,获取模块名称
   * @param name
   * @returns {*}
   */
  fullName(name: string) {
    if (name.indexOf("plugin-") > -1) {
      return utils.pluginFullName(name);
    } else if (name.indexOf("toolkit-") > -1) {
      return utils.toolkitFullName(name);
    }
    return name;
  },

  /**
   * 校验套件、插件名称
   */
  isValidName(name: string) {
    return (
      name.indexOf("@pi/plugin-") === 0 || name.indexOf("@pi/toolkit-") === 0
    );
  }
};

export default utils;
