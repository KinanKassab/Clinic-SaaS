'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface AddPatientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  patientToEdit?: any // 👈 أضفنا هذه الخاصية الاختيارية
}

export default function AddPatientModal({ isOpen, onClose, onSuccess, patientToEdit }: AddPatientModalProps) {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    gender: 'male',
    dob: '',
    medical_history: '',
    first_visit_date: new Date().toLocaleDateString('en-CA') // استخدام التاريخ المحلي
  })

  // 👈 هذا الـ Effect يملأ البيانات عند فتح النافذة للتعديل
  useEffect(() => {
    if (isOpen) {
      if (patientToEdit) {
        setFormData({
          full_name: patientToEdit.full_name || '',
          phone: patientToEdit.phone ? patientToEdit.phone.replace('+963', '').trim() : '', // إزالة الكود الدولي للعرض إذا رغبت، أو تركه
          gender: patientToEdit.gender || 'male',
          dob: patientToEdit.dob || '',
          medical_history: patientToEdit.medical_history || '',
          first_visit_date: patientToEdit.first_visit_date || new Date().toLocaleDateString('en-CA')
        })
      } else {
        // تصفير النموذج عند الإضافة الجديدة
        setFormData({
          full_name: '',
          phone: '',
          gender: 'male',
          dob: '',
          medical_history: '',
          first_visit_date: new Date().toLocaleDateString('en-CA')
        })
      }
    }
  }, [isOpen, patientToEdit])

  // دالة تنسيق الهاتف (كما هي)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.startsWith('0')) val = val.substring(1)
    if (val && !val.startsWith('963')) val = '963' + val
    if (val.length > 12) val = val.slice(0, 12)

    let formatted = ''
    if (val.length > 0) formatted += '+' + val.slice(0, 3)
    if (val.length > 3) formatted += ' ' + val.slice(3, 6)
    if (val.length > 6) formatted += ' ' + val.slice(6, 9)
    if (val.length > 9) formatted += ' ' + val.slice(9, 12)

    setFormData({ ...formData, phone: formatted })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    try {
      if (patientToEdit) {
        // === حالة التعديل (Update) ===
        const { error } = await supabase
          .from('patients')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            gender: formData.gender,
            dob: formData.dob || null,
            medical_history: formData.medical_history,
            // لا نحدث first_visit_date عادة لأنه تاريخ الأرشفة، لكن يمكنك إضافته إذا أردت
          })
          .eq('id', patientToEdit.id)

        if (error) throw error
        toast.success('Patient updated successfully! 📝')

      } else {
        // === حالة الإضافة (Insert) ===
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user?.id).single()
        if (!profile?.clinic_id) throw new Error('Clinic ID not found')

        const { error } = await supabase.from('patients').insert([
          {
            clinic_id: profile.clinic_id,
            full_name: formData.full_name,
            phone: formData.phone,
            gender: formData.gender,
            dob: formData.dob || null,
            medical_history: formData.medical_history,
            first_visit_date: formData.first_visit_date
          }
        ])

        if (error) throw error
        toast.success('Patient added successfully! 🎉')
      }

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div 
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {patientToEdit ? 'Edit Patient' : 'Add New Patient'}
              </h2>
              <motion.button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</motion.button>
            </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text" required
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+963 9XX XXX XXX"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-left"
                style={{ direction: 'ltr' }}
                value={formData.phone}
                onChange={handlePhoneChange}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.dob}
                onChange={(e) => setFormData({...formData, dob: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">First Visit (Archive)</label>
              <input
                type="date" required
                // تعطيل الحقل عند التعديل لأنه تاريخ أرشفة
                disabled={!!patientToEdit}
                className="block w-full rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.first_visit_date}
                onChange={(e) => setFormData({...formData, first_visit_date: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
            <textarea
              rows={3}
              placeholder="Diabetes, Hypertension..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.medical_history}
              onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70">
              {loading ? 'Saving...' : (patientToEdit ? 'Update Patient' : 'Save Patient')}
            </button>
          </div>
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}