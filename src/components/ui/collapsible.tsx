'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

const Collapsible = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(({ className, open, onOpenChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative', className)}
    {...props}
  />
))
Collapsible.displayName = 'Collapsible'

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn('flex w-full items-center justify-start', className)}
    onClick={(e) => {
      const target = e.currentTarget
      const parent = target.closest('[data-collapsible]')
      if (parent) {
        const isOpen = parent.getAttribute('data-state') === 'open'
        parent.setAttribute('data-state', isOpen ? 'closed' : 'open')
      }
    }}
    {...props}
  />
))
CollapsibleTrigger.displayName = 'CollapsibleTrigger'

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('overflow-hidden transition-all', className)}
    data-state="open"
    {...props}
  />
))
CollapsibleContent.displayName = 'CollapsibleContent'

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
