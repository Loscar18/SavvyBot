"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full max-w-[90vw] items-center justify-between space-x-4 overflow-hidden rounded-lg border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=start]:translate-x-[var(--radix-toast-swipe-start-x)] data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-full data-[state=closed]:sm:slide-out-to-right-full data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-full data-[swipe=end]:slide-out-to-right-full data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
  {
    variants: {
      variant: {
        default: "bg-background border",
        success: "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800",
        warning: "bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-800",
        error: "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
        info: "bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  className?: string;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
);
Toast.displayName = "Toast";

const ToastViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:p-6",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

const ToastTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mb-1 font-semibold text-sm", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <div className="flex items-center gap-2">
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));
ToastAction.displayName = "ToastAction";

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 dark:group-[.destructive]:text-red-500 dark:group-[.destructive]:hover:text-red-50",
      className
    )}
    aria-label="Close"
    {...props}
  >
    <span className="sr-only">Close</span>
  </button>
));
ToastClose.displayName = "ToastClose";

export {
  Toast,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  toastVariants,
};
