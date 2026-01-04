'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface BillingChartProps {
  invoices: any[];
  loading?: boolean;
  focusDate?: number | null;
}

// --- دوال مساعدة (لم تتغير) ---
const processMonthlyData = (invoices: any[]) => {
  const currentYear = new Date().getFullYear();
  const monthlyMap = new Array(12).fill(0);
  invoices.forEach(inv => {
    const date = new Date(inv.created_at);
    if (date.getFullYear() === currentYear && inv.status === 'paid') {
      monthlyMap[date.getMonth()] += inv.amount;
    }
  });
  return monthlyMap.map((amount, index) => [new Date(currentYear, index, 1).getTime(), amount]);
};

const processDailyData = (invoices: any[], year: number, monthIndex: number) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dailyMap = new Array(daysInMonth + 1).fill(0);
  invoices.forEach(inv => {
    const date = new Date(inv.created_at);
    if (date.getFullYear() === year && date.getMonth() === monthIndex && inv.status === 'paid') {
      dailyMap[date.getDate()] += inv.amount;
    }
  });
  const data = [];
  for (let i = 1; i <= daysInMonth; i++) {
    data.push([new Date(year, monthIndex, i).getTime(), dailyMap[i]]);
  }
  return data;
};

export default function BillingChart({ invoices = [], loading = false, focusDate }: BillingChartProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');
  const [chartSeries, setChartSeries] = useState([{ name: "Revenue", data: [] as any[] }]);
  const [chartKey, setChartKey] = useState(0);
  
  const viewModeRef = useRef(viewMode);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  // دالة العودة للوضع الشهري
  const resetToMonthly = useCallback(() => {
    // إذا كنا أصلاً في الشهري، لا تفعل شيئاً
    if (viewModeRef.current === 'monthly') return;

    const monthlyData = processMonthlyData(invoices);
    setChartSeries([{ name: "Total Revenue", data: monthlyData }]);
    setViewMode('monthly');
    setChartKey(prev => prev + 1); // إعادة رسم الشارت بالكامل
  }, [invoices]);

  // التحميل الأولي
  useEffect(() => {
    if (invoices.length > 0 && viewMode === 'monthly') {
      const monthlyData = processMonthlyData(invoices);
      setChartSeries([{ name: "Total Revenue", data: monthlyData }]);
    }
  }, [invoices]); 

  // منطق Focus الخارجي
  useEffect(() => {
    if (focusDate && invoices.length > 0) {
      const targetDate = new Date(focusDate);
      const year = targetDate.getFullYear();
      const monthIndex = targetDate.getMonth();
      const monthName = targetDate.toLocaleString('default', { month: 'long' });

      const dailyData = processDailyData(invoices, year, monthIndex);
      setChartSeries([{ name: `Revenue (${monthName})`, data: dailyData }]);
      setViewMode('daily');

      setTimeout(() => {
        const min = focusDate - (86400000 * 2);
        const max = focusDate + (86400000 * 2);
        import('apexcharts').then((mod) => {
            mod.default.exec('billing-chart-drilldown', 'zoomX', min, max);
        });
      }, 150);
    }
  }, [focusDate, invoices]);

  const options: ApexOptions = useMemo(() => ({
    legend: { show: true, position: "top", horizontalAlign: "left" },
    colors: ["#10b981", "#34d399"],
    chart: {
      id: "billing-chart-drilldown",
      fontFamily: "inherit",
      height: 310,
      type: "area",
      // === تفعيل الزوم عبر الماوس ===
      zoom: {
        enabled: true,
        type: 'x',  
        autoScaleYaxis: true
      },
      toolbar: {
        show: true,
        autoSelected: 'zoom',
        tools: {
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
        }
      },
      events: {
        beforeResetZoom: () => {
            resetToMonthly();
            return { xaxis: { min: undefined, max: undefined } };
        },
        // === هنا السحر: منطق الزوم الذكي ===
        zoomed: function(chartContext, { xaxis }) {
          // حساب الفرق بين بداية ونهاية الشارت بالمللي ثانية
          const diff = xaxis.max - xaxis.min;
          const ONE_DAY_MS = 86400000;
          
          // 1. سيناريو الخروج (Zoom Out / Scroll Back):
          // إذا كنا في الوضع اليومي، والمستخدم قام بالتصغير بحيث أصبحت الفترة المعروضة أكبر من 60 يوماً
          if (viewModeRef.current === 'daily') {
             // 60 يوماً هو الحد الفاصل، إذا تجاوزناه يعني المستخدم يريد رؤية أوسع
             if (diff > (28 * ONE_DAY_MS)) {
                 resetToMonthly();
             }
             return; 
          }

          // 2. سيناريو الدخول (Zoom In):
          // إذا كنا في الوضع الشهري، والزوم أصبح أقل من 45 يوماً
          const THRESHOLD_DAYS = 45;
          if (viewModeRef.current === 'monthly' && diff < (THRESHOLD_DAYS * ONE_DAY_MS)) {
            const midPoint = (xaxis.min + xaxis.max) / 2;
            const targetDate = new Date(midPoint);
            const monthIndex = targetDate.getMonth();
            const year = targetDate.getFullYear();
            const monthName = targetDate.toLocaleString('default', { month: 'long' });

            const dailyData = processDailyData(invoices, year, monthIndex);
            
            setChartSeries([{ name: `Revenue (${monthName})`, data: dailyData }]);
            setViewMode('daily');
          }
        }
      }
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.55, opacityTo: 0, stops: [0, 90, 100] },
    },
    dataLabels: { enabled: false },
    grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    xaxis: {
      type: "datetime",
      tooltip: { enabled: false },
      labels: { datetimeFormatter: { year: 'yyyy', month: 'MMM', day: 'dd MMM' } }
    },
    yaxis: {
      labels: { formatter: (val) => `$${val.toFixed(0)}`, style: { fontSize: "12px", colors: ["#6B7280"] } },
    },
    tooltip: { x: { format: "dd MMM yyyy" }, y: { formatter: (val) => `$${val}` } }
  }), [invoices, resetToMonthly]);

  if (loading) return <div className="h-[310px] w-full bg-gray-50 animate-pulse rounded-lg"></div>;

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900">
           {viewMode === 'monthly' ? 'Annual Revenue Growth' : 'Daily Revenue Breakdown'}
        </h3>
        
        {viewMode === 'daily' && (
            <button 
                onClick={resetToMonthly}
                className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md hover:bg-emerald-100 transition-colors"
            >
                ← Back to Annual
            </button>
        )}
      </div>
      
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div id="chartBilling" className="min-w-[600px]"> 
          <Chart key={chartKey} options={options} series={chartSeries} type="area" height={310} />
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
        {viewMode === 'monthly' 
          ? <span>🔍 Scroll or Drag to Zoom In</span> 
          : <span>🖱️ Scroll Back or Reset to Zoom Out</span>
        }
      </p>
    </div>
  );
}