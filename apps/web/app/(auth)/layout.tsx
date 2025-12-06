export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grain min-h-svh flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-accent/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary/3 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
