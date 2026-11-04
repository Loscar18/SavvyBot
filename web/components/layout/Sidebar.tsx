"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  MessageSquare,
  Users,
  Bot,
  Settings,
  Bell,
  Archive,
  Plus,
  Search,
  ChevronLeft,
  Home,
  Calendar,
  Code,
  BookOpen,
  Clock,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { User, Workspace, Agent, Thread, Group, Notification } from "../../types";

// Sidebar props
export interface SidebarProps {
  user: User;
  workspace: Workspace;
  agents: Agent[];
  groups: Group[];
  threads: Thread[];
  unreadNotifications: number;
  currentThreadId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCreateThread?: () => void;
  onCreateAgent?: () => void;
  onCreateGroup?: () => void;
  className?: string;
}

// Navigation item
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  tooltip?: string;
}

// Agent item component
function AgentItem({
  agent,
  isActive,
  onClick,
}: {
  agent: Agent;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg transition-colors w-full text-left",
            isActive
              ? "bg-savvy-orange/20 text-foreground"
              : "hover:bg-muted/50 text-muted-foreground"
          )}
        >
          <span className="text-xl">{agent.emoji || "🤖"}</span>
          <span className="truncate flex-1">{agent.name}</span>
          {agent.status === "paused" && (
            <Badge variant="secondary" className="text-xs">
              Pausado
            </Badge>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <div>
          <p className="font-medium">{agent.name}</p>
          <p className="text-sm text-muted-foreground">{agent.role}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Group item component
function GroupItem({
  group,
  isActive,
  onClick,
}: {
  group: Group;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex items-center gap-3 p-2 rounded-lg transition-colors w-full text-left",
            isActive
              ? "bg-savvy-orange/20 text-foreground"
              : "hover:bg-muted/50 text-muted-foreground"
          )}
        >
          <span className="text-xl">{group.emoji || "🌅"}</span>
          <span className="truncate flex-1">{group.name}</span>
          <Badge variant="savvy" className="text-xs">
            {group.mode === "todos" ? "Todos" : "Relevo"}
          </Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <div>
          <p className="font-medium">{group.name}</p>
          <p className="text-sm text-muted-foreground">
            {group.members?.length || 0} miembros
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Thread item component
function ThreadItem({
  thread,
  isActive,
  onClick,
  agent,
  group,
}: {
  thread: Thread;
  isActive: boolean;
  onClick?: () => void;
  agent?: Agent;
  group?: Group;
}) {
  const isGroupThread = !!thread.groupId;
  const displayName = isGroupThread
    ? group?.name || "Grupo"
    : agent?.name || "Agente";
  const emoji = isGroupThread ? group?.emoji || "🌅" : agent?.emoji || "🤖";
  const lastMessage = thread.lastMessageAt ? (
    new Date(thread.lastMessageAt).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  ) : "-";

  return (
    <Link
      href={`/chat/${thread.id}`}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors",
        isActive
          ? "bg-savvy-orange/20 text-foreground"
          : "hover:bg-muted/50 text-muted-foreground"
      )}
    >
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground">{lastMessage}</p>
      </div>
      {thread.unreadCount > 0 && (
        <Badge variant="savvy" className="text-xs min-w-[20px] h-[20px] p-0.5">
          {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
        </Badge>
      )}
    </Link>
  );
}

// Section header
function SectionHeader({
  title,
  action,
  actionLabel,
}: {
  title: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between p-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </span>
      {action && actionLabel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={action}
          className="text-xs h-6"
        >
          <Plus className="h-3 w-3 mr-1" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// User profile section
function UserProfileSection({
  user,
  workspace,
  unreadNotifications,
}: {
  user: User;
  workspace: Workspace;
  unreadNotifications: number;
}) {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-10 w-10">
          {user.avatar ? (
            <AvatarImage src={user.avatar} />
          ) : (
            <AvatarFallback className="font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {workspace.name}
          </p>
        </div>
        <Link href="/settings" className="p-1 rounded hover:bg-muted">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
      
      {/* Quick actions */}
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/notifications"
              className="p-2 rounded hover:bg-muted relative"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadNotifications > 0 && (
                <Badge
                  variant="savvy"
                  className="absolute top-1 right-1 min-w-[16px] h-[16px] p-0 text-xs"
                >
                  {unreadNotifications}
                </Badge>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>Notificaciones</span>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/dashboard" className="p-2 rounded hover:bg-muted">
              <Home className="h-4 w-4 text-muted-foreground" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>Inicio</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// Navigation items
const mainNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Inicio",
    href: "/dashboard",
    icon: <Home className="h-4 w-4" />,
    tooltip: "Dashboard",
  },
  {
    id: "agents",
    label: "Agentes",
    href: "/agents",
    icon: <Bot className="h-4 w-4" />,
    tooltip: "Mis agentes",
  },
  {
    id: "groups",
    label: "Grupos",
    href: "/groups",
    icon: <Users className="h-4 w-4" />,
    tooltip: "Grupos de agentes",
  },
  {
    id: "integrations",
    label: "Integraciones",
    href: "/integrations",
    icon: <Code className="h-4 w-4" />,
    tooltip: "Integraciones",
  },
  {
    id: "routines",
    label: "Rutinas",
    href: "/routines",
    icon: <Calendar className="h-4 w-4" />,
    tooltip: "Rutinas automatizadas",
  },
  {
    id: "skills",
    label: "Skills",
    href: "/skills",
    icon: <BookOpen className="h-4 w-4" />,
    tooltip: "Habilidades de agentes",
  },
  {
    id: "memory",
    label: "Memoria",
    href: "/memory",
    icon: <Clock className="h-4 w-4" />,
    tooltip: "Memoria compartida",
  },
];

const bottomNavItems: NavItem[] = [
  {
    id: "billing",
    label: "Facturación",
    href: "/billing",
    icon: <CreditCard className="h-4 w-4" />,
    tooltip: "Planes y facturación",
  },
  {
    id: "help",
    label: "Ayuda",
    href: "/help",
    icon: <HelpCircle className="h-4 w-4" />,
    tooltip: "Documentación y soporte",
  },
];

// Navigation section
function NavigationSection({
  items,
  pathname,
  isCollapsed,
}: {
  items: NavItem[];
  pathname: string;
  isCollapsed?: boolean;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-savvy-orange/20 text-foreground"
                  : "hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <span>{item.icon}</span>
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {item.badge && !isCollapsed && (
                <Badge variant="savvy" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span>{item.tooltip || item.label}</span>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// Main Sidebar component
export function Sidebar({
  user,
  workspace,
  agents,
  groups,
  threads,
  unreadNotifications,
  currentThreadId,
  isCollapsed = false,
  onToggleCollapse,
  onCreateThread,
  onCreateAgent,
  onCreateGroup,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredThreads, setFilteredThreads] = useState(threads);

  // Filter threads
  useEffect(() => {
    if (!searchQuery) {
      setFilteredThreads(threads);
      return;
    }

    const filtered = threads.filter((thread) => {
      const agent = agents.find((a) => a.id === thread.agentId);
      const group = groups.find((g) => g.id === thread.groupId);
      const displayName = group?.name || agent?.name || "";
      return displayName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    setFilteredThreads(filtered);
  }, [searchQuery, threads, agents, groups]);

  // Get agent for thread
  const getAgentForThread = (thread: Thread) => {
    return agents.find((a) => a.id === thread.agentId);
  };

  // Get group for thread
  const getGroupForThread = (thread: Thread) => {
    return groups.find((g) => g.id === thread.groupId);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r border-border",
        isCollapsed ? "w-[80px]" : "w-[280px]",
        className
      )}
    >
      {/* User profile */}
      <UserProfileSection
        user={user}
        workspace={workspace}
        unreadNotifications={unreadNotifications}
      />

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* Main navigation */}
          <NavigationSection
            items={mainNavItems}
            pathname={pathname}
            isCollapsed={isCollapsed}
          />

          {/* Quick actions */}
          <div className="space-y-2">
            <SectionHeader
              title="Chats rápidos"
              action={onCreateThread}
              actionLabel="Nuevo"
            />
            
            {/* Recent threads */}
            <div className="space-y-1">
              {filteredThreads.slice(0, 5).map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={currentThreadId === thread.id}
                  agent={getAgentForThread(thread)}
                  group={getGroupForThread(thread)}
                />
              ))}
              {filteredThreads.length > 5 && (
                <Link
                  href="/threads"
                  className="text-xs text-muted-foreground hover:text-foreground p-2"
                >
                  Ver todos los chats...
                </Link>
              )}
            </div>
          </div>

          {/* Agents */}
          <div className="space-y-2">
            <SectionHeader
              title="Agentes"
              action={onCreateAgent}
              actionLabel="Nuevo"
            />
            <div className="space-y-1">
              {agents.slice(0, 5).map((agent) => (
                <AgentItem
                  key={agent.id}
                  agent={agent}
                  isActive={false}
                />
              ))}
              {agents.length > 5 && (
                <Link
                  href="/agents"
                  className="text-xs text-muted-foreground hover:text-foreground p-2"
                >
                  Ver todos los agentes...
                </Link>
              )}
            </div>
          </div>

          {/* Groups */}
          <div className="space-y-2">
            <SectionHeader
              title="Grupos"
              action={onCreateGroup}
              actionLabel="Nuevo"
            />
            <div className="space-y-1">
              {groups.slice(0, 5).map((group) => (
                <GroupItem
                  key={group.id}
                  group={group}
                  isActive={false}
                />
              ))}
              {groups.length > 5 && (
                <Link
                  href="/groups"
                  className="text-xs text-muted-foreground hover:text-foreground p-2"
                >
                  Ver todos los grupos...
                </Link>
              )}
            </div>
          </div>

          {/* Bottom navigation */}
          <NavigationSection
            items={bottomNavItems}
            pathname={pathname}
            isCollapsed={isCollapsed}
          />
        </div>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="w-full"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
