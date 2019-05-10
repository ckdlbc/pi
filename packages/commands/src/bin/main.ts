/**
 * @desc: 所有的套件/插件公共流程
 * 自定义prefix 本地套件/插件 -> PI本地套件/插件 -> 自定义线上套件/插件 -> PI线上套件/插件
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-15 15:48:07
 * @LastEditTime: 2019-05-07 14:47:17
 */
import api from "@pi/api";
import config from "@pi/config";
import home from "@pi/home";
import Intl from "@pi/intl";
import logs from "@pi/log";
import piModule from "@pi/module";
import moduleName from "@pi/module-name";
import task from "@pi/task";
import chalk from "chalk";
import fs from "fs-extra";
import * as path from "path";
import yargs from "yargs";
import message from "../locale";

const log = logs("core-commands-main");

const clientOptions = { ...yargs.help(false).argv };

/**
 * 获取pi的实际命令
 * @returns {*|string}
 */
function getBin() {
  return process.env.PI_BIN || "pi";
}

function setEntryModule(name: string) {
  process.env[home.getEntryModuleEnvName()] = name.replace("@pi/", "");
}

/**
 * 当遇到 start , build 命令时,判断用户是否在正确的目录
 * @param command
 * @returns {boolean}
 */
function isErrorDirectory(command: string) {
  const intl = new Intl(message);
  // 如果当前目录下不存在pi.config.js 则提示
  if (["start", "build"].indexOf(command) !== -1 && !config.exist()) {
    log.debug("error directory");
    log.error(intl.get("configFileNotFound", { file: config.getConfigName() }));
    return false;
  }
  return true;
}

class Main {
  /**
   * 主流程
   * @param command
   * @param cliArgs
   */
  public async start(command: string, cliArgs: any) {
    const tasks = config.get("tasks") || {};
    const hasBeforeTask = task.has(tasks[command], "before");
    const hasAfterTask = task.has(tasks[command], "after");

    const intl = new Intl(message);
    log.debug(
      "tasks = %o , command = %s, cliArgs = %o",
      tasks,
      command,
      cliArgs
    );
    log.debug(`before task ${hasBeforeTask}`);

    // 去掉 clientOptions 里面多余的字段
    delete clientOptions._;
    delete clientOptions.$0;

    // 错误提示提前判断
    if (!isErrorDirectory(command)) {
      return;
    }
    // 如果第一个参数为 plugin, 强制执行某个插件, 并且忽略所有的前置,后置任务
    if (command === "plugin") {
      if (cliArgs.length < 1) {
        log.error(intl.get("runPlugin"));
        return;
      }
      command = cliArgs.splice(0, 1)[0];

      log.debug(
        "new tasks = %o , command = %s, cliArgs = %o",
        tasks,
        command,
        cliArgs
      );
      await this.runPlugin(command, cliArgs);
      return;
    }

    // ------------- 展示版本号, 并中止后面的任务 ---------------
    if (
      cliArgs &&
      cliArgs.length === 0 &&
      (clientOptions.v || clientOptions.version)
    ) {
      await this.showVersion(command);
      return;
    }

    // ------------- 执行前置任务 ---------------
    if (hasBeforeTask) {
      // 目前推荐只传一个 options 参数， 第一个参数 merge api 及仍传第二个参数，是用于向下兼容

      const optionsArg = {
        clientArgs: cliArgs,
        clientOptions
      };

      await task.run({
        tasks: tasks[command],
        args: [
          {
            ...api,
            ...optionsArg
          },
          optionsArg
        ],
        when: "before",
        command
      });
    }

    // -------------- 执行套件任务 ---------------
    let toolkitName = config.exist()
      ? config.get("toolkit") || config.get("toolkitName")
      : "";
    let toolkit: any = {};
    if (toolkitName) {
      toolkitName = moduleName.toolkitFullName(toolkitName);
      const moduleInfo = await piModule.getReallyName(toolkitName);
      // 判断套件是否存在
      if (moduleInfo.exist) {
        toolkitName = moduleInfo.reallyName;
        toolkit = await piModule.get(toolkitName);
      }
    }
    log.debug(toolkitName, toolkit);
    const toolkitCommand = piModule.getEsModule(toolkit[command]);
    // 如果判断到有套件且有对应命令的方法,那么直接执行并返回, 否则向下执行插件逻辑
    if (typeof toolkitCommand === "function") {
      log.debug(`找到套件 ${toolkitName} 对应的 ${command} 方法`);
      setEntryModule(toolkitName);
      const afterToolCommand = async () => {
        // -------------- 执行后置任务 ---------------
        // next 是异步的方法
        if (hasAfterTask) {
          try {
            // 目前推荐只传一个 options 参数， 第一个参数 merge api 及仍传第二个参数，是用于向下兼容
            const optionsArg = {
              clientArgs: cliArgs,
              clientOptions
            };
            await task.run({
              tasks: tasks[command],
              args: [{ ...api, ...optionsArg }, optionsArg],
              when: "after",
              command
            });
          } catch (err) {
            // piError.handle(err);
          }
        }
      };
      // 传入 callback ,兼容未使用 generator 版本套件和插件
      // 目前推荐只传一个 options 参数， 第一个参数 merge api 及仍传第二个参数，是用于向下兼容
      const optionsArg = {
        clientArgs: cliArgs,
        clientOptions,
        callback: afterToolCommand
      };
      await task.runFunction({
        method: toolkitCommand,
        args:
          toolkitCommand.length > 1
            ? [api, optionsArg, afterToolCommand]
            : [{ ...api, ...optionsArg }],
        // task 模块调用
        next: afterToolCommand
      });
      return;
    } else if (hasAfterTask) {
      log.debug("未找到对应的套件及方法");
      // 只有后置命令, 却没有套件模块的给个提示
      const msg = intl.get("notRunTips", { command });
      log.error(msg);
      // report.error("plugin-not-found", msg);
      return;
    }

    // start build 错误提示
    if (["start", "build"].indexOf(command) !== -1) {
      if (toolkit) {
        const tool = getBin();
        log.error(intl.get("startNotRunTips", { command, tool }));
      } else {
        // 存在pi.config.js文件且文件中有对应的 start、build、publish时则不需要提示
        if (!(hasBeforeTask || hasAfterTask)) {
          log.error(
            intl.get("configNotRunTips", {
              file: config.getConfigName(),
              command
            })
          );
        }
      }
      return;
    }

    // -------------- 执行插件任务 ---------------
    // 在已经执行了任务流的情况下,直接不执行插件逻辑
    if (!hasBeforeTask && !hasAfterTask) {
      log.debug("尝试执行插件方法");
      await this.runPlugin(command, cliArgs);
    }
  }

