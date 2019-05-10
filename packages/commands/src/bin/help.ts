/**
 * 查看 PI 及 套件的 帮助信息
 */

import config from "@pi/config";
import piEnv from "@pi/env";
import Intl from "@pi/intl";
import piModule from "@pi/module";
import moduleName from "@pi/module-name";
import chalk from "chalk";
import message from "../locale/index";

/**
 * 获取pi的实际命令
 * @returns {*|string}
 */
function getBin() {
  return process.env.PI_BIN || "pi";
}

/**
 * 显示PI帮助
 */
function outHelpInfo(needToolkit?: any) {
  const intl = new Intl(message);
  const env = piEnv.isIntranet() ? intl.get("intranet") : intl.get("extranet");
  const tool = getBin();
  const help = intl.get("help", { tool });

  // 打印帮助信息
  console.log(chalk.cyan(help));
  console.log(chalk.yellow(intl.get("helpTips")));
  needToolkit && console.log(chalk.yellow(intl.get("helpToolkit")));
  console.log(chalk.yellow(intl.get("helpPlugin", { tool })));
  console.log(chalk.yellow(intl.get("helpEnv", { tool, env })));
}

function isGenerator(obj: any) {
  return typeof obj.next === "function" && typeof obj.throw === "function";
}

/**
 * 判断当前对象是否为 generator 函数
 * @param obj
 * @returns {boolean}
 */
function isGeneratorFunction(obj: any) {
  const constructor = obj.constructor;
  if (!constructor) {
    return false;
  }
  if (
    constructor.name === "GeneratorFunction" ||
    constructor.displayName === "GeneratorFunction"
  ) {
    return true;
  }
  return isGenerator(constructor.prototype);
}

export default async function() {
  const toolkit = config.getToolkitName();
  const intl = new Intl(message);
  const tool = getBin();
  // 套件存在,则优先输出套件帮助信息
  if (toolkit) {
    const mod = await piModule.get(moduleName.toolkitFullName(toolkit));
    const help = piModule.getEsModule(mod.help);
    if (help) {
      if (isGeneratorFunction(help)) {
        await help();
      } else {
        help();
      }
      console.log(chalk.cyan(intl.get("helpList", { tool })));
    }
    outHelpInfo();
  } else {
    outHelpInfo(true);
  }
}
