import { defineCommand } from "./index";

export default defineCommand({
  meta: {
    name: "dev",
    usage: "noyau dev",
    description: "Run noyau development server",
  },
  async invoke(args) {
    console.log("dev", args);
  },
});
