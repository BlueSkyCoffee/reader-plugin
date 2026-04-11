import * as React from "react"

interface DragPosition {
  x: number
  y: number
}

interface DragHandlers {
  onPointerDown: (event: React.PointerEvent) => void
}

export function useDraggable(enabled: boolean) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = React.useState<DragPosition>({ x: 24, y: 24 })
  const sizeRef = React.useRef({ width: 320, height: 160 })
  const dragStateRef = React.useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })

  React.useLayoutEffect(() => {
    if (!ref.current) {
      return
    }

    const updateSize = () => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) {
        return
      }
      sizeRef.current = { width: rect.width, height: rect.height }
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  const clampPosition = React.useCallback((next: DragPosition) => {
    const { width, height } = sizeRef.current
    const maxX = Math.max(0, window.innerWidth - width)
    const maxY = Math.max(0, window.innerHeight - height)
    return {
      x: Math.min(Math.max(0, next.x), maxX),
      y: Math.min(Math.max(0, next.y), maxY),
    }
  }, [])

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent) => {
      if (!enabled) {
        return
      }
      if (event.button !== 0) {
        return
      }
      dragStateRef.current = {
        isDragging: true,
        startX: event.clientX,
        startY: event.clientY,
        originX: position.x,
        originY: position.y,
      }
      document.body.style.userSelect = "none"
    },
    [enabled, position.x, position.y],
  )

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current.isDragging) {
        return
      }
      const deltaX = event.clientX - dragStateRef.current.startX
      const deltaY = event.clientY - dragStateRef.current.startY
      setPosition(prev => clampPosition({
        ...prev,
        x: dragStateRef.current.originX + deltaX,
        y: dragStateRef.current.originY + deltaY,
      }))
    }

    const handlePointerUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false
        document.body.style.userSelect = ""
      }
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [clampPosition, enabled])

  return {
    ref,
    position,
    handlers: { onPointerDown } satisfies DragHandlers,
  }
}
