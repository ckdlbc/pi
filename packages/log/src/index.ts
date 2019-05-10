import home from "@pi/home";
import chalk from "chalk";
import debug from "debug";
import * as util from "util";

const formatters: any = {
  o(v: any) {
    return util.inspect(v).replace(/\s*\n\s*/g, " ");
  },
  O(v: any) {
    return util.inspect(v);
  }
};

export default (moduleName?: string) => {
  moduleName = moduleName || "";
  /**
   * 根据颜色打印
   * @param content
   * @param color
   * @param entryType
   * @returns {boolean}
   */
  function message(this: any) {
    const isEntry = process.env[home.getEntryModuleEnvName()] === moduleName;

    // entryType 为 cli 代表只有当前模块做为入口模块时才打印
    // entryType 为 func 代表只有当前模块不是入口模块时才打印
    if (
      (this.entryType === "cli" && !isEntry) ||
      (this.entryType === "func" && isEntry)
    ) {
      // 返回布尔值,主要是留个勾子写单测
      return false;
    }

    const color = this.color;
    const _self = message;
    let args = Array.prototype.slice.call(arguments);

    if (args[0] instanceof Error) {
      args[0] = args[0].stack || args[0].message;
    }

    if (typeof args[0] !== "string") {
      // anything else let's inspect with %O
      args.unshift("%O");
    }

    let index = 0;
    let originFormatCount = 0;

    // 获取第一个参数的所有占位字符, 遇到有自定义的,便调用自定义的进行转换
    args[0] = args[0].replace(/%([a-zA-Z%])/g, (match: any, format: any) => {
      // if we encounter an escaped % then don't increase the array index
      if (match === "%%") {
        return match;
      }
      index += 1;
      originFormatCount += 1;
      const formatter = formatters[format];
      if (typeof formatter === "function") {
        const val = args[index];
        match = formatter.call(_self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index -= 1;
        originFormatCount -= 1;
      }
      return match;
    });

    // 将所有字符串加上颜色
    args = args.map((val, idx) => {
      if (idx === 0 || idx > originFormatCount) {
        return (chalk as any)[color](
          idx === 0 ? `${moduleName ? `[${moduleName}] ` : " "}${val}` : val
        );
      }
      return val;
    });

    // format args
    // 不同颜色，用不同的console方法输出，虽然都是一样，主要是方便测试时做判断
    if (color === "red") {
      console.error.bind(console).apply(_self, args as any);
    } else if (color === "yellow") {
      console.warn.bind(console).apply(_self, args as any);
    } else {
      console.log.bind(console).apply(_self, args as any);
    }

    return true;
  }

  function getLeaves(entryType: string) {
    const methods: any = {
      info: "magenta",
      success: "green",
      warn: "yellow",
      error: "red"
    };
    const leaves: any = {};

    Object.keys(methods).forEach(key => {
      function leafFunc() {
        const color = methods[key];
        const args = Array.prototype.slice.call(arguments);
        return message.apply(
          {
            entryType,
            color
          },
          args as any
        );
      }
      leaves[key] = leafFunc;
    });
    return leaves;
  }
  return {
    cli: getLeaves("cli"),
    func: getLeaves("func"),
    debug: debug(moduleName),
    debugEnable: debug.enable,
    ...getLeaves("all")
  };
};
