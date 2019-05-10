import Intl from "@pi/intl";
import logs from "@pi/log";
import message from "../locale";
import runFunction from "./run-function";
import utils from "./utils";
const npmRun = require("npm-run");

const log = logs("core-task");

const COMMAND_PARAM_HOOK = "$$";
const spawn = npmRun.spawn;

/**
 * 运行单个任务
 * @param task
 * @param args
 * @param hookParam
 * @return {boolean} 是否继续往下执行, 为 false 的话,不继续执行,后面进程直接退出
 */
async function oneTask(task: any, args: any, hookParam: any) {
  const intl = new Intl(message);
  // task是一个function时,执行function
  if (task.func) {
    const res = await runFunction({
      method: task.func,
      args
    });
    return res;
  } else if (task.command) {
    return new Promise((resolve, reject) => {
      const command = task.command
        .replace(COMMAND_PARAM_HOOK, hookParam)
        .split(" ");
      const env: any = {};
      // 缓存旧环境变量
      const oldEnv: any = {};
      const resetEnv = () => {
        // 这里一定要用 oldEnv 的key ,否则任务体里面添加新的环境变量会被变成 undefined 的
        Object.keys(oldEnv).forEach((item: any) => {
          process.env[item] = oldEnv[item];
        });
      };

      for (let i = 0; i < command.length; i += 1) {
        if (/^\w+=.+$/.test(command[i])) {
          command[i] = command[i].split("=");
          env[command[i][0]] = command[i][1];
        } else {
          if (i !== 0) {
            command.splice(0, i);
          }
          break;
        }
      }

      Object.keys(env).forEach(item => {
        oldEnv[item] = process.env[item];
        process.env[item] = env[item];
      });

      log.debug(`${task.command} 开始执行`);

      // 因为 其他基于pi衍生的工具也具备执行pi插件的能力，故为了不混淆pi的使用，这里在运行时将pi替换为工具本身来执行
      let cliBin = command.splice(0, 1).pop();
      if (cliBin === "pi" && process.env.PI_BIN) {
        cliBin = process.env.PI_BIN;
      }

      const child = spawn(cliBin, command, {
        cwd: process.cwd(),
        env: process.env,
        stdio: "inherit"
      });

      // 任务流执行失败
      child.on("error", (err: any) => {
        resetEnv();
        reject(err);
      });

      child.on("close", (status: number) => {
        // 插件自己要退出,则不抛出异常
        if (status === 10) {
          resetEnv();
          resolve(false);
        } else if (status !== 0) {
          const msg = intl.get("commandError", { command: task.command });
          log.error(msg);
          // report.error("pi-task", msg);
          resetEnv();
          // 执行失败后，退出终端，不再继续执行
          process.exit(status);
          // 这里抛出的错误和全局扑获的错误重复了,先不执行reject吧
          // reject(new Error(message));
        } else {
          resetEnv();
          resolve(true);
        }
      });
    });
  }
  return true;
}

function getHookParam(command: any) {
  let match = false;
  const param: any[] = [];
  process.argv.forEach(item => {
    if (item === command) {
      match = true;
    } else if (match) {
      param.push(item);
    }
  });
  return param.join(" ");
}

/**
 * 运行任务
 * @param options
 */
async function run(options: any) {
  // 筛选出对应的任务
  const intl = new Intl(message);
  const tasks = options.tasks || []; // 任务流
  const when = options.when || "before"; // 前置任务还是后置,默认是前置任务
  const args = options.args || []; // 任务流传进来的参数
  const command = options.command || ""; // 运行的命令
  const newTasks = utils.classify(tasks)[when];
  const hookParam = getHookParam(command);
  const whenTips =
    when === "after" ? intl.get("nextTask") : intl.get("preTask");

  log.info(intl.get("runCommand", { command, whenTips }));
  // log.info(`正在执行行${command}${(when === 'after' ? '后置' : '前置')}任务`);

  for (let i = 0; i < newTasks.length; i += 1) {
    if (newTasks[i].async) {
      oneTask(newTasks[i], args, hookParam);
    } else {
      const result = await oneTask(newTasks[i], args, hookParam);
      if (result === false) {
        // 用户强制要求退出,则正常退出一下
        process.exit(0);
      }
    }
  }

  log.success(intl.get("runSuccess", { command, whenTips }));
  // log.success(`${command}${(when === 'after' ? '后置' : '前置')}任务执行成功`);
}

export default run;
