import { resolve } from "pathe";
import { defineCommand } from ".";
import { buildNoyau, loadNoyau, writeTypes } from "@noyau/core";
import { clearBuildDir } from "../utils/fs";
import { write } from "fs";

export default defineCommand({
  meta: {
    name: "build",
    description: "Build your application",
    usage: "noyau build [rootDir]",
  },
  async invoke(args) {
    const rootDir = resolve(args._[0] || ".");

    const noyau = await loadNoyau({
      cwd: rootDir,
    });

    await noyau.ready();

    await clearBuildDir(noyau.options.buildDir);

    await writeTypes(noyau);
    await buildNoyau(noyau);
  },
});
