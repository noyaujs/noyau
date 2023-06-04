import mri from "mri";

import { consola } from "consola";
import type { Command, Commands } from "./commands";
import { commands } from "./commands";
import { showHelp } from "./utils/help";
import { red } from "colorette";

const isValidCommand = (command: string): command is Commands =>
  command in commands;

async function main() {
  const args = mri(process.argv.slice(2), {
    boolean: ["no-clear"],
  });

  const command = args._.shift() ?? "usage";

  if (!isValidCommand(command)) {
    console.log("\n" + red("Invalid command " + command));

    await commands.usage().then((r) => r.invoke(args));
    return "error";
  }

  const cmd = (await commands[command]()) as Command;
  if (args.h || args.help) {
    showHelp(cmd.meta);
  } else {
    const result = await cmd.invoke(args);
    return result;
  }
}

// Wrap all console logs with consola for better DX
consola.wrapAll();

process.on("unhandledRejection", (err) =>
  consola.error("[unhandledRejection]", err)
);
process.on("uncaughtException", (err) =>
  consola.error("[uncaughtException]", err)
);

main()
  .then((result) => {
    if (result === "error") {
      process.exit(1);
    } else if (result !== "wait") {
      process.exit();
    }
  })
  .catch((error) => {
    consola.error(error);
    process.exit(1);
  });
