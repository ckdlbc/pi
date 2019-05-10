import logs from "@pi/log";
import moduleName from "@pi/module-name";
import localExist from "./local-exist";
import onlineExist from "./online-exist";

const log = logs("core-module");

/**
 * 获取实际可执行的套件或插件名称
 * 获取逻辑: 自定义本地套件/插件 -> PI本地套件/插件 -> 自定义线上套件/插件 -> PI线上套件/插件
 * @param name 套件或插件名，必须带上 toolkit 或 plugin
 */
export default async function(name: string) {
  const prefix = moduleName.prefix();
  // 如果是自定义prefix的插件
  const isCustomPrefix = prefix !== "pi";
  // 是否使用的是pi插件
  let isUseModule = false;
  // 传入的插件名
  const fullName = moduleName.fullName(name);
  // pi的模块名称 @pi/plugin-xxx
  const pluginName = fullName.replace(prefix, "pi");
  // 实际调用的插件名
  let reallyName = fullName;
  // 执行插件的方法
  let exist = localExist(fullName);
  log.debug(`本地 ${fullName} 模块: ${exist}`);
  if (!exist) {
    // 判断一下是不是自定义prefix的情况
    if (isCustomPrefix) {
      exist = localExist(pluginName);
      log.debug(`本地 ${pluginName} 模块: ${exist}`);
      if (!exist) {
        // 查找线上版本
        exist = await onlineExist(fullName);
        log.debug(`线上 ${fullName} 模块: ${exist}`);
        if (!exist) {
          exist = await onlineExist(pluginName);
          log.debug(`线上 ${pluginName} 模块: ${exist}`);
          if (exist) {
            reallyName = pluginName;
            isUseModule = true;
          }
        }
      } else {
        reallyName = pluginName;
        isUseModule = true;
      }
    } else {
      exist = await onlineExist(fullName);
      log.debug(`线上 ${fullName} 模块: ${exist}`);
    }
  }

  const moduleInfo = {
    exist, // 模块是否存在
    isUseModule, // 是否使用pi原生模块
    reallyName, // 实际运行的模块名称
    fullName // 传入的模块名称（当prefix不是pi时，该值可能与reallyName不同）
  };

  log.debug("当前实际的模块信息 %o", moduleInfo);

  return moduleInfo;
}
