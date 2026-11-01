import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
      <aside className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="px-5 py-4 text-lg font-bold border-b border-slate-700">CampusHub</div>
        <nav className="flex-1 p-3 space-y-1">
          {links
            .filter((l) => l.roles.includes(user.role))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-slate-800'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
        </nav>
        <div className="px-5 py-3 text-xs text-slate-400 border-t border-slate-700">Created by Rajat Sharma</div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-6 py-3 flex justify-end items-center gap-4">
          <span className="text-sm text-gray-600">
            {user.name} ({user.role})
          </span>
          <button onClick={logout} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
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
