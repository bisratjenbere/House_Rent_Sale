import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { AppHeader } from '@/components/layout/AppHeader'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader title="Dashboard" />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
