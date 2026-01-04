'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, Variants } from 'framer-motion'
import { cn } from '@/utils/cn'

export default function CustomCursor() {
  const [variant, setVariant] = useState<'default' | 'button' | 'text'>('default')
  
  // 1. إحداثيات الماوس الخام
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  // 2. فيزياء "الزنبرك" لحركة ناعمة جداً (Smooth Spring Physics)
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // الكشف عن العناصر التفاعلية
      if (target.tagName === 'BUTTON' || target.closest('button') || target.tagName === 'A' || target.closest('a')) {
        setVariant('button')
      } else if (target.tagName === 'P' || target.tagName === 'H1' || target.tagName === 'H2' || target.tagName === 'H3' || target.tagName === 'SPAN' || target.tagName === 'INPUT') {
        setVariant('text')
      } else {
        setVariant('default')
      }
    }

    window.addEventListener('mousemove', moveCursor)
    window.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', moveCursor)
      window.removeEventListener('mouseover', handleMouseOver)
    }
  }, [mouseX, mouseY])

  // إخفاء المؤشر على الموبايل
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
    return null
  }

  // 3. حالات المؤشر (Variants)
  const variants: Variants = {
    default: {
      height: 32,
      width: 32,
      backgroundColor: "#ffffff",
      x: -16, // ليكون في المنتصف
      y: -16,
      mixBlendMode: "difference" as any
    },
    button: {
      height: 80, // يكبر جداً عند الأزرار
      width: 80,
      backgroundColor: "#ffffff",
      x: -40,
      y: -40,
      mixBlendMode: "difference" as any
    },
    text: {
      height: 60, // تكبير متوسط للنصوص
      width: 60,
      backgroundColor: "#ffffff",
      x: -30,
      y: -30,
      mixBlendMode: "difference" as any
    }
  }

  return (
    <>
      {/* المؤشر الرئيسي (الدائرة الكبيرة) */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        variants={variants}
        animate={variant}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      />
      
      {/* نقطة صغيرة جداً في المنتصف للدقة (اختياري) */}
      <motion.div 
         className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
         style={{
            x: mouseX, // تتبع الماوس فوراً بدون تأخير
            y: mouseY,
            translateX: '-50%',
            translateY: '-50%'
         }}
      />
    </>
  )
}