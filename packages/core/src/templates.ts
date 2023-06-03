import { mkdir, writeFile } from "node:fs/promises";
import {
  genImport,
  genString,
  genInlineTypeImport,
  genAugmentation,
} from "knitwork";
import { addTemplate, normalizeTemplate } from "@noyau/kit";
import {
  type ResolvedNoyauTemplate,
  type Noyau,
  type NoyauTemplateContext,
} from "@noyau/schema";
import { dirname, join, relative, resolve } from "pathe";
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
