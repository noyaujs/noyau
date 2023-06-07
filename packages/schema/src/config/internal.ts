/* eslint-disable @typescript-eslint/no-unsafe-return */
import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  /**
   * @private
   * @type {Record<string, boolean>}
   */
  _requiredModules: {},
  /**
   * @private
   * @type {{
   *  meta?: typeof import("../src/types/module").ModuleMeta;
   *  timings?: typeof import("../src/types/module").ModuleSetupReturn["timings"];
   *  entryPath?: string;
   * }[]} InstalledModule
   */
  _installedModules: [],

  /**
   * @private
   * @type {typeof import("../src/types/noyau").NoyauPlugin[]}
   */
  _installedPlugins: [],
  /**
   * @private
   * TODO: move this into the core package
   */
  appDir: "",
});
