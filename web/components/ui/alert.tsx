"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { AlertCircle, CheckCircle, Info, Terminal, AlertTriangle } from "lucide-react";

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "destructive" | "info" | "success" | "warning";
  }
>(({ className, variant = "default", children, ...props }, ref) => {
  const variants = {
    default: "bg-card border-border text-foreground",
    destructive: "bg-red-50 border-red-500 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
    info: "bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
    success: "bg-green-50 border-green-500 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
    warning: "bg-orange-50 border-orange-500 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300",
  };

  const icons = {
    default: <Info className="h-4 w-4" />,
    destructive: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
  };

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative flex gap-4 rounded-lg border p-4",
        variants[variant],
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0">
        {icons[variant as keyof typeof icons]}
      </div>
      <div>{children}</div>
    </div>
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
