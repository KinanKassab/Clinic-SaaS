import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner' // 👈 1. استيراد

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Clinic SaaS',
  description: 'Medical Clinic Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors /> {/* 👈 2. إضافة الحاوية هنا */}
      </body>
    </html>
  )
}