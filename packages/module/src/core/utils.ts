import Intl from "@pi/intl";
import logs from "@pi/log";
import moduleName from "@pi/module-name";
import chalk from "chalk";
import fs from "fs-extra";
import emoji from "node-emoji";
import * as path from "path";
import semver from "semver";
import message from "../locale";

const log = logs("core-module");

/**
 * 获取pi的实际命令
 * @returns {*|string}
 */
function getBin() {
  return process.env.PI_BIN || "pi";
}

/**
 * 版本更新日志打印
 * @param name
 * @param opt
 * @param opt.localPkg
 * @param opt.lastPkg
 * @param opt.level
 */
function updateLog(name: string, opt?: any) {
  const ulog = log[opt.level || "success"];
  const intl = new Intl(message);
  let pre = "";
  let localVersion = "";
  const lastVersion = opt.lastPkg.version;

  if (opt.localPkg && opt.localPkg.version !== lastVersion) {
    localVersion = opt.localPkg.version;
    pre = intl.get("updateTo", { localVersion, lastVersion });
  } else {
    pre = intl.get("updateVersion", { lastVersion });
    localVersion = lastVersion;
  }

  if (opt.lastPkg.changeLog) {
    const changeLog: any = opt.lastPkg.changeLog.sort((a: any, b: any) =>
      semver.lt(a.version, b.version) ? 1 : -1
    );

    // 在警告模式下加重提示样式
    if (opt.level === "warn") {
      const tool = getBin();
      const localVTip = localVersion
        ? intl.get("localVersion", { localVersion })
        : "";
      const installTip = `${tool} install ${opt.lastPkg.name}`;

      console.log("\n");
      ulog(
        `******************** ${emoji.get("warning")} ${emoji.get(
          "warning"
        )}   ${intl.get("updateTips")}  ${emoji.get("warning")} ${emoji.get(
          "warning"
        )} **********************`
      );
      ulog(
        `${intl.get("recommendVersion", {
          name,
          version: chalk.green(lastVersion)
        })}${localVTip}`
      );
      ulog(
        intl.get("recommendInstall", {
          icon: emoji.get("point_right"),
          installTip: chalk.bgRed.bold(installTip)
        })
      );
    }

    ulog(`${name} ${pre}, ${intl.get("includeUpdate")}`);
    changeLog.forEach((item: any) => {
      if (!item.log || !item.log.length) {
        return;
      }
      if (lastVersion === localVersion) {
        if (item.version !== lastVersion) {
          return;
        }
      } else if (
        !semver.lte(item.version, lastVersion) ||
        !semver.gt(item.version, localVersion)
      ) {
        return;
      }

      // 显示未更新的这几个版本log
      item.log.forEach((itemLog: any) => {
        ulog(` --${itemLog}`);
      });
    });

    // 在警告模式下加重提示样式
    if (opt.level === "warn") {
      ulog(
        `******************************${emoji.get("point_up_2")} ${emoji.get(
          "point_up_2"
        )} ******************************`
      );
      console.log("\n");
    }
  }
}

/**
 * 解决npminstall不存在package.json时依赖无法正常安装的问题
 * @param cwd
 * @param name
 * @param version
 */
function addModuleToDependencies(cwd: string, name: string, version: string) {
  version = version || "latest";
  let pkgFile: any = { dependencies: {} };
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    pkgFile = fs.readJsonSync(pkgPath);
  }
  pkgFile.dependencies[name] = version;
  fs.outputJsonSync(pkgPath, pkgFile);
}

function removeModuleToDependencies(cwd: string, name: string) {
  let pkgFile;
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) {
    return;
  }
  pkgFile = fs.readJsonSync(pkgPath);
  delete pkgFile.dependencies[name];
  fs.outputJsonSync(pkgPath, pkgFile);
}

const utils = {
  moduleFilter(list: any, type: string) {
    return list.filter((item: any) => item.name.indexOf(`${type}-`) > -1);
  },

  fullName: moduleName.fullName,
  pluginFullName: moduleName.pluginFullName,
  toolkitFullName: moduleName.toolkitFullName,
  modPrefix: moduleName.prefix,
  toolkitPrefix: moduleName.toolkitPrefix,
  pluginPrefix: moduleName.pluginPrefix,
  UPDATE_CHECK_PRE: "moduleCheck_",
  ONLINE_MODULE_CACHE_KEY_IN: "onlineModuleListIn",
  ONLINE_MODULE_CACHE_KEY_OUT: "onlineModuleListOut",
  updateLog,
  addModuleToDependencies,
  removeModuleToDependencies,
  NO_TIP_PERIOD: 3600000
};

export default utils;
