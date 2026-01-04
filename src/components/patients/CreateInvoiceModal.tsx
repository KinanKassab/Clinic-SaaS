'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner' // 👈 استخدام Sonner للتنبيهات
import { Check, DollarSign, X } from 'lucide-react'

interface CreateInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  patientId: string // 👈 أصبح مطلوباً كـ Prop لضمان العمل في كل الصفحات
}

export default function CreateInvoiceModal({ isOpen, onClose, onSuccess, patientId }: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    service_name: '',
    amount: '',
    status: 'paid'
  })

  // تصفير البيانات عند الفتح
  useEffect(() => {
    if (isOpen) {
        setFormData({ service_name: '', amount: '', status: 'paid' })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single()

      if (!profile?.clinic_id) throw new Error('Clinic ID error')

      const { error } = await supabase.from('invoices').insert([
        {
          clinic_id: profile.clinic_id,
          patient_id: patientId, // استخدام الـ ID الممرر
          service_name: formData.service_name,
          amount: parseFloat(formData.amount),
          status: formData.status
        }
      ])

      if (error) throw error
      
      toast.success('Invoice created successfully! 💰')
      onSuccess()
      onClose()

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-full text-green-600">
                    <DollarSign size={18} />
                </div>
                New Payment
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service / Reason</label>
                <input
                  type="text" required placeholder="e.g. Consultation"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount ($)</label>
                <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                    type="number" required placeholder="0.00"
                    className="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 outline-none focus:ring-2 focus:ring-green-500 transition-all font-bold text-gray-800"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'paid' })}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all flex justify-center items-center gap-2 ${
                            formData.status === 'paid' ? 'bg-green-50 border-green-200 text-green-700 ring-2 ring-green-500 ring-offset-1' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <Check size={14} /> Paid
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'pending' })}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all flex justify-center items-center gap-2 ${
                            formData.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700 ring-2 ring-amber-500 ring-offset-1' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        Pending
                    </button>
                </div>
              </div>

              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-black shadow-lg shadow-gray-200 transition-all mt-2"
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}