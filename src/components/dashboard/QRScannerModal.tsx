'use client'

import { Scanner } from '@yudiel/react-qr-scanner'
import { motion, AnimatePresence } from 'framer-motion'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (data: string) => void
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
          <motion.div 
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Scan Patient QR</h3>
              <motion.button 
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

        {/* Camera Area */}
        <div className="relative bg-black min-h-[300px]">
            <Scanner
                onScan={(result) => {
                    if (result && result[0]) {
                        onScan(result[0].rawValue);
                        onClose();
                    }
                }}
                onError={(error) => {
                    // console.log(error); 
                }}
                // 👇 تم حذف 'audio' من هنا لحل المشكلة
                components={{
                    finder: true, // إظهار المربع الأخضر
                }}
                styles={{
                    container: { height: 300 }
                }}
            />
        </div>

            {/* Footer */}
            <div className="p-4 text-center bg-white border-t">
              <p className="text-sm text-gray-500">
                وجه الكاميرا نحو رمز الـ QR الخاص بالمريض
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}   