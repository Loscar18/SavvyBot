"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Bot, Users, Plug, Calendar, BookOpen } from "lucide-react";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Nuevo Agente",
      icon: <Bot className="h-4 w-4" />,
      onClick: () => router.push("/agents/new"),
    },
    {
      label: "Nuevo Grupo",
      icon: <Users className="h-4 w-4" />,
      onClick: () => router.push("/groups/new"),
    },
    {
      label: "Nueva Integración",
      icon: <Plug className="h-4 w-4" />,
      onClick: () => router.push("/integrations/new"),
    },
    {
      label: "Nueva Rutina",
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => router.push("/routines/new"),
    },
    {
      label: "Nueva Skill",
      icon: <BookOpen className="h-4 w-4" />,
      onClick: () => router.push("/skills/new"),
    },
    {
      label: "Nuevo Chat",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => router.push("/chat/new"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="h-8 text-xs gap-2 hover:bg-savvy-orange/10 hover:text-savvy-orange"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActions;
