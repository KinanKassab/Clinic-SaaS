'use client'

import { useEffect, useState, useCallback } from 'react' // 👈 ضفنا useCallback
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import BillingChart from '@/components/billing/BillingChart'
import Skeleton from '@/components/ui/Skeleton'
import Link from 'next/link'
import AddExpenseModal from '@/components/billing/AddExpenseModal' // 👈 استيراد المودال
import { formatDate } from '@/utils/formatDate'

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false) // 👈 حالة المودال

  const [stats, setStats] = useState({ 
    totalRevenue: 0,   
    pendingAmount: 0,  
    totalExpenses: 0,  
    netProfit: 0       
  })

  const [invoicesOnly, setInvoicesOnly] = useState<any[]>([]) 
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]) 
  const [focusTransaction, setFocusTransaction] = useState<number | null>(null)

  // 👈 نقلنا الدالة للخارج واستخدمنا useCallback لتجنب التكرار
  const fetchData = useCallback(async () => {
      const supabase = createClient()
      // لا نضع setLoading(true) هنا لكي لا تومض الشاشة عند التحديث، فقط أول مرة
      
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*, patients(full_name)')
        .order('created_at', { ascending: false })

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false })

      if (invoices && expenses) {
        setInvoicesOnly(invoices)

        const totalPaid = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0)
        const pending = invoices.filter(i => i.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0)
        const totalExp = expenses.reduce((acc, curr) => acc + curr.amount, 0)

        setStats({ 
            totalRevenue: totalPaid, 
            pendingAmount: pending, 
            totalExpenses: totalExp,
            netProfit: totalPaid - totalExp 
        })

        const combined = [
            ...invoices.map(i => ({ ...i, type: 'income', label: i.patients?.full_name, subLabel: i.service_name })),
            ...expenses.map(e => ({ ...e, type: 'expense', label: e.title, subLabel: e.category, status: 'paid' }))
        ]

        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setRecentTransactions(combined.slice(0, 6))
      }
      setLoading(false)
  }, [])

  // استدعاء البيانات أول مرة
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  
  const handleTransactionClick = (dateString: string) => {
    const timestamp = new Date(dateString).getTime();
    setFocusTransaction(timestamp);
  }

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

  return (
    <div className="space-y-8 relative">
      {/* 👈 المودال هنا */}
      <AddExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        onSuccess={() => {
            fetchData() // تحديث البيانات عند نجاح الإضافة
        }} 
      />

      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing & Finance</h1>
            <p className="text-gray-500">Overview of clinic income and expenses.</p>
        </div>
        {/* 👈 تفعيل الزر */}
        <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold border border-red-100 hover:bg-red-100 transition-colors flex items-center gap-2"
        >
            <span>−</span> Add Expense
        </button>
      </div>

      {/* Cards Section */}
      <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="visible">
         <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl shadow-sm border border-emerald-100">
            <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Total Income</p>
            {loading ? <Skeleton className="h-8 w-24" /> : <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</h3>}
         </motion.div>

         <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl shadow-sm border border-red-100">
            <p className="text-xs font-bold text-red-600 uppercase mb-1">Total Expenses</p>
            {loading ? <Skeleton className="h-8 w-24" /> : <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</h3>}
         </motion.div>

         <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl shadow-sm border border-blue-100">
            <p className="text-xs font-bold text-blue-600 uppercase mb-1">Net Profit</p>
            {loading ? <Skeleton className="h-8 w-24" /> : <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.netProfit)}</h3>}
         </motion.div>

         <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl shadow-sm border border-amber-100">
            <p className="text-xs font-bold text-amber-600 uppercase mb-1">Pending Invoices</p>
            {loading ? <Skeleton className="h-8 w-24" /> : <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingAmount)}</h3>}
         </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <BillingChart invoices={invoicesOnly} loading={loading} focusDate={focusTransaction} />
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full"
        >
          <div className="mb-4">
             <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
             <p className="text-xs text-gray-400">Includes both patient payments and clinic expenses.</p>
          </div>
          
          <div className="space-y-4 flex-1">
            {recentTransactions.length > 0 ? (
                recentTransactions.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => handleTransactionClick(item.created_at)}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-all border-b border-gray-50 last:border-0 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                item.type === 'income' 
                                    ? (item.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')
                                    : 'bg-red-100 text-red-600'
                            }`}>
                                {item.type === 'income' 
                                    ? (item.status === 'paid' ? '↓' : '⏳') 
                                    : '↑' 
                                }
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                                <p className="text-xs text-gray-500">{item.subLabel}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-bold ${item.type === 'income' ? 'text-gray-900' : 'text-red-600'}`}>
                                {item.type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
                            </p>
                            <p className="text-[10px] text-gray-400">{formatDate(item.created_at)}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-gray-400 text-center py-10">No transactions yet.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link 
                href="/dashboard/billing/transactions" 
                className="flex items-center justify-center w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200"
            >
                View Full History
            </Link>
          </div>

        </motion.div>
      </div>
    </div>
  )
}