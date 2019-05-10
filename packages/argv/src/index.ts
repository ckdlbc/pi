/**
 * @desc: 对传入的命令参数统一处理
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-12 18:22:45
 * @LastEditTime: 2019-04-25 16:45:10
 */
import logs from "@pi/log";
import yargs from "yargs";

const argv = yargs.help(false).argv;
const log = logs("core-argv");

export default (defaultCommand?: string) => {
  // pi所需的命令
  let command;
  // pi命令所需的参数
  let newArgv: any[] = [];
  // 特殊处理一下传入的参数
  // pi -v 时候的处理
  if (argv.dev || argv.D) {
    process.env.DEBUG =
      typeof argv.dev === "string"
        ? argv.dev
        : typeof argv.D === "string"
        ? argv.D
        : "core-*";
    log.debugEnable(process.env.DEBUG);
    log.debug(`开启调试模式：调试范围 ${process.env.DEBUG}`);
  }
  if (!argv._.concat().pop() && (argv.v || argv.version)) {
    // 没有传入任何参数, 且有 -v 或 --version
    // 如果有传了参数,说明希望看到套件插件的版本,套件插件版本在 all.js 里面进行处理
    command = "version";
  } else if (argv.help || argv.h) {
    // 执行 pi -h 或 pi -help 的时候
    if (argv._.length === 1) {
      // 显示插件帮助信息
      command = argv._[0];
      newArgv = ["help"];
    } else {
      command = "help";
    }
  } else {
    newArgv = argv._.concat();
    command = newArgv.splice(0, 1).pop() || defaultCommand;
  }

  log.debug("控制台传入的原始参数: %o", argv);
  log.debug("即将执行的pi命令: %o", command);
  log.debug("pi命令的参数: %o", newArgv);

  // 初次执行命令, PI_IS_CHILD_ENTRY 将会传到子进程
  // 用于初次执行命令的上报
  // log.debug(`是否子命令 ${process.env.PI_IS_CHILD_ENTRY}`);
  // if (!process.env.PI_IS_CHILD_ENTRY) {
  //   process.env.PI_IS_CHILD_ENTRY = "1";
  //   // 上报
  //   report.coreCommand();
  // }

  return {
    command,
    argv: newArgv
  };
};
