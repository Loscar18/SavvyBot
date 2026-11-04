"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";

interface UsageStatsProps {
  usage?: {
    turns?: { used: number; limit: number; percentage: number };
    tokens?: { used: number; limit: number; percentage: number };
    tools?: { used: number; limit: number; percentage: number };
  };
}

export function UsageStats({ usage }: UsageStatsProps) {
  const defaultUsage = {
    turns: { used: 0, limit: 50, percentage: 0 },
    tokens: { used: 0, limit: 20000, percentage: 0 },
    tools: { used: 0, limit: 10, percentage: 0 },
  };

  const stats = usage || defaultUsage;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Uso del Mes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Turnos</span>
            <span className="font-medium">
              {stats.turns?.used || 0} / {stats.turns?.limit || 50}
            </span>
          </div>
          <Progress 
            value={stats.turns?.percentage || 0} 
            className="h-2"
            indicatorClassName="bg-savvy-orange"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Tokens</span>
            <span className="font-medium">
              {stats.tokens?.used || 0} / {stats.tokens?.limit || 20000}
            </span>
          </div>
          <Progress 
            value={stats.tokens?.percentage || 0} 
            className="h-2"
            indicatorClassName="bg-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Herramientas</span>
            <span className="font-medium">
              {stats.tools?.used || 0} / {stats.tools?.limit || 10}
            </span>
          </div>
          <Progress 
            value={stats.tools?.percentage || 0} 
            className="h-2"
            indicatorClassName="bg-green-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default UsageStats;
