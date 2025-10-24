import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ProvidersServer from "./ProvidersServer";
import { AppContent } from "./AppContent";
import { DebugPanel } from "@/components/debug/DebugPanel";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dime",
  description: "Dime application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ProvidersServer>
          <AppContent>{children}</AppContent>
          <DebugPanel />
        </ProvidersServer>
      </body>
    </html>
  );
}
