import type { NoyauConfig } from "./config";
import type { Hookable } from "hookable";
import type { NoyauHooks } from "./hooks";

export type Noyau = {
  // Private fields.
  _version: string;
  // _ignore?: Ignore;

  /** The resolved Nuxt configuration. */
  options: NoyauConfig;
  hooks: Hookable<NoyauHooks>;
  hook: Noyau["hooks"]["hook"];
  callHook: Noyau["hooks"]["callHook"];
  addHooks: Noyau["hooks"]["addHooks"];

  ready: () => Promise<void>;
  close: () => Promise<void>;

  /** The production or development server. */
  server?: any;

  vfs: Record<string, string>;

  // apps: Record<string, NuxtApp>;
};
