import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProgress } from '../hooks/useProgress'
import '../EL.css'

const EL = '/english-learning'

export default function ELNotebookPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const { notebook, saveNote, addXP } = useProgress()
  const [search, setSearch] = useState('')
  const [editKey, setEditKey] = useState(null)
  const [editText, setEditText] = useState('')
  const [newNote, setNewNote] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newText, setNewText] = useState('')

  const entries = Object.entries(notebook)
    .map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const filtered = search
    ? entries.filter(e => e.text.toLowerCase().includes(search.toLowerCase()) || e.key.toLowerCase().includes(search.toLowerCase()))
    : entries

  const startEdit = (key, text) => { setEditKey(key); setEditText(text) }

  const saveEdit = () => {
    if (editKey) {
      saveNote(editKey, editText)
      setEditKey(null)
      setEditText('')
    }
  }

  const deleteNote = (key) => {
    saveNote(key, '')
    if (editKey === key) setEditKey(null)
  }

  const addNew = () => {
    if (!newKey.trim() || !newText.trim()) return
    saveNote(newKey.trim(), newText.trim())
    addXP?.('notebook')
    setNewKey(''); setNewText(''); setNewNote(false)
  }

  const fmt = (ts) => new Date(ts).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      <div className="el-page">
        <header className="el-top-bar">
          <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
          <span className="el-top-bar-title">📓 مذكرتي</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="el-icon-btn" onClick={() => setNewNote(true)} title="ملاحظة جديدة">+</button>
            <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </header>

        <div className="el-notebook-page">

          {/* Search */}
          <div className="el-notebook-search-wrap">
            <input
              className="el-notebook-search"
              placeholder="🔍 ابحث في ملاحظاتك..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* New note form */}
          {newNote && (
            <div className="el-notebook-new-card">
              <input
                className="el-notebook-key-input"
                placeholder="عنوان الملاحظة (مثال: grammar-a1-day3)"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
              />
              <textarea
                className="el-notebook-textarea"
                placeholder="اكتب ملاحظتك هنا..."
                rows={4}
                value={newText}
                onChange={e => setNewText(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="el-nav-btn primary" onClick={addNew}>💾 حفظ</button>
                <button className="el-nav-btn" onClick={() => { setNewNote(false); setNewKey(''); setNewText('') }}>إلغاء</button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {entries.length === 0 && !newNote && (
            <div className="el-notebook-empty">
              <div className="el-notebook-empty-icon">📓</div>
              <div className="el-notebook-empty-title">لا ملاحظات بعد</div>
              <div className="el-notebook-empty-desc">اضغط + لإضافة أول ملاحظة. ستُحفظ تلقائياً في المتصفح.</div>
              <button className="el-nav-btn primary" style={{ marginTop: 16 }} onClick={() => setNewNote(true)}>
                + ملاحظة جديدة
              </button>
            </div>
          )}

          {/* Notes list */}
          <div className="el-notebook-list">
            {filtered.map(entry => (
              <div key={entry.key} className="el-notebook-card">
                <div className="el-notebook-card-header">
                  <div className="el-notebook-card-key">🏷️ {entry.key}</div>
                  <div className="el-notebook-card-time">{fmt(entry.updatedAt)}</div>
                </div>
                {editKey === entry.key ? (
                  <div className="el-notebook-edit">
                    <textarea
                      className="el-notebook-textarea"
                      rows={4}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="el-nav-btn primary" onClick={saveEdit}>💾 حفظ</button>
                      <button className="el-nav-btn" onClick={() => setEditKey(null)}>إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div className="el-notebook-card-text">{entry.text}</div>
                )}
                <div className="el-notebook-card-actions">
                  <button className="el-notebook-action-btn" onClick={() => startEdit(entry.key, entry.text)}>✏️ تعديل</button>
                  <button className="el-notebook-action-btn del" onClick={() => deleteNote(entry.key)}>🗑️ حذف</button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && search && (
            <div className="el-notebook-empty">
              <div className="el-notebook-empty-desc">لا نتائج لـ "{search}"</div>
            </div>
          )}

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: 'var(--el-muted)' }}>
            {entries.length} ملاحظة محفوظة في المتصفح
          </div>
        </div>
      </div>
    </div>
  )
}
