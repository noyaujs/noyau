import { pathToFileURL } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { build } from "unbuild";
import consola from "consola";
import { type ModuleMeta, type NoyauModule } from "@noyau/schema";
import { findExports } from "mlly";
import { resolve } from "pathe";
import { Argument, Command, Option } from "@commander-js/extra-typings";

async function writeTypes(distDir: string, meta: ModuleMeta) {
  consola.info("Generating types...");
  const dtsFile = resolve(distDir, "types.d.ts");
  if (existsSync(dtsFile)) {
    return;
  }

  // Read generated module types
  const moduleTypesFile = resolve(distDir, "module.d.ts");
  const moduleTypes = await readFile(moduleTypesFile, "utf8").catch(() => "");
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

export { ${typeExports[0].names.join(", ")} } from './module'
`;

  await writeFile(dtsFile, dtsContents, "utf8");
}

const moduleBuildCommand = new Command("build")
  .description("Build a Noyau module")
  .addArgument(new Argument("[rootDir]", "Root directory").default("."))
  .addOption(new Option("--stub", "Stub module"))
  .action(async (rootDirArg, options) => {
    const rootDir = resolve(rootDirArg);

    await build(rootDir, false, {
      declaration: true,
      stub: typeof options.stub === "boolean" ? options.stub : false,
      rollup: {
        emitCJS: false,
      },
      entries: [
        "src/module",
        { input: "src/runtime/", outDir: `dist/runtime`, ext: "mjs" },
      ],
      externals: ["@noyau/schema", "@noyau/kit", "@noyau/core"],
      hooks: {
        async "rollup:done"(ctx) {
          // Load module meta
          const moduleEntryPath = resolve(ctx.options.outDir, "module.mjs");
          const moduleFn = await import(
            pathToFileURL(moduleEntryPath).toString()
          )
            .then(
              (r: { default: unknown }) =>
                (r.default ||
                  Promise.reject(
                    new Error("Module does not have default export")
                  )) as NoyauModule
            )
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
          const moduleMeta = (await moduleFn.getMeta?.()) ?? {};

          // Enhance meta using package.json
          if (ctx.pkg) {
            if (!moduleMeta?.name) {
              moduleMeta.name = ctx.pkg.name;
            }
            if (!moduleMeta?.version) {
              moduleMeta.version = ctx.pkg.version;
            }
          }

          // Write meta
          const metaFile = resolve(ctx.options.outDir, "module.json");
          await writeFile(
            metaFile,
            JSON.stringify(moduleMeta, null, 2),
            "utf8"
          );

          // Generate types
          await writeTypes(ctx.options.outDir, moduleMeta);
        },
      },
    });
  });

export default moduleBuildCommand;
