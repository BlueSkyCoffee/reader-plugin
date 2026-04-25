/**
 * Options 应用主组件
 * 处理路由和页面渲染
 */

import { Route, Routes } from "react-router"
import { PageErrorBoundary } from "@/components/app/error-boundary"
import { SidebarInset } from "@/components/ui/sidebar"
import { ROUTE_CONFIG } from "@/constants/routes"

/**
 * 应用主组件
 */
function App() {
  return (
    <SidebarInset className="flex flex-col h-full overflow-hidden">
      <Routes>
        {ROUTE_CONFIG.map(({ path, component: Component }) => (
          <Route
            key={path}
            path={path}
            element={(
              <PageErrorBoundary>
                <Component />
              </PageErrorBoundary>
            )}
          />
        ))}
      </Routes>
    </SidebarInset>
  )
}

export default App
