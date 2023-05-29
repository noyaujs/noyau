import { defineNitroPlugin } from "#internal/nitro";
import { buildAssetsURL } from "#noyau/paths";
import { type NoyauRenderHTMLContext } from "@noyau/schema";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("render:html", (html: NoyauRenderHTMLContext) => {
    html.bodyAppend.push(`
    <script type="module" async>
    import RefreshRuntime from "${buildAssetsURL("@react-refresh")}"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true
</script>
`);
  });
});
