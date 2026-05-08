import { defineContentScript } from "#imports"
import { Provider } from "jotai"
import * as React from "react"
import ReactDOM from "react-dom/client"
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root"
import { PageErrorBoundary } from "@/components/app/error-boundary"
import { ReaderContainer } from "./components/reader-container"
import "@/assets/styles/theme.css"

/**
 * Content Script 入口
 * 创建 Shadow DOM UI 并渲染阅读器容器
 */
export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(context) {
    const ui = await createShadowRootUi(context, {
      name: "web-novel-reader",
      position: "modal",
      zIndex: 2147483647,
      isolateEvents: true,
      onMount: (container: HTMLElement, _shadow: ShadowRoot, shadowHost: HTMLElement) => {
        container.id = "reader-root"
        container.style.pointerEvents = "none"
        shadowHost.style.pointerEvents = "none"

        const root = ReactDOM.createRoot(container)
        root.render(
          <Provider>
            <PageErrorBoundary>
              <ReaderContainer />
            </PageErrorBoundary>
          </Provider>,
        )

        return root
      },
      onRemove: (root: ReactDOM.Root | undefined) => root?.unmount(),
    })

    ui.mount()
  },
})
