import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Dime - Login",
  description: "Dime application login portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ToastProvider>
          <AuthProvider>
            {children}
            <DebugPanel />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
