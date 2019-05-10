const TOOLKIT_COMMAND_HOOK = "__toolkitCommand__";

export default {
  classify(tasks: any[]) {
    let match = false;
    const before: any[] = [];
    const after: any[] = [];

    tasks.forEach(item => {
      if (item.command && item.command === TOOLKIT_COMMAND_HOOK) {
        match = true;
      } else if (match) {
        after.push(item);
      } else {
        before.push(item);
      }
    });
    const data: any = {
      before,
      after
    };
    return data;
  }
};
