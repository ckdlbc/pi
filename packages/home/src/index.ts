/**
 * @desc: 获取Pi及模块的相关路径，不建议插件直接对 Pi 目录里面的内容直接进行操作
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-02 11:47:06
 * @LastEditTime: 2019-04-17 11:06:22
 */

import db from "debug";
import fs from "fs-extra";
import globby from "globby";
import osHomedir from "os-homedir";
import * as path from "path";
import rimraf from "rimraf";
import shell from "shelljs";

const debug = db("core-home");

export class Home {
  public userHomeFolder = "";
  public userHome = "";

  /**
   * 获取Pi的home路径
   * PI_HOME_FOLDE 作用：可以自定义pi的核心目录，方便开发第三方cli工具进行定制
   * PI_HOME 作用：方便单元测试时更改目录结构
   * @returns {string} 返回路径字符串
   */
  public getHomePath() {
    const { PI_HOME_FOLDE = ".pi", PI_HOME = osHomedir() } = process.env;
    this.userHomeFolder = PI_HOME_FOLDE;
    this.userHome = PI_HOME;
    const homePath = path.resolve(this.userHome, this.userHomeFolder);
    debug("pi home = %s", homePath);
    return homePath;
  }

  /**
   * 获取Pi模块的安装路径
   * @returns {string} 返回路径字符串
   */
  public getModulesPath() {
    const piPath = this.getHomePath();
    const modulesPath = path.resolve(piPath, "node_modules");
    debug("pi module path = %s", modulesPath);
    return modulesPath;
  }

  /**
   * 获取Pi模块的安装路径
   * @returns {string} 返回路径字符串
   */
  public initHomeDir() {
    const piPath = this.getHomePath();
    if (!fs.existsSync(piPath)) {
      fs.mkdirsSync(piPath);
    }
    // 缓存home信息到env里面
    if (!process.env.PI_HOME_FOLDER) {
      process.env.PI_HOME_FOLDER = this.userHomeFolder;
    }
    if (!process.env.PI_HOME) {
      process.env.PI_HOME = this.userHome;
    }
  }

  /**
   * 清理Home目录内容
   * 用户手工删除是没影响的，Pi会验证并初始化
   */
  public cleanHomeDir() {
    const thisPath = this.getHomePath();
    const piModulesPath = this.getModulesPath();
    if (fs.existsSync(piModulesPath)) {
      debug("remove pi modules path = %s", piModulesPath);
      // 清除pi.*.json的配置文件
      const paths = globby.sync([
        `${thisPath}/pi.*.json`,
        `${thisPath}/package.json`
      ]);
      debug("clear pi.*.json = %o", paths);
      paths.forEach(item => {
        fs.removeSync(item);
      });
      // TODO windows下可能存在路径过长无法清除的情况，报错后则直接改个文件夹名字
      rimraf.sync(piModulesPath);
    }
  }

  public getEntryModuleEnvName() {
    return "PI_ENTRY_MODULE";
  }

  /**
   * 清除 pi home 目录下的 对应名字的目录,然后创建链接当前目录的软链到 pi home 目录下
   */
  public linkToHome(src: string, pkgName: string) {
    const modulePath = this.getModulesPath();
    const dist = path.resolve(modulePath, pkgName);
    if (fs.existsSync(dist)) {
      shell.rm("-rf", dist);
    }
    shell.ln("-s", src, dist);
    return dist;
  }
}
const home = new Home();

export default home;
