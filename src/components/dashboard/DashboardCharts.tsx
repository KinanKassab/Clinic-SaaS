'use client'

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'
import { motion } from 'framer-motion'

interface DashboardChartsProps {
  data: { name: string; amount: number }[]
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 3 }).format(value)

  return (
    <motion.div 
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">Monthly Revenue 💰</h3>
      </div>
      
      <div className="h-75 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#9ca3af', fontSize: 12}} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#9ca3af', fontSize: 12}} 
              tickFormatter={(value) => `$${value}`} 
            />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              // 👇 التعديل هنا: سمحنا بأن تكون القيمة أي نوع (any) أو تعاملنا معها كـ number | undefined
              formatter={(value: any) => [
                formatCurrency(Number(value) || 0), 
                'Revenue'
              ]}
              itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
            />
            
            <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#10b981" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
            />            
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}