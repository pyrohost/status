import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Badge } from "@/components/ui/badge";
import TimeScaleSelector from "@/components/TimeScaleSelector";
import { TimeScaleProvider } from "@/components/TimeScaleContext";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  metadataBase: new URL("https://status.pyro.host"),
  title: "Pyro Nightwatch",
  description:
    "Nightwatch is a real-time monitoring dashboard of Pyro's infrastructure.",
};

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${ibmPlexMono.className} antialiased w-full h-full bg-black text-white flex flex-col selection:bg-white selection:text-black`}
      >
        <TimeScaleProvider>
          <header className="sticky top-0 z-10 backdrop-blur-xl bg-black/50">
            <div className="flex w-full max-w-[84rem] mx-auto px-4 md:py-8">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Logo />
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
          <main className="flex-grow">{children}</main>
          <footer className="border-t border-white/10 bg-black/50 py-8">
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
