import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { cn } from "../lib/utils";
import "./globals.css";
import { Toaster } from "../components/ui/toaster";

// Fonts
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

// Metadata
export const metadata: Metadata = {
  title: {
    default: "SavvyBot - Agentes de IA para tu equipo",
    template: "%s | SavvyBot",
  },
  description: "Plataforma comercial multi-tenant de agentes de IA. Crea, personaliza y agrupa agentes como si fuera WhatsApp.",
  keywords: [
    "IA",
    "Agentes",
    "Chatbot",
    "Automatización",
    "Productividad",
    "Multi-tenant",
    "WhatsApp",
    "SavvyBot",
  ],
  authors: [{ name: "SavvyBot Team" }],
  creator: "SavvyBot",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://savvybot.app",
    siteName: "SavvyBot",
    title: "SavvyBot - Agentes de IA para tu equipo",
    description: "Plataforma comercial multi-tenant de agentes de IA.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SavvyBot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SavvyBot - Agentes de IA para tu equipo",
    description: "Plataforma comercial multi-tenant de agentes de IA.",
    images: ["/og-image.png"],
    creator: "@SavvyBotApp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-16x16.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6F0" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Root layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetBrainsMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            {children}
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
