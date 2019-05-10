/**
 * @desc: 清除PI缓存
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-15 10:02:05
 * @LastEditTime: 2019-04-15 10:09:29
 */

import cache from "@pi/cache";
import env from "@pi/env";
import home from "@pi/home";
import Intl from "@pi/intl";
import logs from "@pi/log";
import * as fs from "fs";
import * as path from "path";
import rimraf from "rimraf";
import message from "../locale";

const log = logs("core-commands");

export default async function() {
  const intl = new Intl(message);
  const cdnPath = path.join(home.getHomePath(), "LocalCDNPath");
  log.info(intl.get("startClear"));
  home.cleanHomeDir();
  env.removeConfigFile();
  if (fs.existsSync(cdnPath)) {
    rimraf.sync(cdnPath);
  }
  cache.clear();
  // 删除LocalCDNPath目录

  log.success(intl.get("finishClear"));
}
