export const dynamic = "force-dynamic"

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="min-h-screen bg-surface/30 flex flex-col items-center justify-center p-4">
 <div className="w-full max-w-xl">
 {children}
 </div>
 </div>
 )
}
