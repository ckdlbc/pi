import home from "@pi/home";
import fs from "fs-extra";
import * as path from "path";

/**
 * 模块是否存在
 */
function localExist(name: string) {
  const modulePath = path.resolve(home.getModulesPath(), name);
  const pkgPath = path.resolve(modulePath, "package.json");

  return fs.existsSync(pkgPath);
}

export default localExist;
