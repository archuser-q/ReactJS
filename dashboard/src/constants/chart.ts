export const CHART_COLORS = {
  primary: '#2a78d6',
  secondary: '#eb6834',
}

export const formatPeriod = (period: string, groupBy: 'day' | 'week' | 'month') => {
  const [y, m, d] = period.split('-')
  if (groupBy === 'month') return `${m}/${y}`
  if (groupBy === 'week') return `Tuần ${d}/${m}`
  return `${d}/${m}`
}

export const shortMoney = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`
  return String(v)
}