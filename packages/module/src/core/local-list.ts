/**
 * @desc: 本地模块列表
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-15 11:01:53
 * @LastEditTime: 2019-04-15 15:44:32
 */

import env from "@pi/env";
import home from "@pi/home";
import logs from "@pi/log";
import fs from "fs-extra";
import globby from "globby";
import * as path from "path";
import utils from "./utils";

const log = logs("core-module");

/**
 * 列出所有本地模块
 * @param options object {type (按类型筛选): 'toolkit | plugin'}
 * @returns {Array}
 */
function localList(options?: any) {
  options = options || {};
  const isIntranet = env.isIntranet();
  const modulesPath = home.getModulesPath();
  const tPrefix = utils.toolkitPrefix();
  const pPrefix = utils.pluginPrefix();
  const moduleCwd = isIntranet ? path.resolve(modulesPath, "@pi") : modulesPath;

  let modulePkgs: any[] = [];

  if (fs.pathExistsSync(moduleCwd)) {
    log.debug("modules path = %s", moduleCwd);
    const modules = globby.sync([`${tPrefix}*`, `${pPrefix}*`, "!.*", "!*.*"], {
      cwd: moduleCwd
    });
    modules.forEach(item => {
      const pkgPath = path.resolve(moduleCwd, item, "package.json");
      if (fs.existsSync(pkgPath)) {
        const modPkg = fs.readJsonSync(pkgPath);
        modulePkgs.push({
          name: modPkg.name,
          description: modPkg.description,
          chName:
            modPkg.piOption && modPkg.piOption.chName
              ? modPkg.piOption.chName
              : modPkg.description
        });
      }
    });
  }

  modulePkgs = options.type
    ? utils.moduleFilter(modulePkgs, options.type)
    : modulePkgs;

  log.debug("所有本地模块: %o", modulePkgs);

  return modulePkgs;
}

export default localList;
