import { existsSync, promises as fsp } from "fs";
import { pathToFileURL } from "url";
import { resolve } from "pathe";
import { consola } from "consola";
import type { ModuleMeta, NoyauModule } from "@noyau/schema";
import { findExports } from "mlly";

export interface BuildModuleOptions {
  rootDir: string;
  stub?: boolean;
  outDir?: string;
}

import { defineBuildConfig } from "unbuild";
export default defineBuildConfig({
  declaration: true,
  entries: [
    "src/module",
    { input: "src/runtime/", outDir: `dist/runtime`, ext: "mjs" },
  ],
  rollup: {
    emitCJS: false,
    cjsBridge: true,
  },
  externals: ["@noyau/schema", "@noyau/kit", "noyau"],
  hooks: {
    async "rollup:done"(ctx) {
      // Generate CommonJS stup
      await writeCJSStub(ctx.options.outDir);

      // Load module meta
      const moduleEntryPath = resolve(ctx.options.outDir, "module.mjs");
      const moduleFn: NoyauModule = await import(
        pathToFileURL(moduleEntryPath).toString()
      )
        .then((r) => (r.default || r) as NoyauModule)
        .catch((err) => {
          consola.error(err);
          consola.error(
            "Cannot load module. Please check dist:",
            moduleEntryPath
          );
          return null;
        });
      if (!moduleFn) {
        return;
      }
      const moduleMeta = await moduleFn.getMeta();

      // Enhance meta using package.json
      if (ctx.pkg) {
        if (!moduleMeta.name) {
          moduleMeta.name = ctx.pkg.name;
        }
        if (!moduleMeta.version) {
          moduleMeta.version = ctx.pkg.version;
        }
      }

      // Write meta
      const metaFile = resolve(ctx.options.outDir, "module.json");
      await fsp.writeFile(
        metaFile,
        JSON.stringify(moduleMeta, null, 2),
        "utf8"
      );

      // Generate types
      await writeTypes(ctx.options.outDir, moduleMeta);
    },
  },
});

async function writeTypes(distDir: string, meta: ModuleMeta) {
  const dtsFile = resolve(distDir, "types.d.ts");
  if (existsSync(dtsFile)) {
    return;
  }

  // Read generated module types
  const moduleTypesFile = resolve(distDir, "module.d.ts");
  const moduleTypes = await fsp
    .readFile(moduleTypesFile, "utf8")
    .catch(() => "");
  const typeExports = findExports(moduleTypes);
  const isStub = moduleTypes.includes("export *");

  const schemaShims: string[] = [];
  const moduleImports: string[] = [];

  const hasTypeExport = (name: string) =>
    isStub || typeExports.find((exp) => exp.names.includes(name));

  if (meta.configKey && hasTypeExport("ModuleOptions")) {
    moduleImports.push("ModuleOptions");
    schemaShims.push(
      `  interface NoyauConfig { ['${meta.configKey}']?: Partial<ModuleOptions> }`
    );
    schemaShims.push(
      `  interface NoyauOptions { ['${meta.configKey}']?: ModuleOptions }`
    );
  }
  if (hasTypeExport("ModuleHooks")) {
    moduleImports.push("ModuleHooks");
    schemaShims.push("  interface NoyauHooks extends ModuleHooks {}");
  }
  if (hasTypeExport("ModuleRuntimeConfig")) {
    moduleImports.push("ModuleRuntimeConfig");
    schemaShims.push(
      "  interface RuntimeConfig extends ModuleRuntimeConfig {}"
    );
  }
  if (hasTypeExport("ModulePublicRuntimeConfig")) {
    moduleImports.push("ModulePublicRuntimeConfig");
    schemaShims.push(
      "  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}"
    );
  }

  const dtsContents = `
import { ${moduleImports.join(", ")} } from './module'

${
  schemaShims.length
    ? `declare module '@noyau/schema' {\n${schemaShims.join("\n")}\n}\n`
    : ""
}
${
  schemaShims.length
    ? `declare module 'noyau/schema' {\n${schemaShims.join("\n")}\n}\n`
    : ""
}

export { ${typeExports[0].names.join(", ")} } from './module'
`;

  await fsp.writeFile(dtsFile, dtsContents, "utf8");
}

async function writeCJSStub(distDir: string) {
  const cjsStubFile = resolve(distDir, "module.cjs");
  if (existsSync(cjsStubFile)) {
    return;
  }
  const cjsStub = `module.exports = function(...args) {
  return import('./module.mjs').then(m => m.default.call(this, ...args))
}
const _meta = module.exports.meta = require('./module.json')
module.exports.getMeta = () => Promise.resolve(_meta)
`;
  await fsp.writeFile(cjsStubFile, cjsStub, "utf8");
}
