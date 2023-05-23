import { cyan } from "colorette";
import { showHelp } from "../utils/help";
import { commands, defineCommand } from "./index";

export default defineCommand({
  meta: {
    name: "help",
    usage: "noyau help",
    description: "Show help",
  },
  invoke() {
    const sections: string[] = [];

    sections.push(
      `Usage: ${cyan(`noyau ${Object.keys(commands).join("|")} [args]`)}`
    );

    console.log(sections.join("\n\n") + "\n");

    // Reuse the same wording as in `-h` commands
    showHelp({});
  },
});
