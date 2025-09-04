"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"

interface ActionMenuItem {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  disabled?: boolean
  variant?: 'default' | 'destructive'
}

interface ActionMenuProps {
  items: ActionMenuItem[]
  label?: string
  className?: string
}

const ActionMenu = React.forwardRef<HTMLButtonElement, ActionMenuProps>(
  ({ items, label = "Actions", className }, ref) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={ref}
          variant="ghost"
          className={className}
          size="sm"
        >
          <span className="sr-only">{label}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {label && (
          <>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={item.onClick}
            disabled={item.disabled}
            className={
              item.variant === 'destructive' 
                ? "text-destructive focus:text-destructive" 
                : ""
            }
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
)
ActionMenu.displayName = "ActionMenu"

export { ActionMenu }
export type { ActionMenuItem }