import { defineNoyauPlugin } from "#app/noyau";

export default defineNoyauPlugin({
  name: "test",
  setup: async () => {
    console.log("test plugin setup")
  },
});
