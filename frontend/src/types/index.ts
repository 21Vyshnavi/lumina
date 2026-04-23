export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ChatSession {
  id: string
  title: string
  created_at: string
  messages?: Message[]
}

export interface Document {
  id: string
  title: string
  content: string
  summary?: string
  word_count: number
  created_at: string
}

export interface DocumentSummary {
  id: string
  title: string
  summary?: string
  word_count: number
  created_at: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}
