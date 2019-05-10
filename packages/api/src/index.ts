/**
 * @desc: 整合pi核心的包，统一暴露接口，避免单个单个使用麻烦
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-02 14:02:32
 * @LastEditTime: 2019-04-25 15:59:28
 */
import argv from "@pi/argv";
import cache from "@pi/cache";
import config from "@pi/config";
import env from "@pi/env";
import generate from "@pi/generate";
import home from "@pi/home";
import Intl from "@pi/intl";
import log from "@pi/log";
import piModule from "@pi/module";
import moduleName from "@pi/module-name";
import npm from "@pi/npm";
import proxy from "@pi/proxy";
import task from "@pi/task";
import upgrade from "@pi/upgrade";

const api = {
  argv,
  home,
  cache,
  config,
  env,
  log,
  module: piModule,
  moduleName,
  npm,
  task,
  Intl,
  upgrade,
  generate,
  proxy
};

module.exports = api;
export default api;