  /**
   * 运行插件命令
   * 运行逻辑：自定义本地插件 -> PI本地插件 -> 自定义线上插件 -> PI线上插件
   * 先走本地已安装，速度快一些
   * @param name
   * @param cliArgs
   */
  public async runPlugin(name: string, cliArgs: any[]) {
    const module = await piModule.getReallyName(`plugin-${name}`);
    const intl = new Intl(message);
    if (module.exist) {
      setEntryModule(module.reallyName);
      const plugin = await piModule.get(module.reallyName);
      let method;
      let pluginCmd = "";
      log.debug(" 插件信息 %o", plugin);
      if (typeof plugin === "function") {
        method = plugin;
      } else if (typeof plugin === "object") {
        if (cliArgs.length) {
          pluginCmd = cliArgs.shift();
          method = piModule.getEsModule(plugin[pluginCmd]);
        } else if (typeof plugin.default === "function") {
          method = plugin.default;
        }
      }
      if (!method) {
        const msg = intl.get("pluginCommandNotFound", {
          module: module.reallyName,
          pluginCmd
        });
        log.error(msg);
        // report.error(module.reallyName, msg);
        return;
      }

      const optionsArg = { clientArgs: cliArgs, clientOptions };

      await task.runFunction({
        method,
        args:
          method.length > 1 ? [api, optionsArg] : [{ ...api, ...optionsArg }]
      });
    } else {
      const msg = intl.get("pluginNotFound", { plugin: module.fullName });
      log.error(msg);
      // report.error(module.fullName, msg);
    }
  }

  /**
   * 展示本地版本号，显示查找逻辑：自定义prefix本地模块 -> PI本地模块
   */
  public async showVersion(name: string) {
    let existsOne = false;
    const intl = new Intl(message);
    const logOne = async function(n: any) {
      n = moduleName.fullName(n);
      const prefix = moduleName.prefix();
      const localExist = piModule.localExist(n);
      let mod: any = "";
      if (localExist) {
        mod = fs.readJsonSync(
          path.resolve(home.getModulesPath(), n, "package.json"),
          {
            throws: false
          }
        );
      } else if (prefix !== "pi") {
        n = n.replace(prefix, "pi");
        mod = fs.readJsonSync(
          path.resolve(home.getModulesPath(), n, "package.json"),
          {
            throws: false
          }
        );
      }
      if (mod && mod.version) {
        existsOne = true;
        console.log(
          chalk.magenta(
            intl.get("moduleVersion", { module: n, version: mod.version })
          )
        );
      }
    };
    if (name.indexOf("toolkit-") > -1 || name.indexOf("plugin-") > -1) {
      await logOne(name);
      return;
    }

    await logOne(`toolkit-${name}`);
    await logOne(`plugin-${name}`);

    if (!existsOne) {
      const msg = intl.get("localNotFound", { name });
      log.error(msg);
      // report.error("plugin-not-found", msg);
    }
  }
}
const main = new Main();

export default (command: string, cliArgs: any) => {
  main.start(command, cliArgs);
};
