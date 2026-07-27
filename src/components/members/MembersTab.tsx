import { useEffect, useState } from 'react'
import {
  Loader2,
  UserPlus,
  Crown,
  Pencil,
  Eye,
  LogOut,
  X,
} from 'lucide-react'
import Modal from '@/components/layout/Modal'
import {
  listMembers,
  createInvite,
  updateMemberRole,
  removeMember,
} from '@/lib/members'
import { errMsg } from '@/utils/error'
import type { Trip, TripMember, Role } from '@/types'
import { useNavigate } from 'react-router-dom'

const ROLE_LABEL: Record<Role, string> = {
  owner: 'オーナー',
  editor: '編集可',
  viewer: '閲覧のみ',
}

export default function MembersTab({
  trip,
  userId,
  isOwner,
}: {
  trip: Trip
  userId: string
  isOwner: boolean
}) {
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const navigate = useNavigate()

  async function reload() {
    try {
      setMembers(await listMembers(trip.id))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id])

  async function changeRole(m: TripMember, role: Role) {
    await updateMemberRole(trip.id, m.user_id, role).catch((e) =>
      setError(errMsg(e)),
    )
    reload()
  }

  async function kick(m: TripMember) {
    if (!confirm(`${m.display_name} さんを旅行から外しますか？`)) return
    await removeMember(trip.id, m.user_id).catch((e) => setError(errMsg(e)))
    reload()
  }

  async function leave() {
    if (!confirm('この旅行から退出しますか？')) return
    try {
      await removeMember(trip.id, userId)
      navigate('/')
    } catch (e) {
      setError(errMsg(e))
    }
  }

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted" />
      </div>
    )

  return (
    <div>
      {isOwner && (
        <button
          onClick={() => setInviteOpen(true)}
          className="w-full rounded-xl gradient-bg text-white font-medium py-3 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" /> 招待リンクを作る
        </button>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-4 space-y-2">
        {members.map((m) => (
          <div
            key={m.user_id}
            className="rounded-2xl border border-border bg-surface p-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-surface2 flex items-center justify-center text-lg">
              {m.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium line-clamp-1">
                {m.display_name}
                {m.user_id === userId && (
                  <span className="text-xs text-subtle ml-1">（自分）</span>
                )}
              </p>
              <p className="text-xs text-muted flex items-center gap-1">
                {m.role === 'owner' && <Crown className="w-3 h-3" />}
                {m.role === 'editor' && <Pencil className="w-3 h-3" />}
                {m.role === 'viewer' && <Eye className="w-3 h-3" />}
                {ROLE_LABEL[m.role]}
              </p>
            </div>

            {/* オーナーによる権限変更・削除（対象がオーナー以外） */}
            {isOwner && m.role !== 'owner' && (
              <div className="flex items-center gap-1.5">
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m, e.target.value as Role)}
                  className="rounded-lg border border-border bg-bg text-xs px-2 py-1.5"
                >
                  <option value="editor">編集可</option>
                  <option value="viewer">閲覧のみ</option>
                </select>
                <button
                  onClick={() => kick(m)}
                  className="w-8 h-8 rounded-lg bg-surface2 text-danger flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 自分（オーナー以外）は退出できる */}
            {!isOwner && m.user_id === userId && (
              <button
                onClick={leave}
                className="text-danger text-xs flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" /> 退出
              </button>
            )}
          </div>
        ))}
      </div>

      {inviteOpen && (
        <InviteDialog trip={trip} onClose={() => setInviteOpen(false)} />
      )}
    </div>
  )
}

function InviteDialog({
  trip,
  onClose,
}: {
  trip: Trip
  onClose: () => void
}) {
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [ttl, setTtl] = useState(7)
  const [busy, setBusy] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setBusy(true)
    setError(null)
    try {
      const link = await createInvite(trip.id, role, ttl, 10)
      setUrl(link)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  async function share() {
    if (!url) return
    if (navigator.share) {
      await navigator.share({ title: trip.title, url }).catch(() => {})
    } else {
      await copy()
    }
  }

  async function copy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal title="招待リンクを作る" onClose={onClose}>
      {!url ? (
        <div className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-muted mb-2">
              権限
            </span>
            <div className="flex gap-2">
              <RoleBtn active={role === 'editor'} onClick={() => setRole('editor')}>
                編集可
              </RoleBtn>
              <RoleBtn active={role === 'viewer'} onClick={() => setRole('viewer')}>
                閲覧のみ
              </RoleBtn>
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-muted mb-2">
              有効期限
            </span>
            <div className="flex gap-2">
              {[1, 7, 30].map((d) => (
                <RoleBtn key={d} active={ttl === d} onClick={() => setTtl(d)}>
                  {d}日
                </RoleBtn>
              ))}
            </div>
          </div>

          <p className="text-xs text-subtle leading-relaxed">
            リンクを知っている人が参加できます。有効期限内・10回まで使えます。あとから「無効化」もできます。
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            onClick={generate}
            disabled={busy}
            className="w-full rounded-xl gradient-bg text-white font-medium py-3 flex items-center justify-center disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'リンクを発行'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            このリンクを友人・家族に送ってください。
            <span className="text-ink font-medium">
              ここで閉じると再表示できません。
            </span>
          </p>
          <div className="rounded-xl border border-border bg-surface2 p-3 text-xs break-all">
            {url}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copy}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium"
            >
              {copied ? 'コピーしました' : 'コピー'}
            </button>
            <button
              onClick={share}
              className="flex-1 rounded-xl gradient-bg text-white py-3 text-sm font-medium"
            >
              共有
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function RoleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-accent/10 ring-2 ring-accent text-accent'
          : 'bg-surface2 text-muted'
      }`}
    >
      {children}
    </button>
  )
}
