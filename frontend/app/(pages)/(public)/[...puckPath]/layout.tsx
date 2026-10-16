export default function PuckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="py-2 gap-4 w-full max-w-7xl mx-auto">{children}</main>
  );
}
