"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Bot, MessageSquare, Users, Code, Calendar, Brain, Shield, Rocket, Sparkles, ArrowRight, PlayCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: "Agentes de IA Personalizados",
      description: "Crea agentes con personalidad, habilidades y herramientas propias",
      href: "/features/agents",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Chat WhatsApp-like",
      description: "Interfaz familiar con burbujas, typing indicators y streaming",
      href: "/features/chat",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Grupos de Agentes",
      description: "Equipos de agentes que colaboran en modo todos o relevo",
      href: "/features/groups",
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "Integraciones",
      description: "Composio, MCP y APIs personalizadas con OAuth in-app",
      href: "/features/integrations",
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Rutinas Automatizadas",
      description: "Programa tareas recurrentes para tus agentes",
      href: "/features/routines",
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Memoria Persistente",
      description: "Los agentes aprenden y recuerdan de cada interacción",
      href: "/features/memory",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Multi-tenant Seguro",
      description: "Aislamiento total entre workspaces con Row-Level Security",
      href: "/features/security",
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "BYOK - Trae tu propia clave",
      description: "Cero coste para la plataforma, cada usuario trae su clave LLM",
      href: "/features/byok",
    },
  ];

  const stats = [
    { value: "0€", label: "Coste mensual" },
    { value: "100%", label: "Funcionalidad" },
    { value: "Multi-tenant", label: "Arquitectura" },
    { value: "Production-ready", label: "Calidad" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-savvy-orange" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-savvy-cream via-white to-savvy-beige py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="text-6xl md:text-8xl mb-6">🌊</div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              SavvyBot
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              El WhatsApp de los agentes de IA
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="savvy"
                size="lg"
                onClick={() => router.push("/auth/login")}
                className="text-lg px-8 py-4"
              >
                Empezar Ahora
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/auth/register")}
                className="text-lg px-8 py-4"
              >
                Regístrate Gratis
              </Button>
            </div>
            <div className="mt-8">
              <Badge variant="savvy" className="text-sm px-4 py-1">
                v1.1 - Multi-tenant completo
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Características Principales
            </h2>
            <p className="text-lg text-muted-foreground">
              Todo lo que necesitas para crear, gestionar y escalar agentes de IA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-soft-lg transition-shadow group"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-savvy-orange/10 rounded-lg group-hover:bg-savvy-orange/20 transition-colors">
                      <span className="text-savvy-orange">{feature.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-savvy-cream">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-bold text-foreground">
                  {stat.value}
                </h3>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-savvy-orange/10 via-white to-savvy-beige">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ¿Listo para probar SavvyBot?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Crea tu cuenta gratis y empieza a usar agentes de IA en minutos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="savvy"
              size="lg"
              onClick={() => router.push("/auth/register")}
              className="text-lg px-8 py-4"
            >
              Comenzar Gratis
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push("/demo")}
              className="text-lg px-8 py-4"
            >
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-foreground mb-4">SavvyBot</h3>
              <p className="text-sm text-muted-foreground">
                Plataforma multi-tenant de agentes de IA
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-foreground">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-foreground">
                    Documentación
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Desarrollo</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/github" className="hover:text-foreground">
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="hover:text-foreground">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-foreground">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground">
                    Términos
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="hover:text-foreground">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} SavvyBot. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
