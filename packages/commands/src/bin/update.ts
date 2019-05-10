/**
 * @desc: 更新模块
 * @author: Arvinsu
 * @LastEditors: Arvinsu
 * @Date: 2019-04-15 10:35:42
 * @LastEditTime: 2019-04-15 16:10:33
 */

import module from "@pi/module";

export default async function(cliArgs: string[]) {
  const name = cliArgs.pop();
  await module.update(name);
}
