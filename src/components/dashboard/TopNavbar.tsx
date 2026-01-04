'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import QRScannerModal from './QRScannerModal'

type SearchResult = {
  id: string
  full_name: string
  phone: string
  dob: string
}

export default function TopNavbar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)

  // البحث التلقائي عند الكتابة
  useEffect(() => {
    const searchPatients = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      const supabase = createClient()
      
      // نرسل النص كما كتبه المستخدم تماماً، ودالة الـ SQL ستعالجه
      // لاحظ أننا غيرنا اسم الدالة إلى search_patients_smart
      const { data, error } = await supabase
        .rpc('search_patients_smart', { term: query }) 
        .limit(5)

      if (!error && data) {
        setResults(data)
        setShowResults(true)
      } else if (error) {
        console.error("Search Error:", error)
      }
      
      setLoading(false)
    }

    const timeoutId = setTimeout(() => {
      searchPatients()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // ... باقي الكود كما هو دون تغيير ...

  // إخفاء النتائج عند النقر خارج المربع
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPatient = (id: string) => {
    router.push(`/dashboard/patients/${id}`)
    setShowResults(false)
    setQuery('')
  }

  const handleScanSuccess = (scannedId: string) => {
    if (scannedId) {
        router.push(`/dashboard/patients/${scannedId}`)
        setIsScannerOpen(false)
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 h-16 px-8 flex items-center justify-between shadow-sm sticky top-0 z-30">
      
      <div className="text-xl font-bold text-gray-800 hidden md:block">
        Clinic<span className="text-blue-600">SaaS</span>
      </div>

      <div className="flex-1 max-w-xl mx-auto relative" ref={searchRef}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            ) : (
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
            placeholder="Search by name, phone (09...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
          />
          
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-xs border border-gray-200 rounded px-1.5 py-0.5">⌘K</span>
          </div>
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <ul>
              {results.map((patient) => (
                <li 
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient.id)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{patient.full_name}</p>
                      <p className="text-xs text-gray-500" dir="ltr">{patient.phone || 'No phone'}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                        {patient.dob ? new Date(patient.dob).getFullYear() : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {showResults && query.length >= 2 && results.length === 0 && !loading && (
          <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-100 p-4 text-center text-sm text-gray-500 z-50">
            No patients found matching "{query}"
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 ml-4">
        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Scan QR Code"
            onClick={() => setIsScannerOpen(true)}
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
        </motion.button>

        <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
            DR
        </div>
      </div>

      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScan={handleScanSuccess} 
      />

    </div>
  )
}