/* eslint-disable @typescript-eslint/no-unsafe-return */
import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  build: {
    /**
     * @type {typeof import("../src/types/noyau").NoyauTemplate[]}
     */
    templates: [],
  },
});
