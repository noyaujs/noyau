import { createHooks } from "hookable";
import { loadNoyauConfig, type LoadNoyauConfigOptions } from "@noyau/kit";
import { type NoyauHooks, type NoyauOptions, type Noyau } from "@noyau/schema";
import { debounce } from "perfect-debounce";
import { noyauCtx } from "@noyau/kit";
import { join, resolve } from "pathe";
import { version } from "../package.json";
import { initNitro } from "./nitro";
import { distDir, pkgDir } from "./dirs";
import { bundle } from "./vite";
import { installModules } from "./module/install";
import { watch } from "./watch";
import { generateTemplates, setupDefaultTemplates } from "./templates";
import { loadPlugins } from "./plugins";

export const buildNoyau = async (noyau: Noyau) => {
  await loadPlugins(noyau);
  await generateTemplates(noyau);

  if (noyau.options.dev) {
    const debouncedGenerateTemplates = debounce(
      () => generateTemplates(noyau),
      undefined,
      { leading: true }
    );
    const debouncedLoadPlugins = debounce(() => loadPlugins(noyau), undefined, {
      leading: true,
    });

    await watch(noyau);
    noyau.hook("template:generate", async (filter) => {
      if (filter) {
        await generateTemplates(noyau, filter);
      }
      await debouncedGenerateTemplates();
    });

    noyau.hook("watch", async (event, path) => {
      if (
        event !== "update" &&
        path.startsWith(join(noyau.options.srcDir, noyau.options.dir.plugins))
      ) {
        await debouncedLoadPlugins();
      }
    });
  }

  await bundle(noyau);
  await noyau.callHook("build:done", noyau);

  if (!noyau.options.dev) {
    await noyau.callHook("close", noyau);
  }
};

function createNoyau(options: NoyauOptions) {
  const hooks = createHooks<NoyauHooks>();

  const noyau: Noyau = {
    _version: version,
    options,
    hooks,
    callHook: (...args) => hooks.callHook(...args),
    addHooks: (...args) => hooks.addHooks(...args),
    hook: (...args) => hooks.hook(...args),
    ready: () => initNoyau(noyau),
    close: () => Promise.resolve(hooks.callHook("close", noyau)),
    vfs: {},
  };

  return noyau;
}

const initNoyau = async (noyau: Noyau) => {
  noyauCtx.set(noyau);
  noyau.hook("close", () => {
    noyauCtx.unset();
  });

  // add modules
  // await noyau.callHook("modules:before", noyau);
  await installModules(noyau);
  // await noyau.callHook("modules:done", noyau);

  setupDefaultTemplates(noyau);

  await initNitro(noyau);

  await noyau.hooks.callHook("ready", noyau);
};

export const loadNoyau = async (options: LoadNoyauConfigOptions) => {
  const config = await loadNoyauConfig(options);

  config.appDir = config.alias["#app"] = resolve(distDir, "app");
  // config.modulesDir.push(resolve(options.workspaceDir, "node_modules"));
  config.modulesDir.push(resolve(pkgDir, "node_modules"));

  return createNoyau(config);
};
