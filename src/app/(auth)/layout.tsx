export default function AuthLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-surface to-background p-4">
 <div className="w-full max-w-md">
 <div className="text-center mb-8">
 <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark shadow-lg mb-4">
 <span className="text-white font-bold text-lg">I</span>
 </div>
 <h1 className="text-2xl font-bold tracking-tight">Ins</h1>
 <p className="text-sm text-muted-foreground mt-1">Inventory Management System</p>
 </div>
 {children}
 </div>
 </div>
 )
}
