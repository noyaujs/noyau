import { relative, resolve } from "pathe";
import { consola } from "consola";
import { loadNoyau, writeTypes, generateTemplates } from "@noyau/core";
import { clearBuildDir } from "../utils/fs";
import { defineCommand } from "./index";

export default defineCommand({
  meta: {
    name: "module:prepare",
    usage: "npx noyau module:prepare [--log-level] [rootDir]",
    description: "Prepare noyau module for development/build",
  },
  async invoke(args) {
    process.env.NODE_ENV = process.env.NODE_ENV || "production";
    const rootDir = resolve(args._[0] || ".");

    const noyau = await loadNoyau({
      cwd: rootDir,
      overrides: {
        modules: [resolve(rootDir, "./src/module")],
      },
    });

    await noyau.ready();
    await clearBuildDir(noyau.options.buildDir);

    await generateTemplates(noyau);
    await writeTypes(noyau);
    consola.success(
      "Types generated in",
      relative(process.cwd(), noyau.options.buildDir)
    );
  },
});
