'use client'

import Sidebar from '@/components/dashboard/Sidebar'
import TopNavbar from '@/components/dashboard/TopNavbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Sidebar: نخفيه عند الطباعة */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* منطقة المحتوى الرئيسية:
         ml-64: تترك مسافة للسايدبار في الوضع العادي
         print:ml-0: تلغي هذه المسافة عند الطباعة لتملأ الورقة بالكامل
      */}
      <div className="flex-1 ml-64 flex flex-col print:ml-0">
        
        {/* Navbar: نخفيه عند الطباعة */}
        <div className="print:hidden">
          <TopNavbar />
        </div>

        {/* محتوى الصفحات */}
        <main className="p-8 flex-1 bg-gray-50 print:bg-white print:p-0">
          {children}
        </main>
      </div>
    </div>
  )
}