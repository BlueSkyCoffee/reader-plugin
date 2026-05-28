"use client"

import * as DirectionPrimitive from "@radix-ui/react-direction"
import * as React from "react"

function DirectionProvider({
  dir,
  direction,
  children,
}: React.ComponentProps<typeof DirectionPrimitive.DirectionProvider> & {
  direction?: React.ComponentProps<typeof DirectionPrimitive.DirectionProvider>["dir"]
}) {
  return (
    <DirectionPrimitive.DirectionProvider dir={direction ?? dir}>
      {children}
    </DirectionPrimitive.DirectionProvider>
  )
}

const useDirection = DirectionPrimitive.useDirection

export { DirectionProvider, useDirection }
