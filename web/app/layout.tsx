"use client";

import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils";
import { Toaster } from "../components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          "antialiased bg-background text-foreground",
          theme === "dark" && "dark"
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
