import { Card, CardContent } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function AdminReportsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-2">
              Reports
            </h2>
            <p className="text-muted-foreground">
              Advanced reporting features coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
