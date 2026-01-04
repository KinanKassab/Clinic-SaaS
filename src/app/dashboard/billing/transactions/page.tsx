'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Skeleton from '@/components/ui/Skeleton'
import { formatDate } from '@/utils/formatDate'

export default function AllTransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // 1. جلب الفواتير
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, patients(full_name)')
        .order('created_at', { ascending: false })

      // 2. جلب المصاريف
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (invoices && expenses) {
        // 3. دمج البيانات
        const combined = [
            ...invoices.map(i => ({ ...i, type: 'income', label: i.patients?.full_name, subLabel: i.service_name })),
            ...expenses.map(e => ({ ...e, type: 'expense', label: e.title, subLabel: e.category, status: 'paid' }))
        ]
        // ترتيب حسب التاريخ
        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setTransactions(combined)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Transactions</h1>
          <p className="text-gray-500">History of income and expenses.</p>
        </div>
        <Link href="/dashboard/billing" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            ← Back to Billing
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4">Type</th> {/* عمود جديد للنوع */}
                <th className="px-6 py-4">Description / Patient</th>
                <th className="px-6 py-4">Category / Service</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-8 w-full"/></td></tr>)
              ) : transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    {/* عمود الأيقونة */}
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            t.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {t.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{t.label}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{t.subLabel || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(t.created_at)}</td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-gray-900' : 'text-red-600'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}