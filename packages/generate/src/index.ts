import logs from "@pi/log";
import chalk from "chalk";
import execa from "execa";
import fs from "fs-extra";
import * as path from "path";
import readFiles from "./utils/readFiles";

const log = logs("core-generate");
const Generator = require("@vue/cli/lib/Generator");
const { hasProjectGit } = require("@vue/cli-shared-utils");
const writeFileTree = require("@vue/cli/lib/util/writeFileTree");

type IGenerate = (api: any, options?: any, rootOptions?: any) => void;

export class Generate {
  public context = process.cwd();

  public getPkg(context: string) {
    const pkgPath = path.resolve(context, "package.json");
    const pkg = fs.existsSync(pkgPath) ? fs.readJsonSync(pkgPath) : {};
    return pkg;
  }

  public async render(
    generate: IGenerate,
    options = { gitDiffTips: true },
    context?: string
  ) {
    const ctx = context || this.context;
    const plugin = {
      id: process.env.moduleReallyName || "/",
      apply: generate
    };
    const pkg = this.getPkg(ctx);
    const createCompleteCbs: any = [];
    const generator = new Generator(ctx, {
      pkg,
      plugins: [plugin],
      files: await readFiles(ctx),
      completeCbs: createCompleteCbs,
      invoking: true
    });
    log.info(`正在为 ${plugin.id} 生成文件...`);
    const runGenerator = async () => {
      const initialFiles = { ...generator.files };
      await generator.resolveFiles();
      generator.sortPkg();
      await writeFileTree(generator.context, generator.files, initialFiles);
    };
    await runGenerator();

    log.success(`${plugin.id} 的文件生成成功`, "✔");
    if (options.gitDiffTips) {
      this.gitDiffTips(ctx);
    }
  }

  public async gitDiffTips(context?: string) {
    const ctx = context || this.context;
    if (hasProjectGit(ctx)) {
      const { stdout } = await execa(
        "git",
        ["ls-files", "--exclude-standard", "--modified", "--others"],
        {
          cwd: ctx
        }
      );

      if (stdout.trim()) {
        log.info(`以下文件已更新/添加:`);
        console.log(
          chalk.red(
            stdout
              .split(/\r?\n/g)
              .map(line => `     ${line}`)
              .join("\n")
          )
        );
        log.success(`你可以通过 ${chalk.cyan(`git diff`)} 查看文件改动`);
      }
    }
  }
}
const generate = new Generate();
export default generate;
