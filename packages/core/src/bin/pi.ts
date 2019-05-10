#! /usr/bin/env node

import argv from "@pi/argv";
import commands, { SwitchEnv } from "@pi/commands";

import home from "@pi/home";
import Intl from "@pi/intl";
import logs from "@pi/log";
import upgrade from "@pi/upgrade";
import "../core/config";

const pkg = require("../../package.json");
const log = logs("core-core");

try {
  (async function(this: any) {
    // 默认使用i命令
    const binArgv = argv("i");
    const command = binArgv.command;
    const newArgv = binArgv.argv;

    log.debug("执行套件主流程");

    // 家目录存在性检查
    home.initHomeDir();

    // 检测环境是否已初始化
    const switchEnv = new SwitchEnv();
    await switchEnv.init();

    // 初始化语言环境
    const intl = new Intl();
    intl.initLocale();

    // 版本更新提示
    await upgrade({
      name: pkg.name,
      version: pkg.version
    });

    // 核心运行命令
    const coreCommands = Object.keys(commands).filter(item => {
      return item !== "main";
    });

    if (coreCommands.indexOf(command) === -1) {
      log.debug("进入套件,插件分支");
      await commands.main.apply(this, [command, newArgv]);
    } else {
      log.debug("进入核心命令分支");
      // init, install, install, uninstall, update ,version 等命令
      // 对 pi.config.js 没有依赖, 也不执行自定义命令流
      await commands[command].apply(null, [newArgv]);
    }

    // 捕获异常
    process.on("uncaughtException", err => {
      log.debug(`进入未知错误${JSON.stringify(err)}`);
      // piError.handle(err);
    });
  })();
} catch (err) {
  // piError.handle(err);
}
