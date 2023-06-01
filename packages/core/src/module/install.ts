import { lstatSync } from "node:fs";
import type { Noyau, NoyauModule } from "@noyau/schema";
import { resolveAlias, resolvePath, importModule } from "@noyau/kit";
import { dirname, isAbsolute } from "pathe";
import { useNoyau } from "@noyau/kit";
import graphSequencer from "@pnpm/graph-sequencer";

/** Installs a module on a Noyau instance. */
export async function installModule(
  moduleToInstall: string | NoyauModule,
  noyau: Noyau
) {
  const { noyauModule } = await resolveModule(moduleToInstall);

  // Call module
  const res = (await noyauModule(noyau)) ?? {};
  if (res === false /* setup aborted */) {
    return;
  }

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

async function resolveModule(noyauModule: string | NoyauModule | unknown) {
  const noyau = useNoyau();

  // Import if input is string
  if (typeof noyauModule === "string") {
    const src = await resolvePath(noyauModule);
    try {
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
    throw new TypeError(`Noyau module should be a function: ${noyauModule}`);
  }

  // TODO: validate options

  return { noyauModule } as {
    noyauModule: NoyauModule<any>;
  };
}

type Node = {
  deps: string[];
  module: NoyauModule<any>;
  path?: string;
};

export const createModuleMap = async (
  modulesToInstall: (NoyauModule | string)[],
  moduleMap = new Map<string, Node>(),
  parent = ""
) => {
  for (const module of modulesToInstall) {
    const { noyauModule } = await resolveModule(module);
    const moduleMeta = await noyauModule.getMeta?.();

    const moduleName = `module:${
      moduleMeta?.name ||
      (typeof module === "string" ? module : Math.random() * 10000000)
    }`;

    const moduleDeps = moduleMeta?.modules || [];

    if (parent && moduleMap.get(parent)?.deps.push(moduleName) === undefined) {
      throw new Error(`Module ${parent} not found in module map`);
    }

    if (!moduleMap.get(moduleName)) {
      moduleMap.set(moduleName, {
        deps: [],
        module: noyauModule,
        path:
          typeof module === "string" ? await resolvePath(module) : undefined,
      });
      await createModuleMap(moduleDeps, moduleMap, moduleName);
    }
  }

  return moduleMap;
};

export const installModules = async (noyau: Noyau) => {
  const modulesToInstall = noyau.options.modules;

  const moduleMap = await createModuleMap(modulesToInstall);
  const graph = new Map(
    [...moduleMap.entries()].map(([name, { deps }]) => [name, deps])
  );

  const resolvedGraph = graphSequencer({
    graph,
    groups: [Array.from(graph.keys())],
  });

  if (resolvedGraph.safe == false) {
    throw new Error("Circular dependency detected");
  }

  for (const chunk of resolvedGraph.chunks) {
    await Promise.all(
      chunk
        .map(
          (name) =>
            [moduleMap.get(name)?.module, moduleMap.get(name)?.path] as [
              NoyauModule<any>,
              string | undefined
            ]
        )
        .filter((res): res is [NoyauModule<any>, string | undefined] =>
          Boolean(res[0])
        )
        .map(async ([mod, path]) => {
          await installModule(mod, noyau);
          if (path) {
            noyau.options.build.transpile.push(
              normalizeModuleTranspilePath(path)
            );
          }
        })
    );
  }

  await noyau.callHook("modules:installed");
};
