/**
 * @desc: 选择套件的开发环境
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-12 17:32:30
 * @LastEditTime: 2019-04-12 17:51:54
 */
import SwitchEnv from "../core/switchEnv";

const initSwitch = new SwitchEnv();

export default async () => {
  await initSwitch.start();
};
