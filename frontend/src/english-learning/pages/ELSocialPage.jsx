import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../../config'
import '../EL.css'

const EL = '/english-learning'
const WS_BASE = API_BASE.replace(/^https?/, s => s === 'https' ? 'wss' : 'ws')

function useAuth() {
  const user  = (() => { try { return JSON.parse(localStorage.getItem('noura_user')) } catch { return null } })()
  const token = localStorage.getItem('noura_token') || ''
  return { user, token }
}

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function api(method, path, token, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Avatar ────────────────────────────────────────────────────────
function Avatar({ name, size = 36, online }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6','#ef4444']
  const color  = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
      }}>{initials}</div>
      {online !== undefined && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 9, height: 9, borderRadius: '50%',
          background: online ? '#22c55e' : '#6b7280',
          border: '2px solid var(--el-bg)',
        }} />
      )}
    </div>
  )
}

// ── Time display ──────────────────────────────────────────────────
function TimeAgo({ iso }) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return <span className="el-social-time">الآن</span>
  if (diff < 3600) return <span className="el-social-time">{Math.floor(diff/60)} د</span>
  if (diff < 86400) return <span className="el-social-time">{Math.floor(diff/3600)} س</span>
  return <span className="el-social-time">{d.toLocaleDateString('ar')}</span>
}

