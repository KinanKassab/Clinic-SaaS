export function formatDate(date?: Date | string | number | null, options?: Intl.DateTimeFormatOptions, locale = 'en-CA') {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString(locale, { timeZone: 'Asia/Damascus', ...options })
}

export function formatTime(date?: Date | string | number | null, options?: Intl.DateTimeFormatOptions, locale = 'en-GB') {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleTimeString(locale, { timeZone: 'Asia/Damascus', ...options })
}

export default formatDate
