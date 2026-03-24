import * as React from 'react'

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          ${orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'}
          bg-border
          ${className}
        `}
        {...props}
      />
    )
  }
)
Separator.displayName = 'Separator'

export { Separator }