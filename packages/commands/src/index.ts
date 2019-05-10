/**
 * @desc: 命令集合，可用于命令行直接调用
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-12 17:40:46
 * @LastEditTime: 2019-04-12 17:59:26
 */
import globby from "globby";
import * as path from "path";
import getBin from "./core/getBin";

const corePath = `${path.resolve(__dirname)}/bin`;
const paths = globby.sync([`${corePath}/*.ts`, `${corePath}/*.js`], {
  ignore: [`${corePath}/*.d.ts`]
});
const commands: {
  [key: string]: any;
} = {};
paths.forEach(commandPath => {
  commands[
    path.basename(commandPath).split(".")[0]
  ] = require(commandPath).default;
});

export * from "./core/switchEnv";
export * from "./core/getBin";

export default commands;
