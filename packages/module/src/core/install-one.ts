import cache from "@pi/cache";
import home from "@pi/home";
import Intl from "@pi/intl";
import logs from "@pi/log";
import npm from "@pi/npm";
import message from "../locale";
import utils from "./utils";

const log = logs("core-module");

async function installOne(name: string, options?: any) {
  const toolkitPrefix = utils.toolkitPrefix().split("-")[0];
  const pluginPrefix = utils.pluginPrefix().split("-")[0];

  const homeCwd = home.getHomePath();
  let version: any = "latest";
  const intl = new Intl(message);
  let pureName = null;
  options = {
    type: "install",
    ...options
  };
  // 匹配套件名称，其中需要判断前缀是否是自定义的
  const match = name.match(/^(@pi\/)(toolkit|plugin)-?([A-Za-z0-9_-]*)/);
  // 判断逻辑：前缀存在 且 前缀为自定义设置的 或者前缀是pi
  if (
    !(
      match &&
      match[2] &&
      (match[2] !== toolkitPrefix || match[2] !== pluginPrefix)
    )
  ) {
    log.error(intl.get("importPkgError"));
    return;
  }

  if (!/^(@pi\/)?.+@.+$/.test(name)) {
    // 没带版本号
    pureName = name;

    if (options.lastPkg && options.lastPkg.version) {
      version = options.lastPkg.version;
    }
    name += `@${version}`;
  } else {
    pureName = name.split("@");
    version = pureName.pop();
    pureName = pureName.join("@");
  }

  // 开始安装
  log.debug(`开始安装 ${name}`);
  utils.addModuleToDependencies(homeCwd, pureName, version);
  try {
    await npm.installDependencies({
      cwd: homeCwd
    });
  } catch (e) {
    utils.removeModuleToDependencies(homeCwd, pureName);
    log.error(intl.get("installError", { name: pureName }));
    process.exit(1);
  }

  // 设置缓存, 1小时内不再检查
  cache.set(`${utils.UPDATE_CHECK_PRE}${pureName}`, true, {
    expires: utils.NO_TIP_PERIOD
  });

  // 提示安装成功
  if (options.type === "install") {
    log.success(intl.get("installSuccess", { name }));
    return;
  }

  log.success(intl.get("updateSuccess", { name }));
  // 打印更新日志
  if (!options.lastPkg) {
    options.lastPkg = await npm.latest(pureName);
  }
  if (!options.lastPkg) {
    return;
  }
  utils.updateLog(name, {
    localPkg: options.localPkg,
    lastPkg: options.lastPkg,
    level: "success"
  });
}

export default installOne;
