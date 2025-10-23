export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth is handled by middleware, no need for additional checks here
  return <>{children}</>;
}
