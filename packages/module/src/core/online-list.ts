import cache from "@pi/cache";
import env from "@pi/env";
import logs from "@pi/log";
import utils from "./utils";
const log = logs("core-module");
const fly = require("flyio");
const ping = require("ping");

const searchApi = () => {
  const isIntranet = env.isIntranet();
  const prefix = encodeURIComponent(`@${utils.modPrefix()}/`);
  const end = `browse/keyword/${prefix}?type=json&__t=${Date.now()}`;
  // TODO 删除pre.
  const listApi = isIntranet
    ? `http://111.231.133.21:4873/-/verdaccio//search/${prefix}`
    : `https://npm.taobao.org/${end}`;
  log.debug(`获取列表访问的 api 地址: ${listApi}`);
  return listApi;
};

/**
 * 获取列表, 缓存机制\
 * @returns {*|Request|Array}
 */
async function onlineList(options: any) {
  options = {
    cache: true,
    ...options
  };

  const isIntranet = env.isIntranet();
  const cacheKey = isIntranet
    ? utils.ONLINE_MODULE_CACHE_KEY_IN
    : utils.ONLINE_MODULE_CACHE_KEY_OUT;

  log.debug("get online list from cache %o", cache.get(cacheKey));

  let moduleList = options.cache && cache.get(cacheKey);

  if (!moduleList) {
    moduleList = [];
  }

  try {
    if (!moduleList.length) {
      // 先ping一下，看是否有网络
      const pingApi = isIntranet ? "111.231.133.21" : "npm.taobao.org";
      const pingRes = await ping.promise.probe(pingApi);

      if (!pingRes || !pingRes.alive) {
        throw Error("Network connection error");
      }

      const res = await fly.request({
        url: searchApi(),
        method: "get",
        timeout: 5000
      });

      log.debug("search body = ", res.body);
      const resData = res.data;
      // 内外网数据源不同,格式稍有差异
      const list: any[] = isIntranet ? resData : resData.packages;
      const tPrefix = utils.toolkitPrefix();
      const pPrefix = utils.pluginPrefix();
      list.forEach(item => {
        // 内外网数据源不同,格式稍有差异
        item.name = item.name;
        item.chName = item.description;
        item.shared = true;
        // 名字不符合规则 或 已删除的包不再显示
        if (
          item.description !== "delete" &&
          (item.name.includes(tPrefix) || item.name.includes(pPrefix))
        ) {
          moduleList.push(item);
        }
      });
      // 如果没有列表，就不缓存了
      if (!moduleList.length) {
        cache.set(cacheKey, moduleList, {
          expires: 3600000
        });
      }
    }
  } catch (e) {
    // 返回数据出错, 可能是没网
    log.debug(e);
  }

  moduleList = options.type
    ? utils.moduleFilter(moduleList, options.type)
    : moduleList;

  log.debug("所有线上模块: %o", moduleList);

  return moduleList as any[];
}

export default onlineList;
