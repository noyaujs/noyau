import { resolve } from "pathe";
import { buildNoyau, loadNoyau, writeTypes } from "@noyau/core";
import { Argument, Command } from "@commander-js/extra-typings";
import { clearBuildDir } from "../utils/fs";

const buildCommand = new Command("build")
  .description("Build a Noyau project")
  .addArgument(new Argument("[rootDir]", "Root directory").default("."))
  .action(async (rootDirArg) => {
    const rootDir = resolve(rootDirArg);

    const noyau = await loadNoyau({
      cwd: rootDir,
    });

    await noyau.ready();

    await clearBuildDir(noyau.options.buildDir);

    await writeTypes(noyau);
    await buildNoyau(noyau);
  });

export default buildCommand;
