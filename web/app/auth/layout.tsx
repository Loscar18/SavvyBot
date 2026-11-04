"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-savvy-cream via-white to-savvy-cream">
      {/* Back button */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/")}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <div className="p-4 text-center text-sm text-muted-foreground">
        <p>
          SavvyBot - Plataforma multi-tenant de agentes de IA
        </p>
      </div>
    </div>
  );
}
