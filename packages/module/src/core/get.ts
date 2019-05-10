import cache from "@pi/cache";
import env from "@pi/env";
import home from "@pi/home";
import Intl from "@pi/intl";
import logs from "@pi/log";
import npm from "@pi/npm";
import fs from "fs-extra";
import * as path from "path";
import semver from "semver";
import message from "../locale";
import installOne from "./install-one";
import utils from "./utils";

const log = logs("core-module");
/**
 * 获取 pi 插件或套件包逻辑
 * @param name 模块名，如 @pi/toolkit-xxx
 * 注意: name 必须是完整的package name。这里是个破坏性变更.
 * @returns {*}
 */
async function get(name: string) {
  let returnPkg = false;
  const intl = new Intl(message);
  const isIntranet = env.isIntranet();
  if (/\/package\.json$/.test(name)) {
    name = name.replace("/package.json", "");
    returnPkg = true;
  }

  // 新版本要求传入完整的模块名
  // 需要全部转为 @pi/xxx，所以这里写死pi前缀
  if (name.indexOf("plugin-") === 0 || name.indexOf("toolkit-") === 0) {
    name = isIntranet ? `@pi/${name}` : `${name}`;
  } else if (isIntranet && name.indexOf("pi-") === 0) {
    name = `@pi/${name}`;
  }

  const modulePath = path.resolve(home.getModulesPath(), name);
  const pkgPath = path.resolve(modulePath, "package.json");

  if (fs.existsSync(pkgPath)) {
    log.debug(`存在本地模块 ${pkgPath}`);
    const needUpdate = !cache.get(`${utils.UPDATE_CHECK_PRE}${name}`);
    log.debug(`判断是否需要更新 ${needUpdate}`);

    // 本地存在, 判断是否需要更新
    if (needUpdate) {
      // 获取最新版本
      const lastPkg = await npm.latest(name);
      const localPkg = fs.readJsonSync(pkgPath);
      // 如果有执行了安装或更新的,这里就无须再设置缓存提示了,因为执行安装或更新后已经设置了一遍
      let isNeedSetCache = true;

      // 有可能网络错误,这里进行判断一下看是否需要再进行更新操作
      if (lastPkg) {
        if (semver.lt(localPkg.version, lastPkg.version)) {
          if (localPkg.piOption && localPkg.piOption.update) {
            // 自动更新
            log.info(intl.get("autoUpdate", { name }));
            await installOne(name, {
              type: "update",
              localPkg,
              lastPkg
            });
            isNeedSetCache = false;
          } else {
            // 末位版本自动更新操作
            let autoZVersion = "";
            if (lastPkg.changeLog) {
              // 在 changeLog 里面检测是否有末位更新的版本
              lastPkg.changeLog = lastPkg.changeLog.sort((a: any, b: any) =>
                semver.lt(a.version, b.version) ? 1 : -1
              );
              for (let j = 0; j < lastPkg.changeLog.length; j += 1) {
                if (
                  semver.satisfies(
                    lastPkg.changeLog[j].version,
                    `~${localPkg.version}`
                  ) &&
                  lastPkg.changeLog[j].version !== localPkg.version
                ) {
                  autoZVersion = lastPkg.changeLog[j].version;
                  break;
                }
              }
            }

            if (autoZVersion) {
              log.info(
                intl.get("autoUpdateZ", {
                  localVersion: localPkg.version,
                  autoZVersion
                })
              );
              const comPkg = await npm.latest(name, {
                version: autoZVersion
              });
              await installOne(name, {
                type: "update",
                localPkg,
                lastPkg: comPkg
              });
              isNeedSetCache = false;
            }

            if (!autoZVersion || semver.lt(autoZVersion, lastPkg.version)) {
              // 更新提示
              // 如果 autoZVersion 有值,那么去获取安装完后的 package.json 文件
              const newLocalPkg = autoZVersion
                ? fs.readJsonSync(pkgPath)
                : localPkg;
              utils.updateLog(name, {
                localPkg: newLocalPkg,
                lastPkg,
                level: "warn"
              });
            }

            // 设置缓存, 1小时内不再检查
            if (isNeedSetCache) {
              cache.set(`${utils.UPDATE_CHECK_PRE}${name}`, true, {
                expires: utils.NO_TIP_PERIOD
              });
            }
          }
        }
      }
    }
  } else {
    log.info(intl.get("autoInstall", { name }));

    await installOne(name);
  }

  const pkg = fs.readJsonSync(pkgPath, { throws: false }) || {};
  const mod = require(modulePath);
  // const pluginPrefix = utils.pluginPrefix();
  // TODO 发送log记录，由于调用插件时，也会调用到套件，所以这里只有插件调用的时候才发送log
  // 套件调用，在pi-core all.js文件
  // if (!returnPkg && name.indexOf(pluginPrefix) !== -1) {
  //   log.debug(`${name} 插件开始发送日志...`);
  //   report.moduleUsage(utils.fullName(name));
  // }

  return returnPkg ? pkg : mod;
}

export default get;
