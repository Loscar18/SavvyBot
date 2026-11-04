"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Plus, Calendar, Clock, Search, MoreVertical, Play, Pause, AlertCircle, CheckCircle } from "lucide-react";
import { Routine, User, Workspace } from "../../types";
import { useAuth } from "../../hooks/useAuth";

const mockRoutines: Routine[] = [
  {
    id: "routine-1",
    workspaceId: "workspace-1",
    name: "Resumen diario",
    description: "Genera un resumen de todas las tareas completadas durante el día",
    targetType: "agent",
    targetId: "agent-1",
    triggerType: "daily",
    triggerValue: "09:00",
    action: "generate_summary",
    autonomy: 2,
    enabled: true,
    lastRunAt: new Date(),
    nextRunAt: new Date(Date.now() + 86400000),
    consecutiveFailures: 0,
    quietHoursEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "routine-2",
    workspaceId: "workspace-1",
    name: "Limpieza semanal",
    description: "Archiva chats antiguos y limpia datos temporales",
    targetType: "group",
    targetId: "group-1",
    triggerType: "weekly",
    triggerValue: "0",
    action: "cleanup",
    autonomy: 2,
    enabled: true,
    lastRunAt: new Date(Date.now() - 86400000),
    nextRunAt: new Date(Date.now() + 604800000),
    consecutiveFailures: 0,
    quietHoursEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function RoutinesPage() {
  const router = useRouter();
  const { user, workspace } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setRoutines(mockRoutines);
      } catch (error) {
        console.error("Error loading routines:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getTriggerLabel = (routine: Routine) => {
    switch (routine.triggerType) {
      case "daily":
        return `Diario a las ${routine.triggerValue}`;
      case "weekly":
        const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        return `Semanal los ${days[parseInt(routine.triggerValue)] || "Domingo"}`;
      case "hourly":
        return `Cada hora`;
      case "manual":
        return "Manual";
      case "cron":
        return `Cron: ${routine.triggerValue}`;
      default:
        return "Desconocido";
    }
  };

  const getStatusBadge = (routine: Routine) => {
    if (!routine.enabled) {
      return <Badge variant="secondary" className="text-xs">Desactivado</Badge>;
    }
    if (routine.consecutiveFailures >= 2) {
      return <Badge variant="destructive" className="text-xs">Error</Badge>;
    }
    return <Badge variant="default" className="text-xs">Activo</Badge>;
  };

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rutinas</h1>
            <p className="text-muted-foreground">
              Automatiza tareas repetitivas
            </p>
          </div>
          <Button variant="savvy" onClick={() => router.push("/routines/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Rutina
          </Button>
        </div>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{routines.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {routines.filter((r) => r.enabled).length}
                </p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {routines.filter((r) => !r.enabled).length}
                </p>
                <p className="text-xs text-muted-foreground">Desactivadas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {routines.filter((r) => r.consecutiveFailures >= 2).length}
                </p>
                <p className="text-xs text-muted-foreground">Con errores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Routines list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-savvy-orange" />
          </div>
        ) : routines.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No hay rutinas</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera rutina para automatizar tareas
              </p>
              <Button variant="savvy" onClick={() => router.push("/routines/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Rutina
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {routines.map((routine) => (
              <Card
                key={routine.id}
                className="hover:shadow-soft-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{routine.name}</CardTitle>
                        <CardDescription>
                          {routine.description || "Sin descripción"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(routine)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {routine.targetType === "agent" ? "Agente" : "Grupo"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Nivel {routine.autonomy}
                      </Badge>
                      <Badge variant={routine.enabled ? "default" : "secondary"} className="text-xs">
                        {routine.enabled ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Trigger:</strong> {getTriggerLabel(routine)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Última ejecución:</strong> {
                        routine.lastRunAt
                          ? new Date(routine.lastRunAt).toLocaleString("es-ES")
                          : "Nunca"
                      }
                    </p>
                    {routine.nextRunAt && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Próxima ejecución:</strong> {
                          new Date(routine.nextRunAt).toLocaleString("es-ES")
                        }
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
