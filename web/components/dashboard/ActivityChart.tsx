"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "../ui/card";

interface ActivityData {
  date: string;
  turns: number;
  tools: number;
  tokens: number;
}

interface ActivityChartProps {
  data: ActivityData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  // Format data for the chart
  const chartData = data.map((item) => ({
    name: new Date(item.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
    Turnos: item.turns,
    Herramientas: item.tools,
    Tokens: item.tokens,
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            stroke="#6B7280" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toString()}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "14px",
            }}
            formatter={(value: number, name: string) => [value, name]}
            labelStyle={{ color: "#111827" }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: "20px",
            }}
          />
          <Bar dataKey="Turnos" fill="#FF7A29" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Herramientas" fill="#4A90E2" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Tokens" fill="#7ED321" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ActivityChart;
