"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { User, Workspace, Agent, Group, Thread } from "../../types";
import { useAuth } from "../../hooks/useAuth";

// Mock data for development
const mockUser: User = {
  id: "user-1",
  email: "demo@savvybot.ai",
  name: "Usuario Demo",
  workspaceId: "workspace-1",
  role: "owner",
  emailVerified: true,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWorkspace: Workspace = {
  id: "workspace-1",
  name: "Mi Espacio de Trabajo",
  slug: "demo-workspace",
  plan: "pro",
  timezone: "Europe/Madrid",
  theme: "light",
  language: "es",
  billingEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAgents: Agent[] = [
  {
    id: "agent-1",
    workspaceId: "workspace-1",
    name: "Vector 🧭",
    emoji: "🧭",
    color: "#FF7A29",
    role: "Asistente de estudios",
    personality: "Analítico y detallado",
    instructions: "Ayuda con preguntas de estudio y análisis de información.",
    autonomy: 2,
    modelBaseUrl: "https://api.grok.com",
    modelName: "grok",
    modelKeyCiphertext: "",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "agent-2",
    workspaceId: "workspace-1",
    name: "Scout 🔎",
    emoji: "🔎",
    color: "#4A90E2",
    role: "Investigador web",
    personality: "Curioso y persistente",
    instructions: "Busca y resume información de internet.",
    autonomy: 2,
    modelBaseUrl: "https://api.grok.com",
    modelName: "grok",
    modelKeyCiphertext: "",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "agent-3",
    workspaceId: "workspace-1",
    name: "Faro 📬",
    emoji: "📬",
    color: "#50C878",
    role: "Organizador de correo",
    personality: "Organizado y eficiente",
    instructions: "Clasifica y organiza correos electrónicos.",
    autonomy: 2,
    modelBaseUrl: "https://api.grok.com",
    modelName: "grok",
    modelKeyCiphertext: "",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockGroups: Group[] = [
  {
    id: "group-1",
    workspaceId: "workspace-1",
    name: "Equipo Amanecer 🌅",
    emoji: "🌅",
    color: "#FF7A29",
    mode: "relevo",
    coordinatorId: "agent-1",
    description: "Equipo de agentes para tareas diarias",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockThreads: Thread[] = [
  {
    id: "thread-1",
    workspaceId: "workspace-1",
    title: "Pregunta sobre matemáticas",
    agentId: "agent-1",
    archived: false,
    pinned: false,
    unreadCount: 0,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "thread-2",
    workspaceId: "workspace-1",
    title: "Investigación de mercado",
    agentId: "agent-2",
    archived: false,
    pinned: false,
    unreadCount: 1,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "thread-3",
    workspaceId: "workspace-1",
    title: "Chat de grupo",
    groupId: "group-1",
    archived: false,
    pinned: false,
    unreadCount: 2,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Main layout component
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, workspace } = useAuth();
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

  // Use mock data if no user/workspace
  const currentUser = user || mockUser;
  const currentWorkspace = workspace || mockWorkspace;

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar for desktop */}
      <div className={cn("hidden lg:flex", sidebarCollapsed ? "w-[80px]" : "w-[280px]")}>
        <Sidebar
          user={currentUser}
          workspace={currentWorkspace}
          agents={mockAgents}
          groups={mockGroups}
          threads={mockThreads}
          unreadNotifications={0}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCreateThread={() => {}}
          onCreateAgent={() => {}}
          onCreateGroup={() => {}}
        />
      </div>

      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed left-0 top-0 h-full w-[280px] bg-card border-r border-border z-50 lg:hidden">
          <Sidebar
            user={currentUser}
            workspace={currentWorkspace}
            agents={mockAgents}
            groups={mockGroups}
            threads={mockThreads}
            unreadNotifications={0}
            isCollapsed={false}
            onToggleCollapse={() => setMobileSidebarOpen(false)}
            onCreateThread={() => {}}
            onCreateAgent={() => {}}
            onCreateGroup={() => {}}
          />
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col h-full overflow-hidden",
          sidebarCollapsed ? "lg:ml-[80px]" : "lg:ml-[280px]"
        )}
      >
        {/* Header */}
        <Header
          user={currentUser}
          workspace={currentWorkspace}
          unreadNotifications={0}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
