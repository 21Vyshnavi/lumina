import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, Sparkles, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react'
import { api } from '../services/api'
import type { Document, DocumentSummary } from '../types'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentSummary[]>([])
  const [selected, setSelected] = useState<Document | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)
  const [summarizing, setSummarizing] = useState<string | null>(null)
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null)

  useEffect(() => { fetchDocs() }, [])

  const fetchDocs = async () => {
    try {
      const { data } = await api.get('/documents')
      setDocs(data)
    } catch {
      toast.error('Failed to load documents')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setCreating(true)
    try {
      await api.post('/documents', { title: title.trim(), content: content.trim() })
      toast.success('Document saved')
      setTitle('')
      setContent('')
      setShowForm(false)
      fetchDocs()
    } catch {
      toast.error('Failed to save document')
    } finally {
      setCreating(false)
    }
  }

  const handleSummarize = async (id: string) => {
    setSummarizing(id)
    try {
      const { data } = await api.post(`/documents/${id}/summarize`)
      setDocs((prev) => prev.map((d) => d.id === id ? { ...d, summary: data.summary } : d))
      if (selected?.id === id) setSelected(data)
      setExpandedSummary(id)
      toast.success('Summary generated!')
    } catch {
      toast.error('Summarization failed')
    } finally {
      setSummarizing(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`)
      setDocs((prev) => prev.filter((d) => d.id !== id))
      if (selected?.id === id) setSelected(null)
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleView = async (id: string) => {
    if (selected?.id === id) { setSelected(null); return }
    try {
      const { data } = await api.get(`/documents/${id}`)
      setSelected(data)
    } catch {
      toast.error('Failed to load document')
    }
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">Documents</h2>
          <p className="text-xs text-gray-500 mt-0.5">Upload text and let Lumina summarize it with AI</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} />
          New Document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Create form */}
        {showForm && (
          <div className="card p-5 mb-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Add Document</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your document content here..."
                  className="input-field resize-none"
                  rows={8}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty state */}
        {docs.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-3">
              <FileText size={24} className="text-gray-500" />
            </div>
            <p className="text-gray-400 font-medium">No documents yet</p>
            <p className="text-gray-600 text-sm mt-1">Add a document to get AI-powered summaries</p>
          </div>
        )}

        {/* Document list */}
        <div className="space-y-3">
          {docs.map((doc) => (
            <div key={doc.id} className="card p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => handleView(doc.id)}
                  className="flex items-start gap-3 flex-1 text-left min-w-0"
                >
                  <FileText size={18} className="text-brand-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {doc.word_count.toLocaleString()} words · {formatDate(doc.created_at)}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleSummarize(doc.id)}
                    disabled={summarizing === doc.id}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      doc.summary
                        ? 'bg-brand-600/10 text-brand-400 hover:bg-brand-600/20'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                    )}
                    title="Summarize with AI"
                  >
                    {summarizing === doc.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Sparkles size={12} />}
                    {doc.summary ? 'Re-summarize' : 'Summarize'}
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Summary section */}
              {doc.summary && (
                <div className="mt-3 border-t border-gray-800 pt-3">
                  <button
                    onClick={() => setExpandedSummary(expandedSummary === doc.id ? null : doc.id)}
                    className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
                  >
                    <Sparkles size={11} />
                    AI Summary
                    {expandedSummary === doc.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {expandedSummary === doc.id && (
                    <p className="mt-2 text-xs text-gray-400 leading-relaxed animate-fade-in">
                      {doc.summary}
                    </p>
                  )}
                </div>
              )}

              {/* Full document content */}
              {selected?.id === doc.id && (
                <div className="mt-3 border-t border-gray-800 pt-3 animate-fade-in">
                  <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Full content</p>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto font-sans">
                    {selected.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
