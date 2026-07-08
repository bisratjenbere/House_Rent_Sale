import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AppHeader } from '@/components/layout/AppHeader'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Admin Panel" />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
