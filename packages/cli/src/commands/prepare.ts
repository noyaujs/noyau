import { relative, resolve } from "pathe";
import { consola } from "consola";
import { loadNoyau, writeTypes, generateTemplates } from "@noyau/core";
import { Argument, Command } from "@commander-js/extra-typings";
import { clearBuildDir } from "../utils/fs";

const prepareCommand = new Command("prepare")
  .description("Prepare noyau for development/build")
  .addArgument(new Argument("[rootDir]", "Root directory").default("."))
  .action(async (rootDirArg) => {
    process.env.NODE_ENV = process.env.NODE_ENV ?? "production";
    const rootDir = resolve(rootDirArg);

    const noyau = await loadNoyau({
      cwd: rootDir,
    });

    await noyau.ready();

    await clearBuildDir(noyau.options.buildDir);

    await generateTemplates(noyau);
    await writeTypes(noyau);
    consola.success(
      "Types generated in",
      relative(process.cwd(), noyau.options.buildDir)
    );
  });

export default prepareCommand;
