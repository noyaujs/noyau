import { type NoyauHooks } from "./hooks";
import { type Noyau } from "./noyau";

export interface ModuleMeta {
  /** Module name. */
  name?: string;

  /** Module version. */
  version?: string;

  configKey?: string;

  modules?: (NoyauModule | string)[];

  [key: string]: any;
}

export type ModuleOptions = Record<string, any>;

/** Optional result for noyau modules */
export interface ModuleSetupReturn {
  /**
   * Timing information for the initial setup
   */
  timings?: {
    /** Total time took for module setup in ms */
    setup?: number;
    [key: string]: number | undefined;
  };
}

type Awaitable<T> = T | Promise<T>;
type _ModuleSetupReturn = Awaitable<void | false | ModuleSetupReturn>;

export interface ModuleDefinition<T extends ModuleOptions = ModuleOptions> {
  meta?: ModuleMeta;
  defaults?: T | ((noyau: Noyau) => T);
  schema?: T;
  hooks?: Partial<NoyauHooks>;
  setup?: (
    this: void,
    resolvedOptions: T,
    context: { noyau: Noyau }
  ) => _ModuleSetupReturn;
}

export interface NoyauModule<T extends ModuleOptions = ModuleOptions> {
  (this: void, noyau: Noyau): _ModuleSetupReturn;
  getOptions?: (noyau?: Noyau) => Promise<T>;
  getMeta?: () => Promise<ModuleMeta>;
}
