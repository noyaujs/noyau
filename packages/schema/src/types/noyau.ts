import type { NoyauOptions } from "./config";
import type { Hookable } from "hookable";
import type { NoyauHooks } from "./hooks";
import { R } from "untyped/dist/types-a20127ea";

// interface so it can be extended
export interface NoyauTemplateContext {
  noyau: Noyau;
}

export type NoyauTemplate = {
  filename: string;
  getContents: (ctx: NoyauTemplateContext) => string | Promise<string>;
  write?: boolean;
};

export type ResolvedNoyauTemplate = NoyauTemplate & {
  path: string;
};

export type RouteSegmentType = "static" | "dynamic" | "optional" | "splat";
export type RouteSegment = {
  type: RouteSegmentType;
  value: string;
};

export type NoyauRoute = {
  name: string;
  path: RouteSegment | RouteSegment[];
  file: string;
  children?: NoyauRoute[];
};

export type Noyau = {
  // Private fields.
  _version: string;
  // _ignore?: Ignore;

  /** The resolved Nuxt configuration. */
  options: NoyauOptions;
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
