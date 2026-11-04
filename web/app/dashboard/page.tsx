"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus, TrendingUp, Users, Bot, Plug, Clock, Activity } from "lucide-react";
import { ActivityChart } from "../../components/dashboard/ActivityChart";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { RecentThreads } from "../../components/dashboard/RecentThreads";
import { AgentStatus } from "../../components/dashboard/AgentStatus";
import { UsageStats } from "../../components/dashboard/UsageStats";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useAuth } from "../../hooks/useAuth";

// Dashboard page
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Mock data
        setDashboardData({
          stats: {
            agents: {
              total: 3,
              active: 2,
              paused: 1,
            },
            threads: {
              total: 12,
              unread: 3,
              archived: 2,
            },
            integrations: {
              total: 4,
              connected: 3,
              byKind: {
                composio: 2,
                mcp: 1,
                api: 1,
              },
            },
            activity: {
              today: 15,
              thisWeek: 89,
              thisMonth: 456,
            },
          },
          activityData: [
            { date: "2024-01-01", turns: 12, tools: 5, tokens: 1500 },
            { date: "2024-01-02", turns: 18, tools: 8, tokens: 2200 },
            { date: "2024-01-03", turns: 25, tools: 12, tokens: 3000 },
            { date: "2024-01-04", turns: 15, tools: 6, tokens: 1800 },
            { date: "2024-01-05", turns: 30, tools: 15, tokens: 4000 },
            { date: "2024-01-06", turns: 22, tools: 10, tokens: 2800 },
            { date: "2024-01-07", turns: 18, tools: 8, tokens: 2200 },
          ],
          recentThreads: [
            {
              id: "1",
              title: "Organizar semana",
              lastMessage: "Perfecto, vamos a empezar...",
              lastMessageAt: new Date(),
              unread: true,
              agent: { id: "1", name: "Vector 🧭", emoji: "🧭", color: "#FF7A29" },
            },
            {
              id: "2",
              title: "Investigación de mercado",
              lastMessage: "Aquí tienes los datos...",
              lastMessageAt: new Date(Date.now() - 3600000),
              unread: false,
              agent: { id: "2", name: "Scout 🔎", emoji: "🔎", color: "#4A90E2" },
            },
            {
              id: "3",
              title: "Equipo Amanecer",
              lastMessage: "Reunión programada...",
              lastMessageAt: new Date(Date.now() - 86400000),
              unread: true,
              group: { id: "1", name: "Equipo Amanecer 🌅", emoji: "🌅", color: "#BD10E0" },
            },
          ],
          agents: [
            { id: "1", name: "Vector 🧭", emoji: "🧭", color: "#FF7A29", status: "active", lastActivity: "Hace 5 min" },
            { id: "2", name: "Scout 🔎", emoji: "🔎", color: "#4A90E2", status: "active", lastActivity: "Hace 1 hora" },
            { id: "3", name: "Faro 📬", emoji: "📬", color: "#7ED321", status: "paused", lastActivity: "Hace 3 horas" },
          ],
          usage: {
            turns: { used: 45, limit: 50, percentage: 90 },
            tokens: { used: 15000, limit: 20000, percentage: 75 },
            tools: { used: 8, limit: 10, percentage: 80 },
          },
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="space-y-6">
        {/* Welcome section */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            ¡Bienvenido de nuevo, {user.name}!
          </h1>
          <p className="text-muted-foreground">
            Aquí tienes un resumen de tu actividad en SavvyBot
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
              <Bot className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.agents.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                de {dashboardData?.stats.agents.total || 0} totales
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hilos Abiertos</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.threads.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.stats.threads.unread || 0} sin leer
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integraciones</CardTitle>
              <Plug className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.integrations.connected || 0}</div>
              <p className="text-xs text-muted-foreground">
                de {dashboardData?.stats.integrations.total || 0} totales
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividad Hoy</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.activity.today || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline" /> +{dashboardData?.stats.activity.today - (dashboardData?.stats.activity.yesterday || 0) || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Activity chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityChart data={dashboardData?.activityData || []} />
            </CardContent>
          </Card>

          {/* Right column - Quick actions */}
          <div className="space-y-4">
            <QuickActions />
            <UsageStats usage={dashboardData?.usage} />
          </div>
        </div>

        {/* Bottom section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent threads */}
          <RecentThreads threads={dashboardData?.recentThreads || []} />

          {/* Agent status */}
          <AgentStatus agents={dashboardData?.agents || []} />
        </div>
      </div>
    </div>
  );
}
