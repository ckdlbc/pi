import fs from "fs-extra";
import globby from "globby";
import * as path from "path";
const normalizeFilePaths = require("@vue/cli/lib/util/normalizeFilePaths");
const isBinary = require("isbinaryfile");

export default async function readFiles(context: string) {
  const files = await globby(["**"], {
    cwd: context,
    onlyFiles: true,
    gitignore: true,
    ignore: ["**/node_modules/**", "**/.git/**"],
    dot: true
  });
  const res: any = {};
  for (const file of files) {
    const name = path.resolve(context, file);
    res[file] = isBinary.sync(name)
      ? fs.readFileSync(name)
      : fs.readFileSync(name, "utf-8");
  }
  return normalizeFilePaths(res);
}
