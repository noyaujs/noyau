import { lstatSync } from "node:fs";
import type { Noyau, NoyauModule } from "@noyau/schema";
import { resolveAlias, resolvePath, importModule } from "@noyau/kit";
import { dirname, isAbsolute } from "pathe";
import { useNoyau } from "@noyau/kit";

/** Installs a module on a Noyau instance. */
export async function installModule(
  moduleToInstall: string | NoyauModule,
  noyau: Noyau
) {
  const { noyauModule } = await normalizeModule(moduleToInstall);

  // Call module
  const res = (await noyauModule(noyau)) ?? {};
  if (res === false /* setup aborted */) {
    return;
  }

  // if (typeof moduleToInstall === "string") {
  //   noyau.options.build.transpile.push(
  //     normalizeModuleTranspilePath(moduleToInstall)
  //   );
  // }

  noyau.options._installedModules = noyau.options._installedModules || [];
  noyau.options._installedModules.push({
    meta: await noyauModule.getMeta?.(),
    timings: res.timings,
    entryPath:
      typeof moduleToInstall === "string"
        ? resolveAlias(moduleToInstall)
        : undefined,
  });
}

// --- Internal ---

export const normalizeModuleTranspilePath = (p: string) => {
  try {
    // we need to target directories instead of module file paths themselves
    // /home/user/project/node_modules/module/index.js -> /home/user/project/node_modules/module
    p = isAbsolute(p) && lstatSync(p).isFile() ? dirname(p) : p;
  } catch (e) {
    // maybe the path is absolute but does not exist, allow this to bubble up
  }
  return p.split("node_modules/").pop() as string;
};

async function normalizeModule(noyauModule: string | NoyauModule | unknown) {
  const noyau = useNoyau();

  // Import if input is string
  if (typeof noyauModule === "string") {
    const src = await resolvePath(noyauModule);
    try {
      // Prefer ESM resolution if possible
      noyauModule = await importModule<NoyauModule>(
        src,
        noyau.options.modulesDir
      );
    } catch (error: unknown) {
      console.error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Error while importing module \`${noyauModule as string}\`: ${error}`
      );
      throw error;
    }
  }

  // Throw error if input is not a function
  if (typeof noyauModule !== "function") {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.log(noyauModule);
    throw new TypeError(`Noyau module should be a function: ${noyauModule}`);
  }

  // TODO: validate options

  return { noyauModule } as {
    noyauModule: NoyauModule<any>;
  };
}
