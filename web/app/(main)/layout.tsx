"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import { Sidebar } from "../../components/layout/Sidebar";
import { Header } from "../../components/layout/Header";
import { MobileSidebar } from "../../components/layout/MobileSidebar";

// Main layout component
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if we should hide sidebar for certain routes
  const hideSidebar = ["/auth", "/login", "/register"].some((route) =>
    pathname?.startsWith(route)
  );

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar for desktop */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden lg:flex"
      />

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
        className="lg:hidden"
      />

      {/* Main content */}
      <div
        className={cn(
          "main-content flex flex-col",
          sidebarCollapsed && "lg:ml-[80px]"
        )}
      >
        {/* Header */}
        <Header
          onMenuClick={() => setMobileSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
