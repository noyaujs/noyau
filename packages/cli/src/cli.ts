import { Command } from "@commander-js/extra-typings";
import consola from "consola";
import devCommand from "./commands/dev";
import buildCommand from "./commands/build";
import prepareCommand from "./commands/prepare";
import moduleBuildCommand from "./commands/module_build";
import modulePrepareCommand from "./commands/module_prepare";

const cli = new Command("noyau")
  .description("Noyau Cli")
  .addCommand(devCommand)
  .addCommand(buildCommand)
  .addCommand(prepareCommand)
  .addCommand(
    new Command("module")
      .description("Module commands")
      .addCommand(moduleBuildCommand)
      .addCommand(modulePrepareCommand)
  );

const main = async () => await cli.parseAsync(process.argv);

if (process.argv.length === 2) {
  cli.help();
}

// Wrap all console logs with consola for better DX
consola.wrapAll();

process.on("unhandledRejection", (err) =>
  consola.error("[unhandledRejection]", err)
);
process.on("uncaughtException", (err) =>
  consola.error("[uncaughtException]", err)
);

main().catch((error) => {
  consola.error(error);
  process.exit(1);
});