// ── Main component ────────────────────────────────────────────────
export default function ELSocialPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const [tab, setTab]         = useState('friends')   // friends | groups
  const [friends, setFriends] = useState({ accepted: [], pending_in: [], pending_out: [] })
  const [groups, setGroups]   = useState([])
  const [search, setSearch]   = useState('')
  const [searchRes, setSearchRes] = useState([])
  const [searching, setSearching] = useState(false)

  const [activeChat, setActiveChat] = useState(null)  // { chat_id, title, type }
  const [messages, setMessages]     = useState([])
  const [msgInput, setMsgInput]     = useState('')
  const [sending, setSending]       = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  const [newGroupName, setNewGroupName]   = useState('')
  const [showNewGroup, setShowNewGroup]   = useState(false)
  const [addMemberInput, setAddMemberInput] = useState('')
  const [addMemberRes, setAddMemberRes]   = useState([])

  const [notif, setNotif] = useState(null)  // { text, ok }

  const wsRef      = useRef(null)
  const msgBottomRef = useRef(null)
  const searchTimer  = useRef(null)

  // ── Toast ─────────────────────────────────────────────────────
  const toast = (text, ok = true) => {
    setNotif({ text, ok })
    setTimeout(() => setNotif(null), 3000)
  }

  // ── Load friends + groups ─────────────────────────────────────
  const loadFriends = useCallback(async () => {
    if (!token) return
    try { setFriends(await api('GET', '/social/friends', token)) } catch {}
  }, [token])

  const loadGroups = useCallback(async () => {
    if (!token) return
    try { setGroups(await api('GET', '/social/groups', token)) } catch {}
  }, [token])

  useEffect(() => {
    loadFriends()
    loadGroups()
  }, [loadFriends, loadGroups])

  // ── WebSocket ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !token) return
    const ws = new WebSocket(`${WS_BASE}/ws/social/${user.id}?token=${token}`)
    wsRef.current = ws

    ws.onmessage = e => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message') {
          // Append to current chat if open
          setMessages(prev => {
            if (prev.length && prev[0]?.chat_id === data.chat_id) return [...prev, data]
            if (activeChat?.chat_id === data.chat_id) return [...prev, data]
            return prev
          })
          toast(`رسالة جديدة من ${data.sender_name}`, true)
        } else if (data.type === 'friend_request') {
          toast(`طلب صداقة من ${data.from.name} 🙋`, true)
          loadFriends()
        } else if (data.type === 'friend_accepted') {
          toast(`${data.by.name} قبل طلب الصداقة ✅`, true)
          loadFriends()
        } else if (data.type === 'added_to_group') {
          toast(`تمت إضافتك لمجموعة "${data.group.name}" 👥`, true)
          loadGroups()
        }
      } catch {}
    }

    // Heartbeat ping every 25s to keep WS alive on Render
    const ping = setInterval(() => { if (ws.readyState === 1) ws.send('ping') }, 25000)
    return () => { clearInterval(ping); ws.close() }
  }, [user?.id, token]) // eslint-disable-line

  // ── Search users ──────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimer.current)
    if (!search.trim()) { setSearchRes([]); return }
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api('GET', `/social/search?q=${encodeURIComponent(search)}`, token)
        setSearchRes(res)
      } catch {}
      setSearching(false)
    }, 400)
  }, [search, token])

  // ── Open chat ─────────────────────────────────────────────────
  const openChat = useCallback(async (chatId, title) => {
    setActiveChat({ chat_id: chatId, title })
    setMessages([])
    setLoadingMsgs(true)
    try {
      const msgs = await api('GET', `/social/messages/${chatId}`, token)
      setMessages(msgs)
    } catch (err) { toast(err.message, false) }
    setLoadingMsgs(false)
  }, [token])

  useEffect(() => {
    msgBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ──────────────────────────────────────────────
  const sendMsg = async () => {
    if (!msgInput.trim() || !activeChat || sending) return
    setSending(true)
    try {
      const msg = await api('POST', '/social/messages', token, {
        chat_id: activeChat.chat_id,
        content: msgInput.trim(),
      })
      setMessages(prev => [...prev, msg])
      setMsgInput('')
    } catch (err) { toast(err.message, false) }
    setSending(false)
  }

  // ── Friend actions ────────────────────────────────────────────
  const sendFriendReq = async (addressee_id, name) => {
    try {
      await api('POST', '/social/friends/request', token, { addressee_id })
      toast(`أُرسل طلب الصداقة إلى ${name} ✅`)
      setSearchRes(prev => prev.filter(u => u.id !== addressee_id))
      loadFriends()
    } catch (err) { toast(err.message, false) }
  }

  const acceptReq = async fid => {
    try {
      await api('PUT', `/social/friends/${fid}/accept`, token)
      toast('قبلت طلب الصداقة ✅')
      loadFriends()
    } catch (err) { toast(err.message, false) }
  }

  const removeFriend = async fid => {
    try {
      await api('DELETE', `/social/friends/${fid}`, token)
      toast('تمت إزالة الصديق')
      loadFriends()
    } catch (err) { toast(err.message, false) }
  }

  // ── Group actions ─────────────────────────────────────────────
  const createGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      await api('POST', '/social/groups', token, { name: newGroupName.trim() })
      toast(`تم إنشاء المجموعة "${newGroupName}" 🎉`)
      setNewGroupName('')
      setShowNewGroup(false)
      loadGroups()
    } catch (err) { toast(err.message, false) }
  }

  const searchAddMember = async q => {
    setAddMemberInput(q)
    if (!q.trim()) { setAddMemberRes([]); return }
    try {
      const res = await api('GET', `/social/search?q=${encodeURIComponent(q)}`, token)
      setAddMemberRes(res)
    } catch {}
  }

  const addMemberToGroup = async (gid, uid, name) => {
    try {
      await api('POST', `/social/groups/${gid}/members`, token, { user_id: uid })
      toast(`تمت إضافة ${name} للمجموعة ✅`)
      setAddMemberInput('')
      setAddMemberRes([])
      loadGroups()
    } catch (err) { toast(err.message, false) }
  }

  // ── Derived ───────────────────────────────────────────────────
  const activeFriendIds = new Set([
    ...friends.accepted.map(f => f.id),
    ...friends.pending_out.map(f => f.id),
  ])

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={`el-app${darkMode ? ' el-dark' : ''}`}>
      {/* Toast */}
      {notif && (
        <div className={`el-social-toast${notif.ok ? '' : ' error'}`}>{notif.text}</div>
      )}

      <div className="el-social-layout">
        {/* ── Sidebar ── */}
        <aside className="el-social-sidebar">
          <header className="el-social-sidebar-header">
            <button className="el-icon-btn" onClick={() => navigate(EL)}>←</button>
            <span className="el-social-logo">👥 المجتمع</span>
            <button className="el-icon-btn" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </header>

          {/* Search */}
          <div className="el-social-search-wrap">
            <input
              className="el-social-search"
              placeholder="ابحث عن مستخدم..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {searching && <div className="el-social-searching">🔍</div>}
          </div>

          {/* Search results */}
          {searchRes.length > 0 && (
            <div className="el-social-search-results">
              {searchRes.map(u => (
                <div key={u.id} className="el-social-search-row">
                  <Avatar name={u.name} size={32} />
                  <div className="el-social-search-info">
                    <div className="el-social-search-name">{u.name}</div>
                    <div className="el-social-search-email">{u.email}</div>
                  </div>
                  {activeFriendIds.has(u.id) ? (
                    <span className="el-social-badge sent">مُرسَل</span>
                  ) : (
                    <button className="el-social-add-btn" onClick={() => sendFriendReq(u.id, u.name)}>
                      ➕ أضف
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="el-social-tabs">
            <button className={`el-social-tab${tab === 'friends' ? ' active' : ''}`} onClick={() => setTab('friends')}>
              👥 الأصدقاء
              {friends.pending_in.length > 0 && (
                <span className="el-social-badge red">{friends.pending_in.length}</span>
              )}
            </button>
            <button className={`el-social-tab${tab === 'groups' ? ' active' : ''}`} onClick={() => setTab('groups')}>
              📢 المجموعات
            </button>
          </div>

          <div className="el-social-list">
            {/* ── FRIENDS TAB ── */}
            {tab === 'friends' && (
              <>
                {/* Pending incoming */}
                {friends.pending_in.length > 0 && (
                  <div className="el-social-section-label">طلبات الصداقة 🔔</div>
                )}
                {friends.pending_in.map(f => (
                  <div key={f.friendship_id} className="el-social-friend-row pending-in">
                    <Avatar name={f.name} size={36} />
                    <div className="el-social-friend-info">
                      <div className="el-social-friend-name">{f.name}</div>
                      <div className="el-social-friend-sub">{f.email}</div>
                    </div>
                    <div className="el-social-req-actions">
                      <button className="el-social-accept-btn" onClick={() => acceptReq(f.friendship_id)}>✓</button>
                      <button className="el-social-reject-btn" onClick={() => removeFriend(f.friendship_id)}>✕</button>
                    </div>
                  </div>
                ))}

                {/* Accepted friends */}
                {friends.pending_in.length > 0 && friends.accepted.length > 0 && (
                  <div className="el-social-section-label">أصدقاؤك</div>
                )}
                {friends.accepted.length === 0 && friends.pending_in.length === 0 && (
                  <div className="el-social-empty">
                    <div style={{ fontSize: '2.5rem' }}>🤝</div>
                    <div>ابحث عن أصدقائك أعلاه وأضفهم!</div>
                  </div>
                )}
                {friends.accepted.map(f => {
                  const chatId = `dm_${Math.min(user.id, f.id)}_${Math.max(user.id, f.id)}`
                  return (
                    <div
                      key={f.friendship_id}
                      className={`el-social-friend-row${activeChat?.chat_id === chatId ? ' active' : ''}`}
                      onClick={() => openChat(chatId, f.name)}
                    >
                      <Avatar name={f.name} size={36} online={f.online} />
                      <div className="el-social-friend-info">
                        <div className="el-social-friend-name">{f.name}</div>
                        <div className="el-social-friend-sub">{f.online ? '🟢 متصل' : '⚫ غير متصل'}</div>
                      </div>
                      <button
                        className="el-social-remove-btn"
                        title="إزالة"
                        onClick={e => { e.stopPropagation(); removeFriend(f.friendship_id) }}
                      >✕</button>
                    </div>
                  )
                })}

                {/* Pending outgoing */}
                {friends.pending_out.length > 0 && (
                  <div className="el-social-section-label" style={{ marginTop: 12 }}>طلبات مُرسَلة ⏳</div>
                )}
                {friends.pending_out.map(f => (
                  <div key={f.friendship_id} className="el-social-friend-row muted">
                    <Avatar name={f.name} size={36} />
                    <div className="el-social-friend-info">
                      <div className="el-social-friend-name">{f.name}</div>
                      <div className="el-social-friend-sub">في انتظار القبول...</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── GROUPS TAB ── */}
            {tab === 'groups' && (
              <>
                <button className="el-social-new-group-btn" onClick={() => setShowNewGroup(v => !v)}>
                  ➕ مجموعة جديدة
                </button>
                {showNewGroup && (
                  <div className="el-social-new-group-form">
                    <input
                      className="el-social-search"
                      placeholder="اسم المجموعة..."
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createGroup()}
                    />
                    <button className="el-social-accept-btn" style={{ padding: '6px 14px' }} onClick={createGroup}>إنشاء</button>
                  </div>
                )}

                {groups.length === 0 && (
                  <div className="el-social-empty">
                    <div style={{ fontSize: '2.5rem' }}>📢</div>
                    <div>أنشئ مجموعة للدراسة مع أصدقائك!</div>
                  </div>
                )}

                {groups.map(g => (
                  <div
                    key={g.id}
                    className={`el-social-group-row${activeChat?.chat_id === g.chat_id ? ' active' : ''}`}
                    onClick={() => openChat(g.chat_id, g.name)}
                  >
                    <div className="el-social-group-icon">#{g.name[0]?.toUpperCase()}</div>
                    <div className="el-social-friend-info">
                      <div className="el-social-friend-name">{g.name}</div>
                      <div className="el-social-friend-sub">{g.members.length} عضو</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>

        {/* ── Chat area ── */}
        <main className="el-social-chat">
          {!activeChat ? (
            <div className="el-social-welcome">
              <div style={{ fontSize: '4rem' }}>💬</div>
              <h2>مرحباً في مجتمع AcadAI!</h2>
              <p>اختر صديقاً أو مجموعة من القائمة لتبدأ المحادثة</p>
              <div className="el-social-welcome-tips">
                <div className="el-social-tip">🔍 ابحث عن زملائك بالاسم أو الإيميل</div>
                <div className="el-social-tip">➕ أرسل طلب صداقة وابدأ المحادثة</div>
                <div className="el-social-tip">📢 أنشئ مجموعة للدراسة الجماعية</div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="el-social-chat-header">
                <button className="el-icon-btn" onClick={() => setActiveChat(null)}>←</button>
                <Avatar
                  name={activeChat.title}
                  size={36}
                  online={activeChat.chat_id.startsWith('dm_')
                    ? friends.accepted.find(f => {
                        const cid = `dm_${Math.min(user.id,f.id)}_${Math.max(user.id,f.id)}`
                        return cid === activeChat.chat_id
                      })?.online
                    : undefined}
                />
                <div>
                  <div className="el-social-chat-title">{activeChat.title}</div>
                  {activeChat.chat_id.startsWith('group_') && (() => {
                    const g = groups.find(x => x.chat_id === activeChat.chat_id)
                    return g ? <div className="el-social-chat-sub">{g.members.length} عضو</div> : null
                  })()}
                </div>

                {/* Group: add member panel */}
                {activeChat.chat_id.startsWith('group_') && (() => {
                  const g = groups.find(x => x.chat_id === activeChat.chat_id)
                  if (!g || g.creator_id !== user?.id) return null
                  return (
                    <div className="el-social-add-member" onClick={e => e.stopPropagation()}>
                      <input
                        className="el-social-search"
                        style={{ width: 160, fontSize: '.8rem', padding: '5px 10px' }}
                        placeholder="أضف عضو..."
                        value={addMemberInput}
                        onChange={e => searchAddMember(e.target.value)}
                      />
                      {addMemberRes.length > 0 && (
                        <div className="el-social-search-results" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50, width: 220 }}>
                          {addMemberRes.map(u => (
                            <div key={u.id} className="el-social-search-row">
                              <Avatar name={u.name} size={28} />
                              <div className="el-social-search-info" style={{ flex: 1 }}>
                                <div className="el-social-search-name">{u.name}</div>
                              </div>
                              <button className="el-social-add-btn"
                                onClick={() => addMemberToGroup(g.id, u.id, u.name)}>+</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Messages */}
              <div className="el-social-messages">
                {loadingMsgs && <div className="el-social-loading">جار التحميل...</div>}
                {!loadingMsgs && messages.length === 0 && (
                  <div className="el-social-empty" style={{ margin: 'auto' }}>
                    لا رسائل بعد — كن أول من يبدأ! 👋
                  </div>
                )}
                {messages.map((m, i) => {
                  const isMe = m.sender_id === user?.id
                  const showName = !isMe && (i === 0 || messages[i-1]?.sender_id !== m.sender_id)
                  return (
                    <div key={m.id} className={`el-social-msg${isMe ? ' mine' : ''}`}>
                      {!isMe && showName && (
                        <div className="el-social-msg-sender">{m.sender_name}</div>
                      )}
                      <div className="el-social-msg-bubble">
                        <span className="el-social-msg-text">{m.content}</span>
                        <TimeAgo iso={m.created_at} />
                      </div>
                    </div>
                  )
                })}
                <div ref={msgBottomRef} />
              </div>

              {/* Input */}
              <div className="el-social-input-row">
                <input
                  className="el-social-msg-input"
                  placeholder="اكتب رسالة..."
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                />
                <button
                  className="el-social-send-btn"
                  onClick={sendMsg}
                  disabled={sending || !msgInput.trim()}
                >
                  {sending ? '...' : '➤'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
