"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  className,
  ...props
}: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger
      data-slot="collapsible-trigger"
      className={cn("group/collapsible-trigger", className)}
      {...props}
    />
  )
}

function CollapsiblePanel({
  className,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-panel"
      className={cn(
        "overflow-hidden transition-[height] duration-150 ease-out data-[starting-style]:h-0 data-[ending-style]:h-0",
        className
      )}
      {...props}
    />
  )
}

function CollapsibleChevron({ className }: { className?: string }) {
  return (
    <ChevronDownIcon
      className={cn(
        "size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-open/collapsible-trigger:rotate-180",
        className
      )}
      aria-hidden="true"
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsiblePanel, CollapsibleChevron }
