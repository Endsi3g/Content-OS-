import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--text-main)] text-[var(--surface)] hover:bg-[var(--text-main)]/90",
        destructive: "bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red)]/90",
        outline: "border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)]",
        secondary: "bg-[var(--hover-bg)] text-[var(--text-main)] hover:bg-[var(--hover-bg)]/80",
        ghost: "hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)]",
        link: "text-[var(--text-main)] underline-offset-4 hover:underline",
        glow: "bg-[var(--surface)] border border-[var(--border)] shadow-[0_0_20px_rgba(var(--brand),0.3)] hover:shadow-[0_0_30px_rgba(var(--brand),0.5)] text-[var(--text-main)]"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
