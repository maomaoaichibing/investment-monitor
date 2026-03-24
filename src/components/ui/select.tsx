'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

const Select = React.forwardRef<
  HTMLDivElement,
  {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
    disabled?: boolean
  }
>(({ value, onValueChange, children, disabled = false, ...props }, ref) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div ref={ref} className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  )
})
Select.displayName = 'Select'

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within Select')

  return (
    <button
      ref={ref}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      <span className="truncate">{children}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectValue must be used within Select')

  return (
    <span
      ref={ref}
      className={`block truncate ${className}`}
      {...props}
    >
      {children || '选择...'}
    </span>
  )
})
SelectValue.displayName = 'SelectValue'

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 ${className}`}
      style={{ top: '100%', left: 0, marginTop: '0.25rem' }}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
})
SelectContent.displayName = 'SelectContent'

const SelectItem = React.forwardRef<
  HTMLDivElement,
  {
    value: string
    children: React.ReactNode
    disabled?: boolean
  }
>(({ value, children, disabled = false, ...props }, ref) => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectItem must be used within Select')

  const isSelected = context.value === value

  return (
    <div
      ref={ref}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent text-accent-foreground' : ''} ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      onClick={() => !disabled && context.onValueChange(value)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="truncate">{children}</span>
    </div>
  )
})
SelectItem.displayName = 'SelectItem'

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}