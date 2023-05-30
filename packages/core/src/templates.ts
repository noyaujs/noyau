import { mkdir, writeFile } from "node:fs/promises";
import { normalizeTemplate } from "@noyau/kit";
import { Noyau, NoyauTemplateContext } from "@noyau/schema";

export const generateTemplates = async (noyau: Noyau) => {
  // ensure templates are normalized
  const templates = noyau.options.build.templates.map(normalizeTemplate);

  const context: NoyauTemplateContext = { noyau };

  // generate templates
  await Promise.all(
    templates.map(async (template) => {
      const contents = await template.getContents(context);
      // available from its path or #build/ without extension
      noyau.vfs[template.path] = noyau.vfs[
        `#build/${template.filename.replace(/\.\w+$/, "")}`
      ] = contents;

      if (template.write) {
        await mkdir(template.path, { recursive: true });
        await writeFile(template.path, contents, "utf8");
      }
    })
  );
};
