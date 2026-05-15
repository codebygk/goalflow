import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="GoalSeed Logo" width={48} height={48} className="mx-auto mb-4" />
          <h1 className="font-display text-4xl font-bold text-foreground tracking-tight">
            GoalSeed
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
