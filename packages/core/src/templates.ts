import { mkdir, writeFile } from "node:fs/promises";
import {
  genImport,
  genString,
  genInlineTypeImport,
  genAugmentation,
  genSafeVariableName,
  genArrayFromRaw,
} from "knitwork";
import { addTemplate, normalizeTemplate } from "@noyau/kit";
import {
  type ResolvedNoyauTemplate,
  type Noyau,
  type NoyauTemplateContext,
} from "@noyau/schema";
import { dirname, join, relative, resolve } from "pathe";
import { filename } from "pathe/utils";
import { hash } from "ohash";
import { type SelectiveRequired } from "./utils/types";

export const setupDefaultTemplates = (noyau: Noyau) => {
  const schemaDtsPath = addTemplate({
    filename: "types/schema.d.ts",
    getContents(ctx) {
      const moduleInfo = ctx.noyau.options._installedModules
        .map((m) => ({
          ...(m.meta || {}),
          importName: m.entryPath || m.meta?.name,
        }))
        .filter(
          (m): m is SelectiveRequired<typeof m, "configKey" | "importName"> =>
            Boolean(m.configKey) && Boolean(m.importName)
        );

      const relativeRoot = relative(
        resolve(noyau.options.buildDir, "types"),
        noyau.options.rootDir
      );
      const getImportName = (name: string) =>
        (name.startsWith(".") ? "./" + join(relativeRoot, name) : name).replace(
          /\.\w+$/,
          ""
        );
      const modules = moduleInfo.map((meta) => [
        genString(meta.configKey),
        getImportName(meta.importName),
      ]);

      return [
        genImport(getImportName("@noyau/schema"), ["NoyauModule"]),
        genAugmentation("noyau/schema", {
          NoyauConfig: Object.fromEntries(
            modules.map(([configKey, importName]) => [
              configKey,
              `${genInlineTypeImport(
                importName
              )} extends NoyauModule<infer O> ? Partial<O> : Record<string, any> `,
            ])
          ),
        }),
      ].join("\n");
    },
  }).path;

  addTemplate({
    filename: "plugins/index.mjs",
    write: true,
    getContents(ctx) {
      const plugins = ctx.noyau.options._installedPlugins;
      const exports: string[] = [];
      const imports: string[] = [];
      for (const plugin of plugins) {
        const path = relative(ctx.noyau.options.rootDir, plugin.src);
        const variable =
          genSafeVariableName(filename(plugin.src)).replace(
            /_(45|46|47)/g,
            "_"
          ) +
          "_" +
          hash(path);
        exports.push(variable);
        imports.push(genImport(plugin.src, variable));
      }

      return [...imports, `export default ${genArrayFromRaw(exports)}`].join(
        "\n"
      );
    },
  });

  noyau.hook("types:prepare", ({ references }) => {
    references.push({
      path: schemaDtsPath,
    });
  });
};

export const generateTemplates = async (
  noyau: Noyau,
  filter: (template: ResolvedNoyauTemplate) => boolean = () => true
) => {
  // ensure templates are normalized
  const templates = noyau.options.build.templates.map(normalizeTemplate);

  const context: NoyauTemplateContext = { noyau };

  // generate templates
  await Promise.all(
    templates.filter(filter).map(async (template) => {
      const contents = await template.getContents(context);
      // available from its path or #build/ without extension
      noyau.vfs[template.path] = noyau.vfs[
        `#build/${template.filename.replace(/\.\w+$/, "")}`
      ] = contents;

      if (template.write) {
        await mkdir(dirname(template.path), { recursive: true });
        await writeFile(template.path, contents, "utf8");
      }
    })
  );
};
