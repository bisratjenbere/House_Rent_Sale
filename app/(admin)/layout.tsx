import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AppHeader } from '@/components/layout/AppHeader'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

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
  );
}
