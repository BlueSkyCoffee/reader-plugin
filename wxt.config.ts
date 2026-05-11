import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
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
    permissions: ["storage", "tabs", "notifications", "contextMenus", "scripting", "activeTab", "sidePanel"],
    host_permissions: ["*://*/*"],
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
  alias: {
    "@": "src",
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
