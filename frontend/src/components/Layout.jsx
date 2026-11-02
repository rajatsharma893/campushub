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
      <aside className="w-60 bg-black text-white flex flex-col">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-neutral-800">
          <Logo size={38} light />
          <span className="text-xl font-bold tracking-tight">
            Campus<span className="text-red-500">Hub</span>
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
                    isActive ? 'bg-red-600 text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
        </nav>
        <div className="px-5 py-3 text-xs text-neutral-500 border-t border-neutral-800">Created by Rajat Sharma</div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b-2 border-red-600 px-6 py-3 flex justify-end items-center gap-4">
          <span className="text-sm text-neutral-700">
            {user.name}{' '}
            <span className="ml-1 px-2 py-0.5 rounded-full bg-black text-white text-xs font-semibold">{user.role}</span>
          </span>
          <button onClick={logout} className="text-sm border border-red-600 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-600 hover:text-white">
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
