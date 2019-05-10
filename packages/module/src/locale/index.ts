/**
 * 语言文件
 */

export default {
  zh_CN: {
    autoUpdate: "{name} 设置了自动更新,正在执行更新操作...",
    autoUpdateZ:
      "检查到您本地版本为 {localVersion} , 自动为您升级到兼容版本 {autoZVersion} 中...",
    autoInstall: "本地尚未安装 {name} ,正在执行自动安装...",
    // install-one.js
    importPkgError:
      "您传入的包名有误，请输入正确的包名，如： @pi/toolkit-xxx，@pi/plugin-xxx",
    installSuccess: "{name} 安装成功",
    updateSuccess: "{name} 更新成功",
    // utils.js
    updateNone: "本地暂无可更新的模块",
    updateTo: "从 {localVersion} 升级至 {lastVersion}",
    updateVersion: "{lastVersion} 版本",
    localVersion: " , 本地版本是 {localVersion} ",
    updateTips: "升级提示",
    recommendVersion: "{name} 推荐的版本是 {version}",
    recommendInstall: "请执行 {icon}  {installTip} 来升级模块",
    includeUpdate: "包含以下更新:",
    installError: "{name} 安装报错，请确认该package是否存在!"
  },
  en_US: {
    autoUpdate:
      "{name} has set an automatic update and is excuting an update operation...",
    autoUpdateZ:
      "Your local version is {localVersion}, automatically upgrading to compatible version {autoZVersion} for you...",
    autoInstall:
      "{name} has not been installed, performing an automatic installation...",
    // install-one.js
    importPkgError:
      "Package name is incorrect. Please re-enter the correct package name，eg: @pi/toolkit-xxx， @pi/plugin-xxx",
    installSuccess: "{name} install completed",
    updateSuccess: "{name} update completed",
    // utils.js
    updateNone: "No update to the module",
    updateTo: "Upgrade from {localVersion} to {lastVersion}",
    updateVersion: "{lastVersion} version",
    localVersion: " , The local version is {localVersion} ",
    updateTips: "Upgrade tips",
    recommendVersion: "{name}: recommended version is {version}",
    recommendInstall:
      "Please execute {icon} {installTip} to upgrade the module",
    includeUpdate: "Include the following updates:",
    installError:
      "Install {name} package error, please confirm whether the package exists!"
  }
};
