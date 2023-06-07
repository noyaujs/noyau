import {
  type RuntimeNoyauHooks,
  type NoyauApp,
  type PluginOptions,
  type AppPlugin,
} from "@noyau/schema";
import { type HookCallback, createHooks } from "hookable";
import { getContext } from "unctx";

const noyauAppCtx = /* #__PURE__ */ getContext<NoyauApp>("noyau-app");

const createContextCaller =
  (noyauApp: NoyauApp) => async (hooks: HookCallback[], args: unknown[]) => {
    for (const hook of hooks) {
      await noyauApp.runWithContext(() => hook(...args));
    }
  };

export const createNoyauApp = () => {
  const hooks = createHooks<RuntimeNoyauHooks>();

  const noyauApp: NoyauApp = {
    ctx: {},
    hooks,
    callHook: (...args) => hooks.callHook(...args),
    hook: (...args) => hooks.hook(...args),
    runWithContext(fn) {
      if (import.meta.env.SSR) {
        return noyauAppCtx.callAsync(noyauApp, fn);
      }
      noyauAppCtx.set(noyauApp);
      return fn();
    },
  };

  if (import.meta.env.SSR) {
    hooks.callHook = (...args) =>
      hooks.callHookWith(createContextCaller(noyauApp), ...args);
  }

  return noyauApp;
};

export const installPlugin = async (noyau: NoyauApp, plugin: AppPlugin) => {
  if (!isPlugin(plugin)) {
    return;
  }
  await noyau.runWithContext(() => plugin(noyau));
};

export const installPlugins = async (noyau: NoyauApp, plugins: AppPlugin[]) => {
  for (const plugin of plugins) {
    // todo run in parallel
    await installPlugin(noyau, plugin);
  }
  // todo handle errors
};

// Will be transformed by unctx/plugin
export const defineNoyauPlugin = (options: PluginOptions): AppPlugin => {
  const plugin: AppPlugin = async (noyau: NoyauApp) => {
    if (options.hooks) {
      noyau.hooks.addHooks(options.hooks);
    }
    if (options.setup) {
      await options.setup(noyau);
    }
  };

  plugin.meta = {
    name: options.name,
  };

  plugin.__noyau_plugin__ = true as const;

  return plugin;
};

export function isPlugin(plugin: unknown): plugin is AppPlugin {
  return typeof plugin === "function" && "__noyau_plugin__" in plugin;
}
