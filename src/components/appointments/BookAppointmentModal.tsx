'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, FileText, User, Search, Plus, ChevronDown } from 'lucide-react'
import AddPatientModal from '@/components/patients/AddPatientModal'
import toast from 'react-hot-toast'

interface BookAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function BookAppointmentModal({ isOpen, onClose, onSuccess }: BookAppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  
  const [query, setQuery] = useState('')
  const [filteredPatients, setFilteredPatients] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)

  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    reason: ''
  })

  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const fetchPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, full_name, phone')
      .order('full_name', { ascending: true })
    
    if (data) {
      setPatients(data)
      setFilteredPatients(data)
    }
  }

  useEffect(() => {
    if (isOpen) {
        fetchPatients()
        setQuery('')
        setFormData(prev => ({ ...prev, patient_id: '' }))
    }
  }, [isOpen])

  useEffect(() => {
    if (query === '') {
        setFilteredPatients(patients)
    } else {
        setFilteredPatients(patients.filter(patient => 
            patient.full_name.toLowerCase().includes(query.toLowerCase()) ||
            patient.phone?.includes(query)
        ))
    }
  }, [query, patients])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patient_id) {
        toast.success('Please select a patient from the list')
        return
    }

    setLoading(true)
    
    try {
        // 1. جلب بيانات المستخدم الحالي (الدكتور)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('You must be logged in')

        // 2. جلب معرف العيادة من البروفايل
        const { data: profile } = await supabase
            .from('profiles')
            .select('clinic_id')
            .eq('id', user.id)
            .single()

        if (!profile?.clinic_id) throw new Error('Clinic ID not found')

        // Build a Date from the selected date/time (interpreted in browser's local tz)
        // and convert to ISO (UTC) so the backend stores a consistent instant.
        const combinedDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}:00`).toISOString()

        // 3. الإضافة مع doctor_id و clinic_id
        const { error } = await supabase.from('appointments').insert({
            patient_id: formData.patient_id,
            doctor_id: user.id,        // 👈 إضافة معرف الدكتور
            clinic_id: profile.clinic_id, // 👈 إضافة معرف العيادة
            appointment_date: combinedDateTime,
            reason: formData.reason,
            status: 'pending'
        })

        if (error) throw error

        setFormData({ patient_id: '', appointment_date: '', appointment_time: '', reason: '' })
        setQuery('')
        onSuccess()
        onClose()

    } catch (error: any) {
        console.error(error)
        toast.success('Error booking appointment: ' + error.message)
    } finally {
        setLoading(false)
    }
  }

  const handleSelectPatient = (patient: any) => {
      setFormData({ ...formData, patient_id: patient.id })
      setQuery(patient.full_name)
      setShowDropdown(false)
  }

  if (!isOpen) return null

  return (
    <>
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">New Appointment</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Patient Search */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search patient name or phone..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setShowDropdown(true)
                        if (formData.patient_id) setFormData({ ...formData, patient_id: '' })
                    }}
                    onFocus={() => setShowDropdown(true)}
                  />
                   <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                     <ChevronDown className="h-4 w-4 text-gray-400" />
                   </div>
              </div>

              {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                          filteredPatients.map(patient => (
                              <div 
                                key={patient.id} 
                                onClick={() => handleSelectPatient(patient)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center group"
                              >
                                  <div>
                                      <p className="font-medium text-gray-800">{patient.full_name}</p>
                                      <p className="text-xs text-gray-500">{patient.phone || 'No phone'}</p>
                                  </div>
                                  {formData.patient_id === patient.id && <span className="text-blue-600 text-xs">Selected</span>}
                              </div>
                          ))
                      ) : (
                          <div className="p-4 text-center text-gray-500 text-sm">
                              No patient found named "{query}"
                          </div>
                      )}
                      
                      <div 
                        onClick={() => {
                            setIsAddPatientOpen(true)
                            setShowDropdown(false)
                        }}
                        className="border-t border-gray-100 p-2 bg-gray-50 hover:bg-blue-50 cursor-pointer flex items-center justify-center gap-2 text-blue-600 font-medium transition-colors"
                      >
                          <Plus size={16} /> Add New Patient
                      </div>
                  </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="time" 
                    required
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.appointment_time}
                    onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea 
                  rows={3}
                  placeholder="e.g., Routine Checkup, Fever..."
                  className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>

    <AddPatientModal 
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onSuccess={() => {
            fetchPatients()
            setIsAddPatientOpen(false)
            toast.success('Patient added successfully! Please search for their name.')
        }}
    />
    </>
  )
}