import config from "@pi/config";
import home from "@pi/home";
import logs from "@pi/log";
import moduleName from "@pi/module-name";
import chalk from "chalk";
import * as path from "path";

import yargs from "yargs";

const log = logs("core-commands");
const argv = yargs.help(false).argv;

function getPackagesVersion() {
  let str = "";
  [
    "@pi/config",
    "@pi/env",
    "@pi/home",
    "@pi/log",
    "@pi/module",
    "@pi/npm",
    "@pi/task",
    "@pi/fs",
    "@pi/report",
    "@pi/error"
  ].forEach(item => {
    str += `${item} ${
      require(path.join(`../node_modules/${item}/package.json`)).version
    }\n`;
  });
  return str;
}

export default async function() {
  const bin = config.getBinName();
  const ver = config.getBinVersion();
  console.log(chalk.magenta(`${bin} v${ver}`));

  // 获取toolkit
  let toolkitName = config.getToolkitName();
  if (toolkitName) {
    toolkitName = moduleName.toolkitFullName(toolkitName);
    try {
      const pkgPath = path.join(
        home.getModulesPath(),
        toolkitName,
        "package.json"
      );
      log.debug(`${toolkitName} pacage.json path = ${pkgPath}`);
      const pkg = require(pkgPath);
      console.log(chalk.magenta(`${toolkitName} v${pkg.version}`));
    } catch (e) {
      log.debug(e);
    }
  }

  if (argv.d || argv.debug) {
    // 其依赖的核心包
    console.log(
      chalk.magenta(
        `
core package:

${getPackagesVersion()}

`
      )
    );
  }
}
