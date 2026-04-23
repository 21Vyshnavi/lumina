import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { MessageSquare, FileText, LogOut, Plus, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../services/api'
import type { ChatSession } from '../../types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId } = useParams()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [collapsed, setCollapsed] = useState(false)

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/chat/sessions')
      setSessions(data)
    } catch {}
  }

  useEffect(() => { fetchSessions() }, [location.pathname])

  const handleNewChat = () => navigate('/chat')

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await api.delete(`/chat/sessions/${id}`)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (sessionId === id) navigate('/chat')
    } catch {
      toast.error('Failed to delete chat')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isChat = location.pathname.startsWith('/chat')
  const isDocs = location.pathname.startsWith('/documents')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-200',
        collapsed ? 'w-14' : 'w-64'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-800 flex-shrink-0">
          <Sparkles size={20} className="text-brand-400 flex-shrink-0" />
          {!collapsed && <span className="font-semibold text-white text-sm">Lumina</span>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-gray-500 hover:text-gray-300 transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <div className="flex flex-col gap-1 p-2 flex-shrink-0">
          <button
            onClick={handleNewChat}
            className="btn-primary w-full justify-center text-xs py-2"
          >
            <Plus size={14} />
            {!collapsed && 'New Chat'}
          </button>

          <Link
            to="/chat"
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              isChat ? 'bg-brand-600/20 text-brand-300' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            <MessageSquare size={16} className="flex-shrink-0" />
            {!collapsed && 'Chat'}
          </Link>

          <Link
            to="/documents"
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              isDocs ? 'bg-brand-600/20 text-brand-300' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            )}
          >
            <FileText size={16} className="flex-shrink-0" />
            {!collapsed && 'Documents'}
          </Link>
        </div>

        {/* Chat history */}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto px-2 py-1">
            <p className="text-xs text-gray-600 px-2 mb-1 uppercase tracking-wide">Recent chats</p>
            <div className="space-y-0.5">
              {sessions.map((s) => (
                <Link
                  key={s.id}
                  to={`/chat/${s.id}`}
                  className={clsx(
                    'group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors',
                    sessionId === s.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                  )}
                >
                  <span className="truncate">{s.title}</span>
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all ml-1 flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* User footer */}
        <div className="border-t border-gray-800 p-3 flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{user?.username}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-600 hover:text-red-400 transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-full flex justify-center text-gray-600 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
