/* eslint-disable @typescript-eslint/no-unsafe-return */
import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  /**
   * @type {typeof import('nitropack')['NitroConfig']}
   */
  nitro: {
    renderer: "",
  },
  /**
   * @type {typeof import('nitropack')['NitroEventHandler'][]}
   */
  serverHandlers: [],

  /**
   * @type {typeof import('nitropack')['NitroDevEventHandler'][]}
   */
  devServerHandlers: [],
});
