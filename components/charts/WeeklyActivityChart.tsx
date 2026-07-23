"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ActivityDataPoint {
  name: string
  practice: number
  lessons: number
  quizzes?: number
}

interface WeeklyActivityChartProps {
  data: ActivityDataPoint[]
}

export function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const hasQuizzes = data.some((d) => (d.quizzes ?? 0) > 0)

  return (
    <div className="w-full h-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barSize={8}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#64748b' }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#64748b' }}
          />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="lessons" name="Lessons" fill="#93c5fd" radius={[4, 4, 0, 0]} />
          <Bar dataKey="practice" name="Practice (min)" fill="#1e40af" radius={[4, 4, 0, 0]} />
          {hasQuizzes && (
            <Bar dataKey="quizzes" name="Quizzes" fill="#2e7d32" radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
