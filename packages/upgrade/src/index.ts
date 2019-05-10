import cache from "@pi/cache";
import Intl from "@pi/intl";
import logs from "@pi/log";
import npm from "@pi/npm";
import chalk from "chalk";
import emoji from "node-emoji";
import semver from "semver";
import message from "./locale/";

const log = logs("core-upgrade");

const TIP_CACHE_KEY = "__versionTip";

/**
 * 升级提示，若发布新版本，会定时提醒是否需要更新
 * @param data object { "name" : 包名, "version" : 当前版本}
 */
async function updateTip(data: any) {
  if (cache.get(TIP_CACHE_KEY)) {
    return;
  }

  const latest = await npm.latest(data.name);

  // 缓存设置为3小时，过了3小时才重新提示升级 PI
  cache.set(TIP_CACHE_KEY, true, {
    expires: 108000000
  });

  // latest 没有值，可能没有网络
  if (!latest) {
    return;
  }

  log.debug(
    "%s current-version: %s, latest-version: %s",
    data.name,
    data.version,
    latest.version
  );

  if (!semver.lt(data.version, latest.version)) {
    return;
  }
  const installer = data.name.indexOf("@pi") !== -1 ? "tnpm" : "npm";
  const intl = new Intl(message);
  console.log("\n");
  log.warn(
    `******************** ${emoji.get("warning")} ${emoji.get(
      "warning"
    )}   ${intl.get("updateTips")}  ${emoji.get("warning")} ${emoji.get(
      "warning"
    )} **********************`
  );
  log.warn(
    intl.get("recommendVersion", {
      latest: chalk.green.bold(latest.version),
      localVersion: data.version
    })
  );
  log.warn(
    intl.get("updateCommand", {
      icon: emoji.get("point_right"),
      command: chalk.bgRed.bold(` ${installer} install -g ${data.name} `)
    })
  );
  log.warn(
    `${intl.get("ifUpdateError")} ${chalk.red.bold(
      `sudo ${installer} install -g ${data.name} `
    )}`
  );
  log.warn(
    `******************************${emoji.get("point_up_2")} ${emoji.get(
      "point_up_2"
    )} ******************************`
  );
  console.log("\n");
}

export default updateTip;
