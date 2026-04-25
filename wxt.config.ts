import { resolve } from "node:path"
import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
// public/_locales is automatically copied to extension root by WXT
// browser.i18n.getMessage API reads from _locales/ at extension root
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  dev: {
    server: {
      host: "127.0.0.1",
      port: 3000,
    },
  },
  manifest: {
    name: "__MSG_extName__",
    description: "__MSG_extDescription__",
    default_locale: "zh_CN",
    permissions: ["storage", "tabs", "notifications", "contextMenus", "scripting", "activeTab"],
    host_permissions: ["*://*/*"],
  },
  alias: {
    "@": "src",
    "@locales": resolve(__dirname, "public/_locales"),
  },
  vite: () => ({
    server: {
      watch: {
        ignored: ["**/demo/**"],
      },
    },
    optimizeDeps: {
      entries: ["src/entrypoints/**/*.html"],
    },
  }),
})
