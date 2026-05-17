import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, Cell,
} from 'recharts'
import { formatRupiah } from '@/utils'
import { TrendingUp } from 'lucide-react'

const COLOR        = '#2563eb'
const COLOR_LIGHT  = '#60a5fa'

const fmtAxisShort = (v) => {
  if (!v) return '0'
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}m`
  if (v >= 1e6) return `${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1)}jt`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}rb`
  return String(v)
}

function CustomTooltip({ active, payload, label, labelPrefix }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-lg shadow-xl border border-slate-800">
      <p className="text-[10px] text-slate-300 uppercase tracking-wide font-semibold">{labelPrefix}</p>
      <p className="text-xs text-slate-100 font-medium mt-0.5">{label}</p>
      <p className="text-sm font-bold text-blue-300 mt-1.5">{formatRupiah(payload[0].value)}</p>
    </div>
  )
}

/**
 * Elegant revenue bar chart with gradient, rounded tops, value labels.
 *
 * @param {Array}  data         — array of { [xKey]: string, [yKey]: number }
 * @param {string} xKey         — data key for x-axis (e.g. 'month' or 'date')
 * @param {string} yKey         — data key for y-axis (e.g. 'revenue' or 'amount')
 * @param {number} height       — chart height in px (default 220)
 * @param {string} labelPrefix  — tooltip label prefix (e.g. 'Bulan' or 'Tanggal')
 * @param {(v:any)=>string} xFormatter — optional x-axis tick formatter
 */
export default function RevenueChart({
  data = [],
  xKey  = 'month',
  yKey  = 'revenue',
  height = 220,
  labelPrefix = 'Bulan',
  xFormatter,
}) {
  // Empty state
  if (!data.length) {
    return (
      <div className="h-52 flex flex-col items-center justify-center gap-2 text-slate-300">
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-400">Belum ada transaksi.</p>
      </div>
    )
  }

  const maxVal = Math.max(...data.map(d => d[yKey] || 0))
  // Round up to nice number for y-axis max
  const niceMax = (() => {
    if (maxVal === 0) return 1
    const exp  = Math.pow(10, Math.floor(Math.log10(maxVal)))
    const norm = maxVal / exp
    if (norm <= 1)   return 1.5 * exp
    if (norm <= 2)   return 2.5 * exp
    if (norm <= 5)   return 6 * exp
    return 10 * exp
  })()

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 28, right: 8, left: -8, bottom: 0 }}
        barCategoryGap={data.length === 1 ? '40%' : '25%'}
      >
        <defs>
          <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={COLOR_LIGHT} stopOpacity={1} />
            <stop offset="100%" stopColor={COLOR}       stopOpacity={1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="#eef2f7" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickFormatter={xFormatter}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickFormatter={fmtAxisShort}
          axisLine={false}
          tickLine={false}
          domain={[0, niceMax]}
          tickCount={5}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: '#eff6ff' }}
          content={<CustomTooltip labelPrefix={labelPrefix} />}
        />
        <Bar
          dataKey={yKey}
          radius={[10, 10, 4, 4]}
          maxBarSize={56}
        >
          {data.map((_, i) => (
            <Cell key={i} fill="url(#revBar)" />
          ))}
          <LabelList
            dataKey={yKey}
            position="top"
            formatter={fmtAxisShort}
            style={{ fontSize: 10, fill: '#1e293b', fontWeight: 700 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
