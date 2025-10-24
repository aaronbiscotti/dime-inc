import NavbarServer from "@/components/layout/NavbarServer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is handled by middleware, no need for additional checks here
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Render from server-derived auth to avoid client-state flicker */}
      <NavbarServer />
      {children}
    </div>
  );
}
