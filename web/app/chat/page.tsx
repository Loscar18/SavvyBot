"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../lib/utils";
import ThreadList from "../../components/chat/ThreadList";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { Button } from "../../components/ui/button";
import { Thread, Agent, Group, User, Workspace } from "../../types";
import { useAuth } from "../../hooks/useAuth";

// Mock data for development
export default function ChatListPage() {
  const router = useRouter();
  const { user, workspace } = useAuth();

  // State
  const [threads, setThreads] = useState<Thread[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Mock user and workspace for development
  const mockUser: User = user || {
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

  const mockWorkspace: Workspace = workspace || {
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

  // Mock agents
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

  // Mock groups
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

  // Mock threads
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

  // Load data
  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load threads
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // In production, fetch from API
        // For now, use mock data
        setThreads(mockThreads);
        setAgents(mockAgents);
        setGroups(mockGroups);

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Create new thread
  const handleCreateThread = useCallback(() => {
    const newThread: Thread = {
      id: `thread-${Date.now()}`,
      workspaceId: mockWorkspace.id,
      title: "Nuevo chat",
      agentId: mockAgents[0].id,
      archived: false,
      pinned: false,
      unreadCount: 0,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setThreads((prev) => [newThread, ...prev]);
    router.push(`/chat/${newThread.id}`);
  }, [mockWorkspace.id, mockAgents, router]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  // Close sidebar
  const closeSidebar = useCallback(() => {
    setShowSidebar(false);
  }, []);

  // Navigate to thread
  const navigateToThread = useCallback((threadId: string) => {
    router.push(`/chat/${threadId}`);
    if (isMobile) {
      closeSidebar();
    }
  }, [router, isMobile, closeSidebar]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-savvy-orange" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Sidebar
          user={mockUser}
          workspace={mockWorkspace}
          agents={mockAgents}
          groups={mockGroups}
          threads={threads}
          unreadNotifications={0}
          onCreateThread={handleCreateThread}
          onCreateAgent={() => router.push("/agents/new")}
          onCreateGroup={() => router.push("/groups/new")}
        />
      )}

      {/* Sidebar - Mobile */}
      {isMobile && showSidebar && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={closeSidebar}
        >
          <div
            className="fixed left-0 top-0 h-full w-[280px] bg-card border-r border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              user={mockUser}
              workspace={mockWorkspace}
              agents={mockAgents}
              groups={mockGroups}
              threads={threads}
              unreadNotifications={0}
              onCreateThread={handleCreateThread}
              onCreateAgent={() => router.push("/agents/new")}
              onCreateGroup={() => router.push("/groups/new")}
              onToggleCollapse={closeSidebar}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header
          user={mockUser}
          workspace={mockWorkspace}
          unreadNotifications={0}
          onMenuClick={isMobile ? toggleSidebar : undefined}
        />

        {/* Chat list */}
        <div className="flex-1 flex overflow-hidden">
          {!isMobile && (
            <ThreadList
              threads={threads.map((t) => ({
                ...t,
                agent: agents.find((a) => a.id === t.agentId),
                group: groups.find((g) => g.id === t.groupId),
                messages: [],
              }))}
              currentWorkspaceId={mockWorkspace.id}
              onCreateThread={handleCreateThread}
            />
          )}

          <main className="flex-1 flex flex-col h-full">
            {/* Empty state */}
            {threads.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-4">No hay chats</h2>
                  <p className="text-muted-foreground mb-6">
                    Crea un nuevo chat para empezar a conversar con tus agentes
                  </p>
                  <Button variant="savvy" size="lg" onClick={handleCreateThread}>
                    <span className="text-xl mr-2">💬</span>
                    Nuevo chat
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Chats</h2>
                      <p className="text-sm text-muted-foreground">
                        {threads.length} conversaciones activas
                      </p>
                    </div>
                    <Button variant="savvy" onClick={handleCreateThread}>
                      <span className="mr-2">+</span>
                      Nuevo chat
                    </Button>
                  </div>
                </div>

                {/* Thread list - Mobile */}
                {isMobile && (
                  <div className="flex-1 overflow-y-auto">
                    <ThreadList
                      threads={threads.map((t) => ({
                        ...t,
                        agent: agents.find((a) => a.id === t.agentId),
                        group: groups.find((g) => g.id === t.groupId),
                        messages: [],
                      }))}
                      currentWorkspaceId={mockWorkspace.id}
                      onCreateThread={handleCreateThread}
                    />
                  </div>
                )}

                {/* Empty state for desktop */}
                {!isMobile && (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">
                        Selecciona un chat o crea uno nuevo
                      </h3>
                      <p className="text-muted-foreground">
                        Haz clic en un chat de la izquierda para empezar
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
