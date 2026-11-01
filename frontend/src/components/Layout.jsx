import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

const links = [
  { to: '/', label: 'Dashboard', roles: ['ADMIN', 'FACULTY', 'STUDENT'], end: true },
  { to: '/students', label: 'Students', roles: ['ADMIN', 'FACULTY'] },
  { to: '/faculty', label: 'Faculty', roles: ['ADMIN', 'FACULTY'] },
  { to: '/courses', label: 'Courses', roles: ['ADMIN', 'FACULTY', 'STUDENT'] },
  { to: '/attendance', label: 'Attendance', roles: ['ADMIN', 'FACULTY', 'STUDENT'] },
  { to: '/marks', label: 'Marks', roles: ['ADMIN', 'FACULTY', 'STUDENT'] },
  { to: '/notices', label: 'Notices', roles: ['ADMIN', 'FACULTY', 'STUDENT'] },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-60 bg-brand-950 text-white flex flex-col">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <Logo size={36} />
          <span className="text-xl font-bold tracking-tight">
            Campus<span className="text-accent-400">Hub</span>
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-brand-600 text-white' : 'text-indigo-200 hover:bg-brand-900'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
        </nav>
        <div className="px-5 py-3 text-xs text-indigo-300 border-t border-white/10">Created by Rajat Sharma</div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-6 py-3 flex justify-end items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.name} <span className="ml-1 px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">{user.role}</span>
          </span>
          <button onClick={logout} className="text-sm bg-brand-950 text-white px-3 py-1.5 rounded-lg hover:bg-brand-900">
            Logout
          </button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
