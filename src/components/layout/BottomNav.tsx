import { NavLink } from 'react-router-dom'
import { Home, Map, Settings } from 'lucide-react'

const items = [
  { to: '/', label: 'ホーム', icon: Home, end: true },
  { to: '/map', label: 'マップ', icon: Map, end: false },
  { to: '/settings', label: '設定', icon: Settings, end: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-safe">
      <div className="max-w-md mx-auto flex">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2.5 text-xs ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
