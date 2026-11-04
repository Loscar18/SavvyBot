"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "../../../lib/utils";
import ChatWindow from "../../../components/chat/ChatWindow";
import ThreadList from "../../../components/chat/ThreadList";
import Sidebar from "../../../components/layout/Sidebar";
import Header from "../../../components/layout/Header";
import { Button } from "../../../components/ui/button";
import { Thread, Message, Agent, Group, User, Workspace } from "../../../types";
import { useAuth } from "../../../hooks/useAuth";

// Mock data for development
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, workspace } = useAuth();
  const threadId = params.threadId as string;

  // State
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agent, setAgent] = useState<Agent | undefined>(undefined);
  const [group, setGroup] = useState<Group | undefined>(undefined);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
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

  // Mock messages
  const mockMessages: Message[] = [
    {
      id: "msg-1",
      threadId: "thread-1",
      authorType: "user",
      authorId: "user-1",
      content: "Hola, ¿puedes ayudarme con este problema de matemáticas?",
      isStreaming: false,
      streamCompleted: true,
      createdAt: new Date(Date.now() - 60000),
      updatedAt: new Date(Date.now() - 60000),
    },
    {
      id: "msg-2",
      threadId: "thread-1",
      authorType: "agent",
      agentId: "agent-1",
      content: "¡Claro! Estoy aquí para ayudarte. ¿De qué tema se trata el problema?",
      modelUsed: "grok",
      isStreaming: false,
      streamCompleted: true,
      createdAt: new Date(Date.now() - 30000),
      updatedAt: new Date(Date.now() - 30000),
    },
    {
      id: "msg-3",
      threadId: "thread-1",
      authorType: "user",
      authorId: "user-1",
      content: "Es sobre ecuaciones diferenciales. ¿Cómo resuelvo dy/dx = 2x?",
      isStreaming: false,
      streamCompleted: true,
      createdAt: new Date(Date.now() - 15000),
      updatedAt: new Date(Date.now() - 15000),
    },
    {
      id: "msg-4",
      threadId: "thread-1",
      authorType: "agent",
      agentId: "agent-1",
      content: "Para resolver dy/dx = 2x, integramos ambos lados: ∫dy = ∫2x dx, lo que nos da y = x² + C, donde C es la constante de integración.",
      modelUsed: "grok",
      isStreaming: false,
      streamCompleted: true,
      createdAt: new Date(Date.now() - 5000),
      updatedAt: new Date(Date.now() - 5000),
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

  // Load thread and messages
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // In production, fetch from API
        // For now, use mock data
        const currentThread = mockThreads.find((t) => t.id === threadId) || mockThreads[0];
        const threadMessages = mockMessages.filter((m) => m.threadId === threadId);
        const threadAgent = mockAgents.find((a) => a.id === currentThread.agentId);
        const threadGroup = mockGroups.find((g) => g.id === currentThread.groupId);

        setThread(currentThread);
        setMessages(threadMessages);
        setAgent(threadAgent);
        setGroup(threadGroup);
        setThreads(mockThreads);

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [threadId]);

  // Send message
  const handleSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      try {
        setIsStreaming(true);

        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          threadId,
          authorType: "user",
          authorId: mockUser.id,
          content,
          isStreaming: false,
          streamCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);

        // Simulate agent response
        setTimeout(() => {
          const agentResponse: Message = {
            id: `msg-${Date.now() + 1}`,
            threadId,
            authorType: "agent",
            agentId: agent?.id,
            content: `He recibido tu mensaje: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}". Estoy procesándolo.`,
            modelUsed: agent?.modelName || "grok",
            isStreaming: false,
            streamCompleted: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          setMessages((prev) => [...prev, agentResponse]);
          setIsStreaming(false);

          // Update thread last message time
          setThreads((prev) =>
            prev.map((t) =>
              t.id === threadId ? { ...t, lastMessageAt: new Date() } : t
            )
          );
        }, 1000);
      } catch (error) {
        console.error("Error sending message:", error);
        setIsStreaming(false);
      }
    },
    [threadId, agent, mockUser.id]
  );

  // Handle approval
  const handleApproval = useCallback(
    async (approvalId: string, decision: "approved" | "rejected", reason?: string) => {
      try {
        // In production, send to API
        console.log("Approval decision:", { approvalId, decision, reason });
      } catch (error) {
        console.error("Error handling approval:", error);
      }
    },
    []
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-savvy-orange" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Hilo no encontrado</h2>
          <Button variant="savvy" onClick={() => router.push("/dashboard")}>
            Volver al inicio
          </Button>
        </div>
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
          currentThreadId={threadId}
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
              currentThreadId={threadId}
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
        {/* Header - Mobile only */}
        {isMobile && (
          <Header
            user={mockUser}
            workspace={mockWorkspace}
            unreadNotifications={0}
            onMenuClick={toggleSidebar}
          />
        )}

        {/* Chat window */}
        <div className="flex-1 flex overflow-hidden">
          {!isMobile && (
            <ThreadList
              threads={threads}
              currentWorkspaceId={mockWorkspace.id}
              onCreateThread={handleCreateThread}
            />
          )}

          <main className="flex-1 flex flex-col h-full">
            <ChatWindow
              thread={thread}
              messages={messages}
              agent={agent}
              group={group}
              currentUserId={mockUser.id}
              currentUserName={mockUser.name}
              currentUserAvatar={mockUser.avatar}
              isLoading={isLoading}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onApproval={handleApproval}
              onClose={isMobile ? closeSidebar : undefined}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
