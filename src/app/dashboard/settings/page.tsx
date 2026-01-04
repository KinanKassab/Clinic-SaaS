'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [clinicData, setClinicData] = useState({
    id: '',
    name: '',
    address: '',
    phone: '',
    doctor_name: '' 
  })

  // 👇 نفس دالة التنسيق
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

    setClinicData({ ...clinicData, phone: formatted })
  }

  useEffect(() => {
    loadClinicData()
  }, [])

  const loadClinicData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single()
      if (profile?.clinic_id) {
        const { data: clinic } = await supabase.from('clinics').select('*').eq('id', profile.clinic_id).single()
        if (clinic) {
          setClinicData({
            id: clinic.id,
            name: clinic.name || '',
            address: clinic.address || '',
            phone: clinic.phone || '', // تأكد أن قاعدة البيانات تقبل String
            doctor_name: clinic.doctor_name || ('Dr. ' + (user.email?.split('@')[0] || ''))
          })
        }
      }
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: clinicData.name,
          address: clinicData.address,
          phone: clinicData.phone,
          doctor_name: clinicData.doctor_name
        })
        .eq('id', clinicData.id)

      if (error) throw error
      alert('Settings saved successfully! ✅')
      window.location.reload()
      
    } catch (err: any) {
      alert('Error updating settings: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-10 text-center">Loading settings...</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinic Settings</h1>
      <p className="text-gray-500 mb-8">Manage your clinic details appearing on prescriptions and reports.</p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSave} className="p-8 space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Name</label>
            <input
              type="text" required
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={clinicData.name}
              onChange={(e) => setClinicData({...clinicData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Input with Formatting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="text"
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                style={{ direction: 'ltr' }}
                placeholder="+963 9XX XXX XXX"
                value={clinicData.phone}
                onChange={handlePhoneChange} // 👈
              />
            </div>
             
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name</label>
              <input
                type="text"
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                value={clinicData.doctor_name}
                onChange={(e) => setClinicData({...clinicData, doctor_name: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address / Location</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={clinicData.address}
              onChange={(e) => setClinicData({...clinicData, address: e.target.value})}
            />
          </div>

          <div className="pt-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-all shadow-sm flex items-center"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}