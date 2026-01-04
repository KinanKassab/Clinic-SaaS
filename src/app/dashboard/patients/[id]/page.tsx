'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import AddRecordModal from '@/components/patients/AddRecordModal'
import CreateInvoiceModal from '@/components/patients/CreateInvoiceModal' // 👈 استيراد مودال الفواتير
import Skeleton from '@/components/ui/Skeleton'
import { formatDate } from '@/utils/formatDate'

export default function PatientDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  // Data States
  const [patient, setPatient] = useState<any>(null)
  const [clinic, setClinic] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([]) // 👈 حالة للفواتير
  const [loading, setLoading] = useState(true)

  // UI States
  const [activeTab, setActiveTab] = useState<'medical' | 'billing'>('medical') // 👈 للتحكم بالتبويبات
  
  // Modals States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [recordToEdit, setRecordToEdit] = useState<any>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    
    // 1. Patient & Clinic
    const { data: patientData, error } = await supabase.from('patients').select('*').eq('id', id).single()
    if (error) { router.push('/dashboard/patients'); return }
    setPatient(patientData)

    if (patientData.clinic_id) {
        const { data: clinicData } = await supabase.from('clinics').select('*').eq('id', patientData.clinic_id).single()
        setClinic(clinicData)
    }

    // 2. Medical Records
    const { data: recordsData } = await supabase.from('medical_records').select('*').eq('patient_id', id).order('visit_date', { ascending: false })
    setRecords(recordsData || [])

    // 3. Invoices (Billing)
    const { data: invoicesData } = await supabase.from('invoices').select('*').eq('patient_id', id).order('created_at', { ascending: false })
    setInvoices(invoicesData || [])

    setLoading(false)
  }, [id, router])

  useEffect(() => { if (id) fetchData() }, [id, fetchData])

  // Medical Record Handlers
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Delete this record?')) return
    const supabase = createClient()
    await supabase.from('medical_records').delete().eq('id', recordId)
    fetchData()
  }
  const handleEditRecord = (record: any) => { setRecordToEdit(record); setIsRecordModalOpen(true) }
  const handleNewRecord = () => { setRecordToEdit(null); setIsRecordModalOpen(true) }

  // Invoice Handlers
  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Delete this invoice?')) return
    const supabase = createClient()
    await supabase.from('invoices').delete().eq('id', invoiceId)
    fetchData()
  }

  // حساب المجموع
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0)

  if (loading) {
    return (
      <div className="p-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <Skeleton className="h-8 w-32 mx-auto mb-4" />
            <Skeleton className="h-4 w-24 mx-auto mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white min-h-screen">
      
      {/* Print Letterhead */}
      <div className="hidden print:flex flex-col items-center justify-center border-b-2 border-gray-800 pb-6 mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 uppercase">{clinic?.name}</h1>
        <div className="text-sm text-gray-600 font-medium space-y-1 mt-2">
            <p>{clinic?.address}</p>
            <p>{clinic?.phone}</p>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 print:hidden">
        <motion.button 
          onClick={() => router.back()} 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <span className="mr-2">←</span> Back
        </motion.button>
        <div className="flex gap-3">
            {/* الأزرار تتغير حسب التبويب المفتوح */}
            <AnimatePresence mode="wait">
              {activeTab === 'medical' ? (
                <motion.button 
                  key="new-visit"
                  onClick={handleNewRecord}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <span>+</span> New Visit
                </motion.button>
              ) : (
                <motion.button 
                  key="new-invoice"
                  onClick={() => setIsInvoiceModalOpen(true)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <span>💰</span> New Invoice
                </motion.button>
              )}
            </AnimatePresence>
            
            <motion.button 
              onClick={() => window.print()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <span>🖨️</span> Print {activeTab === 'medical' ? 'File' : 'Statement'}
            </motion.button>
        </div>
      </div>

      {/* Modals */}
      <AddRecordModal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} onSuccess={fetchData} recordToEdit={recordToEdit} />
      <CreateInvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onSuccess={fetchData} patientId={''} />


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Patient Info (Always Visible) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit print:shadow-none print:border-2 print:border-gray-800">
          <div className="text-center border-b pb-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
            <p className="text-sm text-gray-500 mt-1">ID: {patient.id.slice(0, 8)}</p>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between"><span className="text-gray-500">Gender</span><span className="font-medium capitalize">{patient.gender}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{patient.phone || '-'}</span></div>
            
            {/* هذا الكود يوضع تحت Phone أو DOB في العمود الأيسر */}
            <div className="flex justify-between">
                <span className="text-gray-500">First Visit</span>
                <span className="font-medium text-blue-600">
                  {patient.first_visit_date ? formatDate(patient.first_visit_date) : 'Unknown'}
                </span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t flex flex-col items-center">
             <QRCodeSVG value={patient.id} size={100} level={"H"} />
          </div>
        </div>

        {/* Right Column: Content Area */}
        <div className="md:col-span-2 space-y-6">
          
          {/* TABS Navigation (Hidden in Print) */}
          <div className="flex border-b border-gray-200 print:hidden relative">
            <motion.button
                onClick={() => setActiveTab('medical')}
                className={`relative py-4 px-6 text-sm font-medium z-10 ${
                    activeTab === 'medical' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Medical Records
                {activeTab === 'medical' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
            </motion.button>
            <motion.button
                onClick={() => setActiveTab('billing')}
                className={`relative py-4 px-6 text-sm font-medium z-10 ${
                    activeTab === 'billing' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Billing & Invoices
                {activeTab === 'billing' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
            </motion.button>
          </div>

          {/* === CONTENT 1: MEDICAL RECORDS === */}
          <div className={activeTab === 'medical' ? 'block' : 'hidden print:hidden'}>
             {/* Note: In print mode, we hide non-active tabs using CSS logic or just relying on what's rendered */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:border-none print:shadow-none">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center print:hidden">Visits History</h3>
                <h3 className="hidden print:block text-xl font-bold border-b pb-2 mb-4">Medical Visits Record</h3>

                {records.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg print:hidden">No visits recorded.</div>
                ) : (
                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 print:border-l-4 print:border-gray-800">
                        {records.map((record, index) => (
                        <motion.div 
                          key={record.id} 
                          className="relative pl-8 print:pl-6 print:mb-8 print:break-inside-avoid group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                        >
                            <span className="absolute -left-2.25 top-1 bg-white border-2 border-blue-500 rounded-full w-4 h-4 print:border-gray-800 print:bg-gray-800"></span>
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-xs text-gray-500 font-mono print:text-gray-700 print:font-bold">{formatDate(record.visit_date)}</p>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                    <motion.button 
                                      onClick={() => handleEditRecord(record)} 
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="text-blue-500 text-xs"
                                    >
                                      Edit
                                    </motion.button>
                                    <motion.button 
                                      onClick={() => handleDeleteRecord(record.id)} 
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="text-red-500 text-xs"
                                    >
                                      Delete
                                    </motion.button>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 print:bg-white print:border-2 print:border-gray-300">
                                <h4 className="font-bold text-gray-900 text-lg mb-2">{record.diagnosis}</h4>
                                {record.prescription && <p className="text-sm bg-white p-2 rounded border font-medium print:border-none print:p-0">Rx: {record.prescription}</p>}
                            </div>
                        </motion.div>
                        ))}
                    </div>
                )}
             </div>
          </div>

          {/* === CONTENT 2: BILLING (INVOICES) === */}
          <div className={activeTab === 'billing' ? 'block' : 'hidden print:hidden'}>
            
            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6 print:hidden">
                <motion.div 
                  className="bg-green-50 p-4 rounded-lg border border-green-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                    <p className="text-sm text-green-600 font-medium">Total Paid</p>
                    <p className="text-2xl font-bold text-green-700">${totalPaid.toFixed(2)}</p>
                </motion.div>
                <motion.div 
                  className="bg-yellow-50 p-4 rounded-lg border border-yellow-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <p className="text-sm text-yellow-600 font-medium">Pending (Debt)</p>
                    <p className="text-2xl font-bold text-yellow-700">${totalPending.toFixed(2)}</p>
                </motion.div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border-2 print:border-gray-800">
                <h3 className="hidden print:block text-xl font-bold p-6 border-b">Account Statement</h3>
                
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 print:bg-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-3 print:hidden"></th>
                        </tr>
                    </thead>
                    <motion.tbody 
                      className="bg-white divide-y divide-gray-200"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        visible: {
                          transition: {
                            staggerChildren: 0.05
                          }
                        }
                      }}
                    >
                        {invoices.map((inv) => (
                            <motion.tr 
                              key={inv.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(inv.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {inv.service_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                                    ${inv.amount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                                    <motion.button 
                                      onClick={() => handleDeleteInvoice(inv.id)} 
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Delete
                                    </motion.button>
                                </td>
                            </motion.tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                            <td colSpan={3} className="px-6 py-4 text-right text-gray-900">Total Due:</td>
                            <td className="px-6 py-4 text-right text-gray-900">${(totalPaid + totalPending).toFixed(2)}</td>
                            <td className="print:hidden"></td>
                        </tr>
                    </motion.tbody>
                </table>
            </div>
          </div>

        </div>
      </div>
      
      {/* Print Footer */}
      <div className="hidden print:block fixed bottom-0 left-0 w-full text-center text-xs text-gray-500 p-4 border-t">
        Printed from ClinicSaaS on {formatDate(new Date())}
      </div>
    </div>
  )
}