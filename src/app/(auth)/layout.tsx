export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">
            GoalFlow
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Turn ambition into achievement
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
