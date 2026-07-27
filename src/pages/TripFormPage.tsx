import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2, Globe } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createTrip, getTrip, updateTrip, type TripInput } from '@/lib/trips'
import { COUNTRIES } from '@/data/countries'
import { CURRENCY_PRESETS } from '@/data/currencies'
import { countryFlag } from '@/utils/format'
import { errMsg } from '@/utils/error'

export default function TripFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [country, setCountry] = useState('JP')
  const [overseas, setOverseas] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const [rate, setRate] = useState('')
  const [memo, setMemo] = useState('')

  const [loading, setLoading] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 編集時：既存データを読み込む
  useEffect(() => {
    if (!editing || !id) return
    getTrip(id).then((t) => {
      if (t) {
        setTitle(t.title)
        setDestination(t.destination ?? '')
        setStartDate(t.start_date)
        setEndDate(t.end_date)
        setBudget(t.budget != null ? String(t.budget) : '')
        setCountry(t.default_country)
        setMemo(t.memo ?? '')
        if (t.local_currency && t.exchange_rate != null) {
          setOverseas(true)
          setCurrency(t.local_currency)
          setRate(String(t.exchange_rate))
        }
      }
      setLoading(false)
    })
  }, [editing, id])

  // 通貨プリセットを選ぶと、レートが空ならおおよその目安を入れる
  function pickCurrency(code: string) {
    setCurrency(code)
    const preset = CURRENCY_PRESETS.find((c) => c.code === code)
    if (preset && !rate) setRate(String(preset.rateHint))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (endDate < startDate) {
      setError('終了日は開始日以降にしてください。')
      return
    }
    if (overseas) {
      const r = Number(rate)
      if (!currency.trim() || !r || r <= 0) {
        setError('海外旅行の場合、通貨と為替レート（0より大きい値）を入力してください。')
        return
      }
    }

    const input: TripInput = {
      title: title.trim(),
      destination: destination.trim() || null,
      start_date: startDate,
      end_date: endDate,
      budget: budget ? Math.max(0, Math.round(Number(budget))) : null,
      default_country: overseas ? country : 'JP',
      local_currency: overseas ? currency.trim().toUpperCase() : null,
      exchange_rate: overseas ? Number(rate) : null,
      memo: memo.trim() || null,
    }

    setBusy(true)
    try {
      if (editing && id) {
        await updateTrip(id, input)
        navigate(`/trips/${id}`)
      } else {
        if (!user) throw new Error('ログインが必要です')
        const newId = await createTrip(input, user.id)
        navigate(newId ? `/trips/${newId}` : '/')
      }
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-safe-top pb-nav-safe">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted -ml-1"
      >
        <ChevronLeft className="w-4 h-4" /> 戻る
      </button>

      <h1 className="mt-2 text-xl font-bold">
        {editing ? '旅行を編集' : '新しい旅行'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field label="タイトル" required>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={40}
            placeholder="例：9月 京都旅行"
            className={inputCls}
          />
        </Field>

        <Field label="行き先" required>
          <input
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            maxLength={60}
            placeholder="例：ソウル（周遊は「パリ、ローマ」と区切って）"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="開始日" required>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                if (!endDate) setEndDate(e.target.value)
              }}
              className={inputCls}
            />
          </Field>
          <Field label="終了日" required>
            <input
              type="date"
              required
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="予算（円・任意）">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="例：50000"
            className={inputCls}
          />
        </Field>

        {/* 海外旅行セクション */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Globe className="w-4 h-4 text-accent2" />
              海外旅行（外貨で記録する）
            </span>
            <input
              type="checkbox"
              checked={overseas}
              onChange={(e) => setOverseas(e.target.checked)}
              className="w-5 h-5 accent-[#0ea5e9]"
            />
          </label>

          {overseas && (
            <div className="mt-4 space-y-4">
              <Field label="渡航先の国">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputCls}
                >
                  {COUNTRIES.filter((c) => c.code !== 'JP').map((c) => (
                    <option key={c.code} value={c.code}>
                      {countryFlag(c.code)} {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="現地通貨">
                <select
                  value={currency}
                  onChange={(e) => pickCurrency(e.target.value)}
                  className={inputCls}
                >
                  {CURRENCY_PRESETS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}（{c.label}）
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="為替レート">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted whitespace-nowrap">
                    1 {currency} =
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.0001"
                    min={0}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="155"
                    className={inputCls}
                  />
                  <span className="text-sm text-muted">円</span>
                </div>
              </Field>

              <p className="text-xs text-subtle leading-relaxed">
                ⚠️ このレートで支出を円換算します。あとで実際のレートに直すと、全支出が一括で再計算されます。
              </p>
            </div>
          )}
        </div>

        <Field label="メモ（任意）">
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={2}
            className={inputCls}
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl gradient-bg text-white font-medium py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : editing ? (
            '保存する'
          ) : (
            'この内容で作成'
          )}
        </button>
      </form>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-accent'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-muted mb-1">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
