"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  Menu,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Moon,
  Sun,
  Plus,
  MessageSquare,
  Bot,
  Users,
  Code,
  Calendar,
  Clock,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { User as UserType, Workspace, Notification } from "../../types";

// Header props
export interface HeaderProps {
  user: UserType;
  workspace: Workspace;
  unreadNotifications: number;
  onMenuClick?: () => void;
  onSearch?: (query: string) => void;
  className?: string;
}

// Breadcrumb item
interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Notification dropdown
function NotificationDropdown({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="savvy"
              className="absolute top-1 right-1 min-w-[16px] h-[16px] p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-foreground">Notificaciones</h3>
          <p className="text-sm text-muted-foreground">{unreadCount} sin leer</p>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {recentNotifications.length > 0 ? (
            recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer"
              >
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full flex-shrink-0 mt-1.5",
                      notification.read ? "bg-muted" : "bg-savvy-orange"
                    )}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{notification.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString("es-ES")}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p>No hay notificaciones</p>
            </div>
          )}
        </div>
        <div className="p-2 border-t">
          <DropdownMenuItem className="text-center">
            <Link href="/notifications" className="text-sm">
              Ver todas las notificaciones
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// User dropdown
function UserDropdown({ user }: { user: UserType }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-1">
          <Avatar className="h-8 w-8">
            {user.avatar ? (
              <AvatarImage src={user.avatar} />
            ) : (
              <AvatarFallback className="text-sm font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="font-medium text-foreground">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
          <ChevronDown className="h-4 w-4 hidden md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Perfil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Ajustes</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/help" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>Ayuda</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Theme toggle
function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === "light" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

// Create dropdown
function CreateDropdown() {
  const createItems = [
    { label: "Nuevo chat", href: "/chat/new", icon: <MessageSquare className="h-4 w-4" /> },
    { label: "Nuevo agente", href: "/agents/new", icon: <Bot className="h-4 w-4" /> },
    { label: "Nuevo grupo", href: "/groups/new", icon: <Users className="h-4 w-4" /> },
    { label: "Nueva integración", href: "/integrations/new", icon: <Code className="h-4 w-4" /> },
    { label: "Nueva rutina", href: "/routines/new", icon: <Calendar className="h-4 w-4" /> },
    { label: "Nueva skill", href: "/skills/new", icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="savvy" size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">Crear</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {createItems.map((item) => (
          <DropdownMenuItem key={item.label} asChild>
            <Link href={item.href} className="flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Breadcrumb component
function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="h-3 w-3" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Get breadcrumb items based on pathname
function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const pathParts = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: "Inicio", href: "/dashboard" }];

  if (pathname.startsWith("/chat")) {
    if (pathParts.length === 1) {
      items.push({ label: "Chats" });
    } else if (pathParts.length === 2 && pathParts[1] !== "new") {
      items.push({ label: "Chats" }, { label: "Chat" });
    } else if (pathParts.length === 2 && pathParts[1] === "new") {
      items.push({ label: "Chats" }, { label: "Nuevo chat" });
    }
  } else if (pathname.startsWith("/agents")) {
    if (pathParts.length === 1) {
      items.push({ label: "Agentes" });
    } else if (pathParts[1] === "new") {
      items.push({ label: "Agentes" }, { label: "Nuevo agente" });
    } else {
      items.push({ label: "Agentes" }, { label: "Agente" });
    }
  } else if (pathname.startsWith("/groups")) {
    if (pathParts.length === 1) {
      items.push({ label: "Grupos" });
    } else if (pathParts[1] === "new") {
      items.push({ label: "Grupos" }, { label: "Nuevo grupo" });
    } else {
      items.push({ label: "Grupos" }, { label: "Grupo" });
    }
  } else if (pathname.startsWith("/integrations")) {
    items.push({ label: "Integraciones" });
  } else if (pathname.startsWith("/routines")) {
    items.push({ label: "Rutinas" });
  } else if (pathname.startsWith("/skills")) {
    items.push({ label: "Skills" });
  } else if (pathname.startsWith("/memory")) {
    items.push({ label: "Memoria" });
  } else if (pathname.startsWith("/settings")) {
    items.push({ label: "Ajustes" });
  } else if (pathname.startsWith("/billing")) {
    items.push({ label: "Facturación" });
  } else if (pathname.startsWith("/notifications")) {
    items.push({ label: "Notificaciones" });
  }

  return items;
}

// ChevronDown icon component
function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Main Header component
export function Header({
  user,
  workspace,
  unreadNotifications,
  onMenuClick,
  onSearch,
  className,
}: HeaderProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const breadcrumbItems = getBreadcrumbItems(pathname);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    if (onSearch) {
      onSearch("");
    }
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between h-16 border-b border-border bg-card px-4",
        className
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Menu button (mobile) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🌊</span>
          <span className="font-bold text-foreground hidden sm:inline">SavvyBot</span>
        </Link>

        {/* Breadcrumb */}
        <div className="hidden lg:block">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Create button */}
        <CreateDropdown />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationDropdown
          notifications={[]}
          unreadCount={unreadNotifications}
        />

        {/* User dropdown */}
        <UserDropdown user={user} />
      </div>
    </header>
  );
}

// X icon component
function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default Header;
