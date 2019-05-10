/**
 * @desc: 选择套件的开发环境
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-12 17:32:30
 * @LastEditTime: 2019-04-15 09:59:31
 */
import env from "@pi/env";
import home from "@pi/home";
import Intl from "@pi/intl";
import logs from "@pi/log";
import chalk from "chalk";
import fs from "fs-extra";
import inquirer, { Answer } from "inquirer";
import * as path from "path";
import message from "../locale/index";
import getBin from "./getBin";
const log = logs("core-core");

export class SwitchEnv {
  /**
   * 检测环境是否已初始化
   */
  public async init() {
    const hasInitEnv = env.hasConfigFile();
    const tool = getBin();
    const intl = new Intl(message);

    // 已经初始化过了,则退出
    // 如果是云构建，则不检测
    if (hasInitEnv || process.env.BUILD_ENV === "cloud") {
      return;
    }

    log.warn(intl.get("notInitEnv", { tool }));

    // 选择开发环境
    await this.start();

    log.success(intl.get("useCommand", { tool }));

    process.exit(10);
  }

  /**
   * 切换内外网后，home目录的package.json内容可能会无法安装，比如从内网切换到外网时
   */
  public removePackageFile() {
    const homeCwd = home.getHomePath();
    const pkgPath = path.join(homeCwd, "package.json");
    if (!fs.existsSync(pkgPath)) {
      return;
    }
    fs.remove(pkgPath);
  }

  /**
   * 选择开发环境
   */
  public async start() {
    const intl = new Intl(message);
    const divider = "-    ";
    const answers: Answer = await inquirer.prompt([
      {
        type: "list",
        name: "name",
        message: intl.get("switchEnvTips"),
        choices: [
          {
            name: `${intl.get("intranet")}   ${divider}${chalk.gray(
              intl.get("intranetTips")
            )}`,
            value: "intranet"
          },
          {
            name: `${intl.get("extranet")}   ${divider}${chalk.gray(
              intl.get("extranetTips")
            )}`,
            value: "extranet"
          }
        ]
      }
    ]);
    // 设置env环境
    env.setEnv(answers.name);

    log.success(intl.get("initEnvSuccess"));

    this.removePackageFile();
  }
}

export default SwitchEnv;
