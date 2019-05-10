import home from "@pi/home";
import logs from "@pi/log";
import moduleName from "@pi/module-name";

import * as fs from "fs";
import * as path from "path";

const log = logs("core-command");
const cwd = process.cwd();

export default function() {
  const pkgPath = path.resolve(cwd, "package.json");

  if (!fs.existsSync(pkgPath)) {
    log.error(
      "当前未找到 package.json 文件,请在 插件/套件 工程根目录里面执行此命令"
    );
    log.error("软链创建失败");
    return;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath) as any);

  if (!pkg.name) {
    log.error("无项目名");
    log.error("软链创建失败");
    return;
  }

  if (!moduleName.isValidName(pkg.name)) {
    log.error(
      `项目名不符合 插件/套件 规范, 必须通过以下 @pi/plugin- 或 @pi/toolkit- 开头`
    );
    log.error("软链创建失败");
    return;
  }

  const dist = home.linkToHome(cwd, pkg.name);
  log.success(`软链创建成功, 链接到 ${dist}`);
}
