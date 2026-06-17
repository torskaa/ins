export default function LegalLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="min-h-screen bg-background">
 <div className="max-w-3xl mx-auto px-4 py-16">
 {children}
 </div>
 </div>
 )
}
