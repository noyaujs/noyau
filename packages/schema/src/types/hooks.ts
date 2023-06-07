import { type EventHandler } from "h3";
import { type ViteDevServer, type UserConfig as ViteConfig } from "vite";
import { type EventType as ParcelWatcherEventType } from "@parcel/watcher";
import { type TSConfig } from "pkg-types";
import { type Noyau, type ResolvedNoyauTemplate } from "./noyau";

type HookResult = void | Promise<void>;

// https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html
export type TSReference = { types: string } | { path: string };

export interface NoyauHooks {
  ready: (noyau: Noyau) => HookResult;
  close: (noyau: Noyau) => HookResult;
  "build:done": (noyau: Noyau) => HookResult;
  "server:devHandler": (handler: EventHandler) => HookResult;
  "modules:installed": () => HookResult;
  "template:generate": (
    filter?: (template: ResolvedNoyauTemplate) => boolean
  ) => HookResult;
  "vite:extend": (viteBuildContext: {
    noyau: Noyau;
    config: ViteConfig;
  }) => HookResult;
  "vite:extendConfig": (
    viteInlineConfig: ViteConfig,
    env: { isClient: boolean; isServer: boolean }
  ) => HookResult;
  "vite:serverCreated": (
    server: ViteDevServer,
    env: { isClient: boolean; isServer: boolean }
  ) => HookResult;
  "nitro:renderer": (renderer: string) => HookResult;
  watch: (type: ParcelWatcherEventType, path: string) => HookResult;
  "types:prepare": (options: {
    references: TSReference[];
    declarations: string[];
    tsConfig: TSConfig;
  }) => HookResult;
}

export interface RuntimeNoyauHooks {
  "app:error": (error: Error) => HookResult;
}
