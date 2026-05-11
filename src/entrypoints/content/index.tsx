import { defineContentScript } from "#imports"
import { Provider } from "jotai"
import * as React from "react"
import ReactDOM from "react-dom/client"
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root"
import { ContentLayout } from "@/components/layout/content-layout"
import "@/assets/styles/theme.css"

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
            <ContentLayout />
          </Provider>,
        )

        return root
      },
      onRemove: (root: ReactDOM.Root | undefined) => root?.unmount(),
    })

    ui.mount()
  },
})
