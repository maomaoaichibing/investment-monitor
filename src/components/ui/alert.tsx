import * as React from 'react'
import { AlertTriangle, Info } from 'lucide-react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive'
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={`relative w-full rounded-lg border p-4 ${variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-900' : 'border-border bg-background'} ${className}`}
        {...props}
      >
        <div className="flex items-start">
          {variant === 'destructive' ? (
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-3" />
          ) : (
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 mr-3" />
          )}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    )
  }
)
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h5
      ref={ref}
      className={`font-medium leading-none mb-1 ${className}`}
      {...props}
    >
      {children}
    </h5>
  )
})
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }