import api from "@pi/api";
import config from "@pi/config";
import Intl from "@pi/intl";
import logs from "@pi/log";
import piModule from "@pi/module";
import moduleName from "@pi/module-name";
import task from "@pi/task";
import chalk from "chalk";
import fs from "fs-extra";
import inquirer, { Answer } from "inquirer";
import message from "../locale";

const log = logs("core-commands");
const cwd = process.cwd();

async function runInit(name: string) {
  const module = await piModule.getReallyName(name);
  const intl = new Intl(message);
  if (module.exist) {
    const moduleInfo = await piModule.get(module.reallyName);
    process.env.moduleReallyName = module.reallyName;
    const init = piModule.getEsModule(moduleInfo.init);
    // 执行插件的init方法
    await task.runFunction({
      method: init,
      args: init.length > 1 ? [api, {}] : [api]
    });
  } else {
    const msg = intl.get("toolkitNotFound", { toolkit: module.fullName });
    log.error(msg);
    // report.error(module.fullName, msg);
  }
}

async function getName() {
  const choices: any[] = [];
  const onlineList = await piModule.onlineList({ type: "toolkit" });
  const localList = piModule.localList({ type: "toolkit" });
  const toolkitPrefix = moduleName.toolkitPrefix();
  const intl = new Intl(message);
  const onlineMap: any = {};
  const addChoice = (item: any) => {
    const n = item.name.replace("@pi/", "").replace(toolkitPrefix, "");
    choices.push({
      name: n + chalk.gray(` -  ${item.chName}`),
      value: n
    });
  };

  onlineList.forEach(item => {
    addChoice(item);
    onlineMap[item.name] = true;
  });

  localList.forEach(item => {
    if (!onlineMap[item.name]) {
      addChoice(item);
    }
  });

  // 本地与远程无可用套件时
  if (!onlineList.length && !localList.length) {
    log.error(intl.get("noData"));
    return process.exit(1);
  }

  const answers: Answer = await inquirer.prompt([
    {
      type: "list",
      name: "name",
      message: intl.get("toolkitInit"),
      choices
    }
  ]);
  return answers.name;
}

export default async function(args: string[]) {
  let name = args.pop();
  const intl = new Intl(message);

  if (!name) {
    // 未传入套件名,提示并列出可用套件名
    name = await getName();
  }
  name = moduleName.toolkitFullName(name);
  // 先判断pi.config.js 是否存在
  // 存在的话,提示已初始化过了
  // 不存在的话再判断文件夹是否为空
  // 不为空的话则提示覆盖
  if (config.exist(cwd)) {
    log.warn(intl.get("toolkitReportInit"));
    log.warn(intl.get("toolkitInitTips", { file: config.getConfigName() }));
    return;
  }

  // 排除那些以点开头的文件
  const files = fs.readdirSync(cwd).filter(file => file.indexOf(".") !== 0);

  if (files.length > 0) {
    const questions = [
      {
        type: "input",
        name: "check",
        message: intl.get("fileExist")
      }
    ];

    const answers: any = await inquirer.prompt(questions);
    if (answers.check === "y" || answers.check === "Y") {
      await runInit(name);
    }
  } else {
    await runInit(name);
  }
}
