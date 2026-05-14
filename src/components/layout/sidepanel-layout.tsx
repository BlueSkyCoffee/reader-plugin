import * as React from "react"

interface SidePanelLayoutProps {
  nav?: React.ReactNode
  header?: React.ReactNode
  children: React.ReactNode
}

export function SidePanelLayout({ nav, header, children }: SidePanelLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 导航标签 */}
      {nav && (
        <div className="px-3 py-1.5 shrink-0">
          {nav}
        </div>
      )}

      {/* 可选头部（返回按钮等） */}
      {header}

      {/* 内容 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
