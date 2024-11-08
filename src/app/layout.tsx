import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TimeScaleSelector from "@/components/TimeScaleSelector";
import { TimeScaleProvider } from "@/components/TimeScaleContext";

const plusJakartaSans = localFont({
  src: "./fonts/PlusJakartaSans-VariableFont_wght.ttf",
  variable: "--font-plus-jakarta-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Pyro Status Dashboard",
  description: "Real-time monitoring of Pyro's infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-gray-900 text-white">
      <body
        className={`${plusJakartaSans.variable} antialiased bg-black text-white`}
      >
        <TimeScaleProvider>
          <header className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/10 bg-black/50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="h-6 w-6 text-white animate-pulse" />
                  <h1 className="text-2xl font-bold tracking-tight">
                    Pyro Status
                  </h1>
                </div>
                <div className="flex items-center space-x-3">
                  <TimeScaleSelector />
                  <Badge
                    variant="outline"
                    className="text-xs bg-black text-white"
                  >
                    Live
                  </Badge>
                </div>
              </div>
            </div>
          </header>
          {children}
          <footer className="border-t border-white/10 bg-black/50 py-4">
            <div className="container mx-auto px-4 text-center text-sm text-white/60">
              &copy; {new Date().getFullYear()} Pyro Host Inc. All rights
              reserved.
            </div>
          </footer>
        </TimeScaleProvider>
      </body>
    </html>
  );
}
