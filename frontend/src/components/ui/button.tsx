import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none transform-gpu active:translate-y-1 relative cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground rounded-xl border-2 border-primary hover:bg-yellow-400 border-b-4 border-b-secondary hover:border-b-yellow-400 active:border-b-0 active:border-2 active:border-primary",
        destructive:
          "bg-destructive text-destructive-foreground rounded-xl border-2 border-destructive hover:bg-red-500 border-b-4 border-b-red-700 hover:border-b-red-800 active:border-b-0 active:border-2 active:border-destructive",
        outline:
          "border-2 border-border bg-background hover:bg-gray-50 rounded-xl border-b-4 border-b-gray-300 hover:border-b-gray-400 active:border-b-0 active:border-2 active:border-border",
        secondary:
          "bg-white text-gray-900 rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 border-b-4 border-b-gray-300 hover:border-b-gray-400 active:border-b-0 active:border-2 active:border-gray-300",
        ghost:
          "rounded-xl border-2 border-transparent hover:bg-yellow-50 hover:text-yellow-800 border-b-4 border-b-transparent hover:border-b-secondary active:border-b-0 active:border-2 active:border-transparent",
        link: "text-primary underline-offset-4 hover:underline hover:text-yellow-600",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
