import { useEffect, useState } from 'react'
import {
  Loader2,
  UserPlus,
  Crown,
  Pencil,
  Eye,
  LogOut,
  X,
  Link2,
} from 'lucide-react'
import Modal from '@/components/layout/Modal'
import {
  listMembers,
  createInvite,
  updateMemberRole,
  removeMember,
  listActiveInvites,
  revokeInvite,
  transferOwnership,
} from '@/lib/members'
import { errMsg } from '@/utils/error'
import { fmtDateTime } from '@/utils/format'
import type { Trip, TripMember, Role, Invite } from '@/types'
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
  onOwnerChanged,
}: {
  trip: Trip
  userId: string
  isOwner: boolean
  /** オーナー委譲後、旅行と自分の権限を読み直すため親に知らせる */
  onOwnerChanged: () => void
}) {
  const [members, setMembers] = useState<TripMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const navigate = useNavigate()

  async function reload() {
    try {
      setMembers(await listMembers(trip.id))
      // 招待リンクの一覧はオーナーにしか見えない（RLS）
      if (isOwner) setInvites(await listActiveInvites(trip.id))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.id, isOwner])

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

  async function revoke(inv: Invite) {
    if (
      !confirm(
        'この招待リンクを無効化しますか？\nすでに送ったリンクは使えなくなります（参加済みのメンバーはそのままです）。',
      )
    )
      return
    await revokeInvite(inv.id).catch((e) => setError(errMsg(e)))
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

      {/* 発行済みで、まだ使える招待リンク（SHARE-04） */}
      {isOwner && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted mb-2">
            有効な招待リンク
          </h3>
          {invites.length === 0 && (
            <p className="text-xs text-subtle">
              有効な招待リンクはありません。期限切れ・上限到達・無効化済みのリンクはここに表示されません。
            </p>
          )}
          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="rounded-2xl border border-border bg-surface p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-surface2 flex items-center justify-center text-muted">
                  <Link2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {ROLE_LABEL[inv.role]}・{fmtDateTime(inv.created_at)} 発行
                  </p>
                  <p className="text-xs text-muted">
                    {fmtDateTime(inv.expires_at)} まで・{inv.used_count}/
                    {inv.max_uses} 回使用
                  </p>
                </div>
                <button
                  onClick={() => revoke(inv)}
                  className="rounded-lg bg-surface2 text-danger text-xs font-medium px-3 py-2"
                >
                  無効化
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* オーナーは退出できないので、先に権限を渡す（SHARE-08） */}
      {isOwner && members.length > 1 && (
        <button
          onClick={() => setTransferOpen(true)}
          className="mt-6 w-full rounded-xl border border-border py-3 text-sm text-muted flex items-center justify-center gap-1.5"
        >
          <Crown className="w-4 h-4" /> オーナー権限を渡す
        </button>
      )}

      {transferOpen && (
        <TransferDialog
          trip={trip}
          candidates={members.filter((m) => m.user_id !== userId)}
          onClose={() => setTransferOpen(false)}
          onDone={() => {
            setTransferOpen(false)
            onOwnerChanged()
          }}
        />
      )}

      {inviteOpen && (
        <InviteDialog
          trip={trip}
          onClose={() => {
            setInviteOpen(false)
            reload()
          }}
        />
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
            リンクを知っている人が参加できます。有効期限内・10回まで使えます。あとからメンバー画面の「有効な招待リンク」で無効化もできます。
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

function TransferDialog({
  trip,
  candidates,
  onClose,
  onDone,
}: {
  trip: Trip
  candidates: TripMember[]
  onClose: () => void
  onDone: () => void
}) {
  const [target, setTarget] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    const m = candidates.find((c) => c.user_id === target)
    if (!m) return
    if (
      !confirm(
        `${m.display_name} さんをオーナーにしますか？\nあなたは「編集可」になり、元に戻すには新しいオーナーに渡し直してもらう必要があります。`,
      )
    )
      return
    setBusy(true)
    setError(null)
    try {
      await transferOwnership(trip.id, m.user_id)
      onDone()
    } catch (e) {
      setError(errMsg(e))
      setBusy(false)
    }
  }

  return (
    <Modal title="オーナー権限を渡す" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted leading-relaxed">
          オーナーは旅行の削除・招待・メンバー管理ができます。渡したあと、あなたは「編集可」のメンバーになり、旅行から退出できるようになります。
        </p>

        <div className="space-y-2">
          {candidates.map((m) => (
            <button
              key={m.user_id}
              type="button"
              onClick={() => setTarget(m.user_id)}
              className={`w-full rounded-2xl p-3 flex items-center gap-3 text-left transition ${
                target === m.user_id
                  ? 'bg-accent/10 ring-2 ring-accent'
                  : 'bg-surface2'
              }`}
            >
              <span className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-lg">
                {m.emoji}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium line-clamp-1">
                  {m.display_name}
                </span>
                <span className="block text-xs text-muted">
                  {ROLE_LABEL[m.role]}
                </span>
              </span>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          onClick={submit}
          disabled={!target || busy}
          className="w-full rounded-xl gradient-bg text-white font-medium py-3 flex items-center justify-center disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'オーナーにする'}
        </button>
      </div>
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
