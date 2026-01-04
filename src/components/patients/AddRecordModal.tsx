'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface AddRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onSaveAndBill?: () => void
  recordToEdit?: any
  appointmentId?: string
  patientId?: string // 👈 أعدنا إضافته هنا
}

export default function AddRecordModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onSaveAndBill, 
  recordToEdit, 
  appointmentId, 
  patientId: propPatientId // 👈 نستقبله باسم مختلف لتجنب التضارب
}: AddRecordModalProps) {
  const params = useParams()
  
  // 👈 المنطق المصحح: الأولوية للـ Prop (من صفحة المواعيد)، ثم الرابط (من صفحة المريض)، ثم السجل
  const patientId = propPatientId || (params?.id as string) || recordToEdit?.patient_id

  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    diagnosis: '',
    prescription: '', 
    notes: '',
    visit_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (isOpen) {
      if (recordToEdit) {
        setFormData({
          diagnosis: recordToEdit.diagnosis || '',
          prescription: recordToEdit.prescription || '',
          notes: recordToEdit.notes || '',
          visit_date: recordToEdit.visit_date || new Date().toISOString().split('T')[0]
        })
      } else {
        setFormData({
          diagnosis: '',
          prescription: '',
          notes: '',
          visit_date: new Date().toISOString().split('T')[0]
        })
      }
    }
  }, [isOpen, recordToEdit])

  const handleSubmit = async (e: React.FormEvent, shouldBill: boolean = false) => {
    e.preventDefault()
    
    // هذا التحقق هو الذي كان يمنع العملية
    if (!patientId) {
        toast.error("Patient ID is missing")
        return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      if (recordToEdit) {
        // === حالة التعديل ===
        const { error } = await supabase
          .from('medical_records')
          .update({
            diagnosis: formData.diagnosis,
            prescription: formData.prescription,
            notes: formData.notes,
            visit_date: formData.visit_date
          })
          .eq('id', recordToEdit.id)
        
        if (error) throw error

      } else {
        // === حالة الإضافة ===
        const { data: { user } } = await supabase.auth.getUser()
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('clinic_id')
          .eq('id', user?.id)
          .single()
        
        if (!profile?.clinic_id) throw new Error('Clinic ID not found')
        
        const { error } = await supabase.from('medical_records').insert([
          {
            clinic_id: profile.clinic_id,
            patient_id: patientId, // سيأخذ القيمة الصحيحة الآن
            diagnosis: formData.diagnosis,
            prescription: formData.prescription,
            notes: formData.notes,
            visit_date: formData.visit_date,
            appointment_id: appointmentId || null
          }
        ])

        if (error) throw error

        if (appointmentId) {
            await supabase
                .from('appointments')
                .update({ status: 'completed' })
                .eq('id', appointmentId)
        }
      }

      toast.success(recordToEdit ? 'Record updated' : 'Visit recorded successfully ✅')
      
      if (shouldBill && onSaveAndBill) {
          onSaveAndBill()
      } else {
          onSuccess()
      }
      onClose()

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to save record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div 
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="flex justify-between items-center p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">
                {recordToEdit ? 'Edit Medical Record' : 'New Medical Visit'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

        <form className="p-6 space-y-4">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
             <input
               type="date"
               required
               className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
               value={formData.visit_date}
               onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
            <input
              type="text"
              required
              placeholder="e.g. Acute Bronchitis"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prescription / Treatment</label>
            <textarea
              rows={3}
              placeholder="Medications, instructions..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              value={formData.prescription}
              onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Private Notes</label>
            <textarea
              rows={2}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            <button 
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Save Only
            </button>

            <button 
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Save & Bill 💰'}
            </button>
          </div>
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}