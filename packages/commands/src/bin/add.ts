import Intl from "@pi/intl";
import logs from "@pi/log";
import module from "@pi/module";
import moduleName from "@pi/module-name";
import message from "../locale";

const log = logs("core-commands");

export default async function(cliArgs: string[]) {
  let name = cliArgs.pop();
  if (name) {
    name = moduleName.fullName(name);
    await module.installOne(name);
  } else {
    const intl = new Intl(message);
    log.warn(intl.get("installTips"));
  }
}
