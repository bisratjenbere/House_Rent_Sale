'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  draft: 'hsl(var(--muted))',
  pending_review: 'hsl(38 48% 48%)',
  published: 'hsl(158 32% 24%)',
  rejected: 'hsl(0 62% 42%)',
  rented: 'hsl(158 28% 45%)',
  sold: 'hsl(15 45% 40%)',
  archived: 'hsl(30 6% 42%)',
}

interface ChartEntry {
  name: string
  value: number
  status: string
}

export function StatusPieChart({ data }: { data: ChartEntry[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#999'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString()} properties`, 'Count']}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
