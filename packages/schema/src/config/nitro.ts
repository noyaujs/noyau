/* eslint-disable @typescript-eslint/no-unsafe-return */
import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  /**
   * @type {typeof import('nitropack')['NitroConfig']}
   */
  nitro: {
    renderer: "",
  },
});
