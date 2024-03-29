import {
  type UserConfig as ViteConfig,
  type PluginOption as VitePlugin,
} from "vite";
import { useNoyau } from "./context";

export interface ExtendConfigOptions {
  /**
   * @default true
   */
  dev?: boolean;
  /**
   * @default true
   */
  build?: boolean;
  /**
   * @default true
   */
  server?: boolean;
  /**
   * @default true
   */
  client?: boolean;
  /**
   * Prepends the plugin to the array with `unshit()` instead of `push()`.
   */
  prepend?: boolean;
}

export const extendViteConfig = (
  fn: (
    config: ViteConfig,
    env: { isClient: boolean; isServer: boolean }
  ) => void,
  options: ExtendConfigOptions = {}
) => {
  const noyau = useNoyau();

  if (options.dev === false && noyau.options.dev) {
    return;
  }
  if (options.build === false && noyau.options.build) {
    return;
  }

  // if (options.server !== false && options.client !== false) {
  //   // Call fn() only once
  //   return noyau.hook("vite:extend", ({ config, env }) => fn(config, env));
  // }

  noyau.hook("vite:extendConfig", (config, { isClient, isServer }) => {
    if (options.server !== false && isServer) {
      return fn(config, { isClient, isServer });
    }
    if (options.client !== false && isClient) {
      return fn(config, { isClient, isServer });
    }
  });
};

export function addVitePlugin(
  pluginOrGetter:
    | VitePlugin
    | ((env: { isClient: boolean; isServer: boolean }) => VitePlugin),
  options?: ExtendConfigOptions
) {
  extendViteConfig((config, env) => {
    const method: "push" | "unshift" = options?.prepend ? "unshift" : "push";
    const plugin =
      typeof pluginOrGetter === "function"
        ? pluginOrGetter(env)
        : pluginOrGetter;

    config.plugins = config.plugins ?? [];
    if (Array.isArray(plugin)) {
      config.plugins[method](...plugin);
    } else {
      config.plugins[method](plugin);
    }
  }, options);
}
