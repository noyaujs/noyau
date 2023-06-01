/* eslint-disable @typescript-eslint/no-unsafe-return */
import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  build: {
    /**
     * @type {typeof import("../src/types/noyau").NoyauTemplate[]}
     */
    templates: [],
    /**
     * @type {Array<string | RegExp | ((ctx: { isClient?: boolean; isServer?: boolean; isDev: boolean }) => string | RegExp | false)>}>
     */
    transpile: {
      $resolve: (val) => [].concat(val).filter(Boolean),
    },
  },
});
