import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Plug, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Database, Webhook, Globe, ShieldCheck, Copy, Check,
} from 'lucide-react'
import { supplierAdminApi } from '@/services/index'
import { useToast } from '@/hooks/use-toast'

/**
 * Panel superadmin untuk supplier RateHawk.
 *
 * Halaman ini TIDAK PERNAH menampilkan API token — hanya status apakah
 * kredensial sudah terpasang di server.
 */
export default function AdminRateHawk() {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ratehawk-status'],
    queryFn : () => supplierAdminApi.status().then(r => r.data?.data),
    refetchInterval: 60_000,
  })

  const { data: syncLogs } = useQuery({
    queryKey: ['ratehawk-sync-logs'],
    queryFn : () => supplierAdminApi.syncLogs({ limit: 8 }).then(r => r.data?.data ?? []),
  })

  const { data: apiLogs } = useQuery({
    queryKey: ['ratehawk-api-logs'],
    queryFn : () => supplierAdminApi.apiLogs({ limit: 8, errors_only: true }).then(r => r.data?.data ?? []),
  })

  const overview = useMutation({
    mutationFn: () => supplierAdminApi.overview().then(r => r.data?.data),
    onSuccess : (d) => {
      toast({
        title      : 'Koneksi RateHawk berhasil',
        description: `Environment ${d?.environment}. Daftar endpoint yang diizinkan sudah diperbarui.`,
      })
      refetch()
    },
    onError: (err) => toast({
      title      : 'Gagal menghubungi RateHawk',
      description: err?.response?.data?.message ?? 'Periksa kredensial dan whitelist IP server.',
      variant    : 'destructive',
    }),
  })

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(data?.webhookUrl ?? '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard diblokir browser */ }
  }

  if (isLoading) {
    return <div className="p-6"><div className="skeleton h-40 w-full rounded-2xl" /></div>
  }

  const isProduction = data?.environment === 'production'
  const ready = data?.enabled && data?.credentialsConfigured

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
            <Plug className="w-5 h-5 text-brand" /> RateHawk
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Supplier hotel eksternal (Emerging Travel Group API v3).
          </p>
        </div>

        <button
          onClick={() => overview.mutate()} disabled={overview.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white font-bold text-sm hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all"
        >
          {overview.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Menguji…</>
            : <><ShieldCheck className="w-4 h-4" /> Uji koneksi</>}
        </button>
      </div>

      {isProduction && (
        <Banner tone="amber" icon={AlertTriangle}>
          Environment <b>production</b> aktif. Pastikan sertifikasi ETG sudah selesai
          dan IP server sudah di-whitelist.
        </Banner>
      )}

      {!ready && (
        <Banner tone="slate" icon={AlertTriangle}>
          Integrasi belum aktif
          {!data?.credentialsConfigured && ' — RATEHAWK_KEY_ID / RATEHAWK_API_KEY belum diisi di server'}
          {data?.credentialsConfigured && !data?.enabled && ' — RATEHAWK_ENABLED masih false'}.
        </Banner>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Status" value={ready ? 'Aktif' : 'Nonaktif'} tone={ready ? 'green' : 'slate'} icon={ready ? CheckCircle2 : XCircle} />
        <Stat label="Environment" value={data?.environment ?? '-'} tone={isProduction ? 'amber' : 'blue'} icon={Globe} />
        <Stat label="Hotel tersinkron" value={(data?.totalHotels ?? 0).toLocaleString('id-ID')} icon={Database} />
        <Stat label="Hotel aktif" value={(data?.activeHotels ?? 0).toLocaleString('id-ID')} icon={Database} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Booking terkonfirmasi" value={data?.bookings?.confirmed ?? 0} tone="green" />
        <Stat label="Sedang diproses" value={data?.bookings?.processing ?? 0} tone="blue" />
        <Stat label="Gagal" value={data?.bookings?.failed ?? 0} tone="red" />
        <Stat label="Dibatalkan" value={data?.bookings?.cancelled ?? 0} tone="slate" />
      </div>

      {/* Webhook & IP */}
      <Card title="Webhook & jaringan" icon={Webhook}>
        <Row label="Webhook status booking">
          <div className="flex items-center gap-2 min-w-0">
            <code className="flex-1 truncate text-[11px] bg-slate-100 px-2 py-1.5 rounded-lg">
              {data?.webhookUrl}
            </code>
            <button onClick={copyWebhook} className="shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Salin">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </Row>
        <Row label="Webhook aktif">{data?.webhookEnabled ? 'Ya' : 'Tidak'}</Row>
        <Row label="IP keluar server (untuk whitelist ETG)">
          {data?.outboundIp || <span className="text-amber-600">Belum diisi di .env</span>}
        </Row>
        <Row label="Kredensial terpasang">
          {data?.credentialsConfigured
            ? <span className="text-emerald-600 font-semibold">Ya</span>
            : <span className="text-red-600 font-semibold">Belum</span>}
        </Row>
      </Card>

      {/* Sinkronisasi */}
      <Card title="Sinkronisasi konten statis" icon={RefreshCw}>
        <Row label="Sinkron penuh terakhir"><SyncCell sync={data?.lastFullSync} /></Row>
        <Row label="Sinkron inkremental terakhir"><SyncCell sync={data?.lastIncrementalSync} /></Row>
        <Row label="Hotel terpetakan ke properti ArahInn">{data?.mappedHotels ?? 0}</Row>

        {syncLogs?.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="text-slate-400">
                <tr className="text-left">
                  <th className="py-1.5 pr-3 font-semibold">Jenis</th>
                  <th className="py-1.5 pr-3 font-semibold">Status</th>
                  <th className="py-1.5 pr-3 font-semibold">Diproses</th>
                  <th className="py-1.5 font-semibold">Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {syncLogs.map(log => (
                  <tr key={log.id}>
                    <td className="py-1.5 pr-3">{log.type}</td>
                    <td className="py-1.5 pr-3">
                      <StatusPill status={log.status} />
                    </td>
                    <td className="py-1.5 pr-3">{log.processed?.toLocaleString('id-ID')}</td>
                    <td className="py-1.5 text-slate-400">{fmt(log.finishedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Error API terbaru */}
      <Card title="Error API terbaru" icon={AlertTriangle}>
        {apiLogs?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="text-slate-400">
                <tr className="text-left">
                  <th className="py-1.5 pr-3 font-semibold">Endpoint</th>
                  <th className="py-1.5 pr-3 font-semibold">Error</th>
                  <th className="py-1.5 pr-3 font-semibold">HTTP</th>
                  <th className="py-1.5 font-semibold">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apiLogs.map(log => (
                  <tr key={log.id}>
                    <td className="py-1.5 pr-3 font-mono truncate max-w-[220px]">{log.endpoint}</td>
                    <td className="py-1.5 pr-3 text-red-600">{log.providerError}</td>
                    <td className="py-1.5 pr-3">{log.httpCode ?? '-'}</td>
                    <td className="py-1.5 text-slate-400">{fmt(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Tidak ada error tercatat.</p>
        )}
      </Card>

      {/* Endpoint yang diizinkan */}
      {data?.allowedEndpoints?.length > 0 && (
        <Card title="Endpoint yang diizinkan untuk API key ini" icon={ShieldCheck}>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {data.allowedEndpoints.map((ep, i) => (
              <li key={i} className="text-[11px] font-mono text-slate-600 truncate">
                {typeof ep === 'string' ? ep : (ep.endpoint ?? ep.uri ?? JSON.stringify(ep))}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-400">
            Terakhir diperiksa: {fmt(data.capabilitiesCheckedAt) || 'belum pernah'}
          </p>
        </Card>
      )}
    </div>
  )
}

/* ── Sub-komponen ──────────────────────────────────────────────── */

function Stat({ label, value, tone = 'slate', icon: Icon }) {
  const tones = {
    green: 'text-emerald-600 bg-emerald-50',
    red  : 'text-red-600 bg-red-50',
    blue : 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    slate: 'text-slate-500 bg-slate-100',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        {Icon && <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tones[tone]}`}><Icon className="w-4 h-4" /></span>}
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-lg font-extrabold text-slate-900 capitalize">{value}</p>
    </div>
  )
}

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-bold text-sm text-slate-800 mb-3">
        {Icon && <Icon className="w-4 h-4 text-brand" />}{title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="sm:w-64 shrink-0 text-xs text-slate-500">{label}</span>
      <div className="flex-1 min-w-0 text-xs font-semibold text-slate-700">{children}</div>
    </div>
  )
}

function SyncCell({ sync }) {
  if (!sync) return <span className="text-slate-400">Belum pernah</span>
  return (
    <span className="inline-flex items-center gap-2">
      <StatusPill status={sync.status} />
      <span className="text-slate-400 font-normal">
        {(sync.processed ?? 0).toLocaleString('id-ID')} baris · {fmt(sync.finishedAt)}
      </span>
    </span>
  )
}

function StatusPill({ status }) {
  const tones = {
    success: 'text-emerald-700 bg-emerald-50',
    failed : 'text-red-700 bg-red-50',
    running: 'text-blue-700 bg-blue-50',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${tones[status] ?? tones.running}`}>
      {status}
    </span>
  )
}

function Banner({ tone, icon: Icon, children }) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs leading-relaxed ${tones[tone]}`}>
      <Icon className="w-4 h-4 shrink-0 mt-px" />
      <div>{children}</div>
    </div>
  )
}

function fmt(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}
