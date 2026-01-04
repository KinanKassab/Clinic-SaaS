'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation' // 👈 هوك لمعرفة الرابط الحالي
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname() // 👈 هذا المتغير يحمل المسار الحالي (مثلاً /dashboard/patients)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // دالة مساعدة لتحديد هل الرابط نشط أم لا
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: '📊' },
    { name: 'Patients', path: '/dashboard/patients', icon: '👥' },
    { name: 'Appointments', path: '/dashboard/appointments', icon: '📅' },
    { name: 'Billing & Invoices', path: '/dashboard/billing', icon: '💳' },
    { name: 'Settings', path: '/dashboard/settings', icon: '⚙️' },
  ]

  return (
    <div className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-20">
      
      {/* Logo */}
      <div className="h-16 flex items-center px-8 border-b border-gray-100">
        <span className="text-xl font-bold text-gray-800">Clinic<span className="text-blue-600">SaaS</span></span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative">
        {menuItems.map((item) => {
            const active = item.path === '/dashboard' ? pathname === '/dashboard' : isActive(item.path)
            
            return (
                <Link 
                    key={item.path}
                    href={item.path} 
                    className="relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-gray-600 hover:text-gray-900"
                >
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-50 rounded-lg shadow-sm ring-1 ring-blue-200"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 text-lg">{item.icon}</span>
                    <span className={`relative z-10 ${active ? 'text-blue-700 font-semibold' : ''}`}>
                      {item.name}
                    </span>
                </Link>
            )
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-gray-100">
        <motion.button 
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span>🚪</span>
          Logout
        </motion.button>
      </div>
    </div>
  )
}