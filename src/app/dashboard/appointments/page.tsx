'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Phone, User, CheckCircle, XCircle, Search, Filter } from 'lucide-react'
import BookAppointmentModal from '@/components/appointments/BookAppointmentModal'
import AddRecordModal from '@/components/patients/AddRecordModal' // 👈 استيراد مودال السجل
import Link from 'next/link'
import { toast } from 'sonner'
import CreateInvoiceModal from '@/components/patients/CreateInvoiceModal' // 👈 استيراد مودال الفاتورة
import { formatDate, formatTime } from '@/utils/formatDate'

// ... (نفس الـ Interfaces السابقة) ...
interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  reason: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  patients: {
    full_name: string
    phone: string
  }
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [isBookModalOpen, setIsBookModalOpen] = useState(false)
  
  // 👈 State جديد للتحكم بمودال "إكمال الزيارة"
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  const [showTodayOnly, setShowTodayOnly] = useState(true) 
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const supabase = createClient()

  const fetchAppointments = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patients(full_name, phone)')
      .order('appointment_date', { ascending: true })

    if (data) setAppointments(data as any)
    setLoading(false)
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  // دالة لتحديث الحالة (للقبول والإلغاء فقط)
  const updateStatus = async (id: string, newStatus: string) => {
    setAppointments(prev => prev.map(app => 
      app.id === id ? { ...app, status: newStatus as any } : app
    ))

    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      toast.error('Error updating status')
      fetchAppointments()
    } else {
        toast.success(`Appointment ${newStatus}`)
    }
  }

  // 👈 دالة التعامل مع زر "Mark Complete"
  const handleMarkCompleteClick = (appointment: Appointment) => {
      setSelectedAppointment(appointment)
      setIsRecordModalOpen(true)
  }

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = app.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.patients?.phone?.includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus

    let matchesDate = true
    if (showTodayOnly) {
      const appDate = new Date(new Date(app.appointment_date).toLocaleString('en-US', { timeZone: 'Asia/Damascus' })).toDateString()
      const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Damascus' })).toDateString()
      matchesDate = appDate === today
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

  return (
    <div className="space-y-6">
      <BookAppointmentModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
        onSuccess={fetchAppointments} 
      />

      {/* 👈 مودال إضافة السجل الذي سيظهر عند إكمال الموعد */}
      {selectedAppointment && (
          <AddRecordModal
            isOpen={isRecordModalOpen}
            onClose={() => {
                setIsRecordModalOpen(false)
                // لا نصفر selectedAppointment هنا حتى نتمكن من استخدامه في مودال الفاتورة
                if (!isInvoiceModalOpen) setSelectedAppointment(null)
            }}
            onSuccess={() => {
                fetchAppointments()
                setSelectedAppointment(null)
            }}
            // 👈 عند طلب الفاتورة
            // @ts-ignore: onSaveAndBill is intentionally passed for extended behavior
            onSaveAndBill={() => {
                fetchAppointments() // تحديث الخلفية
                setTimeout(() => setIsInvoiceModalOpen(true), 200) // فتح مودال الفاتورة بتأخير بسيط للجمالية
            }}
            patientId={selectedAppointment.patient_id}
            appointmentId={selectedAppointment.id}
          />
      )}

      {selectedAppointment && (
          <CreateInvoiceModal 
            isOpen={isInvoiceModalOpen}
            onClose={() => {
                setIsInvoiceModalOpen(false)
                setSelectedAppointment(null) // الآن انتهينا تماماً
            }}
            onSuccess={() => {
                // تحديث البيانات المالية إذا لزم الأمر
            }}
            patientId={selectedAppointment.patient_id} // تمرير معرف المريض
          />
      )}

      {/* Header & Filters (كما هي سابقاً) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" /> 
            {showTodayOnly ? "Today's Appointments" : "All Appointments"}
          </h1>
          <p className="text-gray-500">Manage your schedule and patient visits.</p>
        </div>
        <button 
          onClick={() => setIsBookModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 shadow-sm shadow-blue-200"
        >
          + New Appointment
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" placeholder="Search patient..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="relative w-full md:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setShowTodayOnly(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${showTodayOnly ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Today</button>
            <button onClick={() => setShowTodayOnly(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!showTodayOnly ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>All Time</button>
        </div>
      </div>

      {/* Appointments Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
            {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse h-48"></div>)
            ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                    <motion.div 
                        key={app.id} layout variants={itemVariants}
                        initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                    >
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${
                            app.status === 'confirmed' ? 'bg-green-500' :
                            app.status === 'pending' ? 'bg-amber-500' :
                            app.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />

                        <div className="flex justify-between items-start mb-4 pl-2">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{app.patients?.full_name}</h3>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                    <Clock size={14} />
                                    {formatTime(app.appointment_date, { hour: '2-digit', minute: '2-digit' }, 'en-GB')}
                                    <span className="text-gray-300">|</span>
                                    {formatDate(app.appointment_date)}
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                app.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                app.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {app.status}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4 pl-2">
                             <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={14} className="text-gray-400" />
                                {app.patients?.phone || 'No phone'}
                            </div>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="font-medium text-gray-900">Reason:</span> {app.reason || 'Routine Checkup'}
                            </p>
                        </div>

                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 pl-2">
                            {app.status === 'pending' && (
                                <>
                                    <button onClick={() => updateStatus(app.id, 'confirmed')} className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-sm font-bold hover:bg-green-100 transition flex justify-center items-center gap-1">
                                        <CheckCircle size={16} /> Confirm
                                    </button>
                                    <button onClick={() => updateStatus(app.id, 'cancelled')} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition flex justify-center items-center gap-1">
                                        <XCircle size={16} /> Cancel
                                    </button>
                                </>
                            )}
                            {app.status === 'confirmed' && (
                                // 👈 عند الضغط هنا، نفتح المودال بدلاً من التحديث المباشر
                                <button 
                                    onClick={() => handleMarkCompleteClick(app)}
                                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex justify-center items-center gap-1"
                                >
                                    <CheckCircle size={16} /> Complete & Record
                                </button>
                            )}
                             {(app.status === 'completed' || app.status === 'cancelled') && (
                                <Link href={`/dashboard/patients/${app.patient_id}`} className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition flex justify-center items-center gap-1">
                                    <User size={16} /> View Profile
                                </Link>
                            )}
                        </div>
                    </motion.div>
                ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Calendar className="text-gray-400" size={32} /></div>
                    <h3 className="text-lg font-bold text-gray-900">No appointments found</h3>
                    <p className="text-gray-500 max-w-sm mt-1">{showTodayOnly ? "No appointments scheduled for today." : "Try adjusting your search or filters."}</p>
                    {showTodayOnly && <button onClick={() => setShowTodayOnly(false)} className="mt-4 text-blue-600 font-medium hover:underline">View all appointments</button>}
                </div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}