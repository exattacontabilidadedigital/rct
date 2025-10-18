import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plataforma Reforma Tributária 2.0",
  description:
    "Hub digital para preparar empresas e contadores para a Reforma Tributária 2026.",
  metadataBase: new URL("https://plataforma-rtc.local"),
  openGraph: {
    title: "Plataforma Reforma Tributária 2.0",
    description:
      "Checklist inteligente, simulador tributário e conteúdos guiados para a transição 2026.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plataforma Reforma Tributária 2.0",
    description:
      "Solução SaaS para simplificar a adaptação das empresas à Reforma Tributária.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn(geistSans.variable, geistMono.variable, "antialiased")}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
