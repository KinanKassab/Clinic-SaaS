'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, type Variants } from 'framer-motion'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import Link from 'next/link'
import { 
  Users, 
  Calendar, 
  Clock, 
  DollarSign,
  UserPlus,
  FileText,
  CalendarDays,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react'
import { formatDate, formatTime } from '@/utils/formatDate'

// --- Interfaces ---
interface Appointment {
  id: string
  appointment_date: string
  status: string
  patients: {
    id: string
    full_name: string // ✅ تم التعديل: استخدام الاسم الكامل
    phone?: string
  } | null
}

interface ChartData {
  name: string
  amount: number
}

// --- Helper Components ---
const CountUp = ({ value, isCurrency = false }: { value: number, isCurrency?: boolean }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) return

    let step = end > 1000 ? Math.ceil(end / 40) : 1; 
    let timer = setInterval(() => {
      start += step
      if (start > end) start = end;
      setCount(start)
      if (start === end) clearInterval(timer)
    }, 25)

    return () => clearInterval(timer)
  }, [value])

  if (isCurrency) {
    return <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(count)}</span>
  }
  return <span>{count}</span>
}

// --- Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants: Variants = {  
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function DashboardPage() {
  // --- State ---
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointmentsCount: 0,
    totalRevenue: 0,
    pendingInvoices: 0
  })
  
  const [todaySchedule, setTodaySchedule] = useState<Appointment[]>([])
  const [nextPatient, setNextPatient] = useState<Appointment | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    // 1. Time-based Greeting (use Damascus timezone)
    const damascusNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Damascus' }))
    const hour = damascusNow.getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 18) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    const fetchData = async () => {
      const supabase = createClient()
      const todayDate = formatDate(new Date())

      try {
        // A. Stats Counts
        const { count: patientsCount } = await supabase.from('patients').select('*', { count: 'exact', head: true })
        
        // B. Today's Appointments (Full List for Schedule)
        const { data: todayAppts } = await supabase
          .from('appointments')
          // ✅ تم التعديل: جلب full_name بدلاً من first_name, last_name
          .select(`id, appointment_date, status, patients (id, full_name, phone)`)
          .gte('appointment_date', `${todayDate}T00:00:00`)
          .lte('appointment_date', `${todayDate}T23:59:59`)
          .order('appointment_date', { ascending: true })

        const appointments = (todayAppts as unknown as Appointment[]) || []
        
        // Find "Next Patient" (First pending appointment today)
        const now = new Date()
        const upcoming = appointments.find(apt => 
           (apt.status === 'pending' || apt.status === 'confirmed') && new Date(apt.appointment_date) > now
        ) || appointments.find(apt => apt.status === 'pending') // Fallback to any pending
        
        setNextPatient(upcoming || null)
        setTodaySchedule(appointments)

        // C. Financials
        const { data: invoices } = await supabase
            .from('invoices')
            .select('amount, created_at, status')
        
        const totalRev = invoices
            ?.filter(inv => inv.status === 'paid')
            .reduce((acc, curr) => acc + curr.amount, 0) || 0

        const pendingInvCount = invoices?.filter(i => i.status === 'pending').length || 0

        setStats({
          totalPatients: patientsCount || 0,
          todayAppointmentsCount: appointments.length,
          totalRevenue: totalRev,
          pendingInvoices: pendingInvCount
        })

        // D. Chart Data (Monthly Revenue)
        if (invoices) {
          const monthlyRevenue: { [key: string]: number } = {}
          const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

          invoices.forEach((inv) => {
            if (inv.status === 'paid') {
                const date = new Date(inv.created_at)
                const monthName = date.toLocaleString('default', { month: 'short' })
                monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + inv.amount
            }
          })

          const formattedData = Object.keys(monthlyRevenue).map(month => ({
            name: month,
            amount: monthlyRevenue[month]
          })).sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name))

          setChartData(formattedData)
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6 p-1 max-w-7xl mx-auto">
      
      {/* --- Header Section --- */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-gray-100"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {greeting}, Dr. Ahmed
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm font-medium">
            <CalendarDays size={16} className="text-blue-500" />
            Your schedule for {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' }, 'en-US')}
          </p>
        </div>
        
        <div className="flex gap-3">
             <Link href="/dashboard/patients" className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium shadow-sm">
                <UserPlus size={16} />
                New Patient
            </Link>
            <Link href="/dashboard/appointments" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-200 text-sm font-medium">
                <Calendar size={16} />
                Book Appointment
            </Link>
        </div>
      </motion.div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === Left Column (Stats & Chart) === */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Stats Cards */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
                {/* Patients Card */}
                <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Patients</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                            {loading ? "..." : <CountUp value={stats.totalPatients} />}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <Users size={20} />
                    </div>
                </motion.div>

                {/* Revenue Card */}
                <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                            {loading ? "..." : <CountUp value={stats.totalRevenue} isCurrency />}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                        <DollarSign size={20} />
                    </div>
                </motion.div>

                {/* Pending Invoices Card */}
                <motion.div variants={itemVariants} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Bills</p>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                            {loading ? "..." : stats.pendingInvoices}
                        </h3>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                        <FileText size={20} />
                    </div>
                </motion.div>
            </motion.div>

            {/* Financial Chart */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                 <DashboardCharts data={chartData} />
            </motion.div>
            
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'All Patients', icon: <Users size={18} />, href: '/dashboard/patients', color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Billing', icon: <DollarSign size={18} />, href: '/dashboard/billing', color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Schedule', icon: <Calendar size={18} />, href: '/dashboard/appointments', color: 'bg-purple-50 text-purple-600' },
                    { label: 'Settings', icon: <MoreHorizontal size={18} />, href: '/dashboard/settings', color: 'bg-gray-100 text-gray-600' },
                ].map((action, i) => (
                    <Link key={i} href={action.href} className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group">
                        <div className={`p-3 rounded-full mb-2 transition-transform group-hover:scale-110 ${action.color}`}>
                            {action.icon}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{action.label}</span>
                    </Link>
                ))}
            </div>

        </div>

        {/* === Right Column (Schedule & Up Next) === */}
        <div className="space-y-6">
            
            {/* "Up Next" Card */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden"
            >
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">Up Next</span>
                        <Clock className="opacity-80" size={20} />
                    </div>
                    
                    {nextPatient ? (
                        <>
                            <h2 className="text-2xl font-bold mb-1">
                                {/* ✅ تم التعديل: استخدام الاسم الكامل */}
                                {nextPatient.patients?.full_name}
                            </h2>
                            <p className="text-blue-100 text-sm mb-6">
                              {formatTime(nextPatient.appointment_date, { hour: '2-digit', minute: '2-digit' }, 'en-GB')}
                              {' • '}
                              {nextPatient.status}
                            </p>
                            
                            <Link 
                                href={`/dashboard/patients/${nextPatient.patients?.id}`}
                                className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition w-full justify-center"
                            >
                                Open File <ArrowRight size={16} />
                            </Link>
                        </>
                    ) : (
                        <div className="py-4 text-center">
                            <h3 className="text-lg font-semibold">No pending appointments</h3>
                            <p className="text-blue-100 text-sm">You are all caught up for now!</p>
                        </div>
                    )}
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-blue-400 opacity-20 rounded-full blur-xl" />
            </motion.div>

            {/* Today's Schedule List */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col max-h-125"
            >
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Today Schedule</h3>
                    <span className="text-xs font-medium bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-500">
                        {todaySchedule.length} Appts
                    </span>
                </div>
                
                <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {loading ? (
                         [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse mx-2" />)
                    ) : todaySchedule.length > 0 ? (
                        todaySchedule.map((apt) => {
                            const isPast = new Date(apt.appointment_date) < new Date() && apt.status !== 'completed';
                            return (
                                <div key={apt.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                    isPast ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'
                                }`}>
                                    {/* Time Column */}
                                    <div className="flex flex-col items-center min-w-15 border-r border-gray-100 pr-3">
                                        <span className="text-sm font-bold text-gray-900">
                                          {formatTime(apt.appointment_date, { hour: '2-digit', minute: '2-digit' }, 'en-GB')}
                                        </span>
                                        <span className="text-[10px] text-gray-400 uppercase">
                                          {new Date(new Date(apt.appointment_date).toLocaleString('en-US', { timeZone: 'Asia/Damascus' })).getHours() < 12 ? 'AM' : 'PM'}
                                        </span>
                                    </div>

                                    {/* Info Column */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {/* ✅ تم التعديل: استخدام الاسم الكامل */}
                                            {apt.patients ? apt.patients.full_name : 'Unknown'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`inline-block w-2 h-2 rounded-full ${
                                                apt.status === 'confirmed' ? 'bg-emerald-500' :
                                                apt.status === 'pending' ? 'bg-amber-500' :
                                                apt.status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'
                                            }`} />
                                            <span className="text-xs text-gray-500 capitalize">{apt.status}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action */}
                                    {apt.patients && (
                                        <Link href={`/dashboard/patients/${apt.patients.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                                            <ArrowRight size={16} />
                                        </Link>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-8 px-4">
                            <Calendar className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-sm text-gray-500">No appointments for today.</p>
                            <Link href="/dashboard/appointments" className="text-xs text-blue-600 font-bold hover:underline mt-1 block">
                                Schedule one now
                            </Link>
                        </div>
                    )}
                </div>
            </motion.div>

        </div>
      </div>
    </div>
  )
}