/**
 * @desc: 列出所有的pi套件,插件
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-15 11:37:38
 * @LastEditTime: 2019-04-15 15:01:39
 */
import Intl from "@pi/intl";
import logs from "@pi/log";
import piModule from "@pi/module";
import moduleName from "@pi/module-name";
import chalk from "chalk";
import message from "../locale/index";
const log = logs("core-commands");

import yargs from "yargs";

const argv = yargs.help(false).argv;

/**
 * 设置字符串边距
 * @param str
 * @param width
 * @returns {string}
 */
function getPadding(str: string, width: number) {
  const spaceLen = (typeof width === "undefined" ? 30 : width) - str.length;
  let padding = "";

  padding += "  ";
  for (let i = 2; i < spaceLen; i += 1) {
    padding += "-";
  }
  padding += "  ";
  return padding;
}

function printListByType(type: string, modules: any[]) {
  let tmpString;
  const prefix = moduleName.prefix();
  modules
    .filter(item => !!item.name.match(`@${prefix}/${type}`))
    .forEach(item => {
      const padding = getPadding(item.name, 35);

      tmpString = [
        "  ",
        chalk.green(item.name),
        chalk.gray(padding),
        item.chName ? item.chName : "暂无描述"
      ].join("");
      console.log(tmpString);
    });
}

export default async function(cliArgs: string[], options: any) {
  const type = cliArgs.pop();
  const intl = new Intl(message);
  const fixType = type === "plugin" || type === "toolkit" ? type : null;
  const textMap = {
    plugin: intl.get("plugin"),
    toolkit: intl.get("toolkit"),
    all: intl.get("toolkitAndPlugin")
  };
  const text = textMap[fixType || "all"];
  const star = fixType ? "**" : "";
  const param = { fixType };

  options = options || {};
  log.debug("module params = %o", param);
  const local = await piModule.localList(param);
  const online = await piModule.onlineList(param);

  let newList: any[] = [];

  // merge list
  const onlineKeys = online.map(item => {
    newList.push(item);
    return item.name;
  });

  local.forEach(item => {
    if (onlineKeys.indexOf(item.name) === -1) {
      newList.push(item);
    }
  });

  newList = newList.filter(item => !!(argv.all || item.shared));
  console.log(
    chalk.italic.magenta(
      `\r\n${star}************** ${text} ${intl.get(
        "list"
      )} ******************${star}\r\n`
    )
  );

  if (!type) {
    console.log(chalk.magenta(intl.get("toolkitList")));
    printListByType("toolkit", newList);
    console.log(chalk.magenta(intl.get("pluginList")));
    printListByType("plugin", newList);
  } else {
    printListByType(type, newList);
  }
  console.log(
    chalk.italic.magenta(
      "\r\n***************************************************\r\n"
    )
  );
}
