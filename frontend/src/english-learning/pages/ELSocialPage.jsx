import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../../config'
import '../EL.css'

const EL = '/english-learning'
const WS_BASE = API_BASE.replace(/^https?/, s => s === 'https' ? 'wss' : 'ws')
const STUN = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

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

function TimeAgo({ iso }) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return <span className="el-social-time">الآن</span>
  if (diff < 3600) return <span className="el-social-time">{Math.floor(diff/60)} د</span>
  if (diff < 86400) return <span className="el-social-time">{Math.floor(diff/3600)} س</span>
  return <span className="el-social-time">{d.toLocaleDateString('ar')}</span>
}

const LEVELS = ['a1','a2','b1','b2','c1','c2']

// ── Main component ────────────────────────────────────────────────
export default function ELSocialPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const { user, token } = useAuth()

  const [tab, setTab]         = useState('friends')
  const [friends, setFriends] = useState({ accepted: [], pending_in: [], pending_out: [] })
  const [groups, setGroups]   = useState([])
  const [challenges, setChallenges] = useState([])
  const [search, setSearch]   = useState('')
  const [searchRes, setSearchRes] = useState([])
  const [searching, setSearching] = useState(false)

  const [activeChat, setActiveChat]     = useState(null)
  const [messages, setMessages]         = useState([])
  const [msgInput, setMsgInput]         = useState('')
  const [sending, setSending]           = useState(false)
  const [loadingMsgs, setLoadingMsgs]   = useState(false)

  const [newGroupName, setNewGroupName]   = useState('')
  const [showNewGroup, setShowNewGroup]   = useState(false)
  const [addMemberInput, setAddMemberInput] = useState('')
  const [addMemberRes, setAddMemberRes]   = useState([])

  // Challenge state
  const [showNewChallenge, setShowNewChallenge] = useState(false)
  const [challengeName, setChallengeName]       = useState('')
  const [challengeLevel, setChallengeLevel]     = useState('a2')
  const [challengeDeadline, setChallengeDeadline] = useState('')
  const [challengeInviteInput, setChallengeInviteInput] = useState('')
  const [challengeInviteRes, setChallengeInviteRes]     = useState([])
  const [editingProgress, setEditingProgress]   = useState(null) // challenge id

  // Voice message state
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  // WebRTC call state
  const [onlineIds, setOnlineIds] = useState(new Set())   // IDs of currently online friends

  const [incomingCall, setIncomingCall] = useState(null)  // { from_id, from_name, offer, callType }
  const [activeCall, setActiveCall]     = useState(null)  // { peer_id, peer_name, callType }
  const peerConnRef   = useRef(null)
  const localStreamRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localVideoRef  = useRef(null)
  const [callMuted, setCallMuted]   = useState(false)
  const [camOff, setCamOff]         = useState(false)

  const [notif, setNotif] = useState(null)
  const [unread, setUnread] = useState({})   // { [chat_id]: count }

  const wsRef        = useRef(null)
  const msgBottomRef = useRef(null)
  const searchTimer  = useRef(null)
  const activeChatRef = useRef(null)

  const toast = (text, ok = true) => {
    setNotif({ text, ok })
    setTimeout(() => setNotif(null), 3500)
  }

  // ── Data loaders ──────────────────────────────────────────────
  const loadFriends = useCallback(async () => {
    if (!token) return
    try { setFriends(await api('GET', '/social/friends', token)) } catch {}
  }, [token])

  const loadGroups = useCallback(async () => {
    if (!token) return
    try { setGroups(await api('GET', '/social/groups', token)) } catch {}
  }, [token])

  const loadChallenges = useCallback(async () => {
    if (!token) return
    try { setChallenges(await api('GET', '/social/challenges', token)) } catch {}
  }, [token])

  useEffect(() => {
    loadFriends()
    loadGroups()
    loadChallenges()
  }, [loadFriends, loadGroups, loadChallenges])

  // ── WebRTC helpers ────────────────────────────────────────────
  const sendWS = useCallback((payload) => {
    const ws = wsRef.current
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload))
  }, [])

  const stopLocalStream = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
  }

  const closePeer = useCallback(() => {
    peerConnRef.current?.close()
    peerConnRef.current = null
    stopLocalStream()
    setActiveCall(null)
    setIncomingCall(null)
    setCallMuted(false)
    setCamOff(false)
  }, [])

  const createPeerConn = useCallback((peerId) => {
    const pc = new RTCPeerConnection(STUN)
    pc.onicecandidate = e => {
      if (e.candidate) {
        sendWS({ type: 'ice_candidate', target_id: peerId, candidate: e.candidate })
      }
    }
    pc.ontrack = e => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]
    }
    pc.onconnectionstatechange = () => {
      if (['disconnected','failed','closed'].includes(pc.connectionState)) closePeer()
    }
    peerConnRef.current = pc
    return pc
  }, [sendWS, closePeer])

  const startCall = useCallback(async (peerId, peerName, callType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true, video: callType === 'video',
      })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = createPeerConn(peerId)
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      sendWS({ type: 'call_offer', target_id: peerId, offer, callType })
      setActiveCall({ peer_id: peerId, peer_name: peerName, callType })
    } catch (err) {
      toast('تعذّر الوصول للميكروفون/الكاميرا', false)
    }
  }, [createPeerConn, sendWS])

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return
    try {
      const { from_id, from_name, offer, callType } = incomingCall
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true, video: callType === 'video',
      })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = createPeerConn(from_id)
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      sendWS({ type: 'call_answer', target_id: from_id, answer })
      setIncomingCall(null)
      setActiveCall({ peer_id: from_id, peer_name: from_name, callType })
    } catch (err) {
      toast('تعذّر قبول المكالمة', false)
      setIncomingCall(null)
    }
  }, [incomingCall, createPeerConn, sendWS])

  const rejectCall = useCallback(() => {
    if (!incomingCall) return
    sendWS({ type: 'call_reject', target_id: incomingCall.from_id })
    setIncomingCall(null)
  }, [incomingCall, sendWS])

  const endCall = useCallback(() => {
    if (activeCall) sendWS({ type: 'call_end', target_id: activeCall.peer_id })
    closePeer()
  }, [activeCall, sendWS, closePeer])

  // ── WebSocket ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !token) return
    const ws = new WebSocket(`${WS_BASE}/ws/social/${user.id}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {}

    ws.onmessage = e => {
      if (e.data === 'pong') return
      try {
        const data = JSON.parse(e.data)
        const { type } = data

        if (type === 'presence_snapshot') {
          console.log('[WS] presence_snapshot online_ids:', data.online_ids)
          setOnlineIds(new Set(data.online_ids))
        } else if (type === 'user_online') {
          console.log('[WS] user_online:', data.user_id)
          setOnlineIds(prev => new Set([...prev, data.user_id]))
        } else if (type === 'user_offline') {
          console.log('[WS] user_offline:', data.user_id)
          setOnlineIds(prev => { const s = new Set(prev); s.delete(data.user_id); return s })
        } else if (type === 'message') {
          if (activeChatRef.current?.chat_id === data.chat_id) {
            setMessages(prev => [...prev, data])
          } else {
            // increment unread count for that chat
            setUnread(prev => ({ ...prev, [data.chat_id]: (prev[data.chat_id] || 0) + 1 }))
            toast(`رسالة جديدة من ${data.sender_name}`, true)
          }
        } else if (type === 'friend_request') {
          toast(`طلب صداقة من ${data.from.name} 🙋`, true)
          loadFriends()
        } else if (type === 'friend_accepted') {
          toast(`${data.by.name} قبل طلب الصداقة ✅`, true)
          loadFriends()
        } else if (type === 'added_to_group') {
          toast(`تمت إضافتك لمجموعة "${data.group.name}" 👥`, true)
          loadGroups()
        } else if (type === 'challenge_invite') {
          toast(`دعوة تحدي: "${data.challenge.name}" من ${data.from.name} 🏆`, true)
          loadChallenges()
        } else if (type === 'call_offer') {
          // incoming call
          const fromId   = data.from_id
          const fromName = data.from_name || `مستخدم #${fromId}`
          setIncomingCall({ from_id: fromId, from_name: fromName, offer: data.offer, callType: data.callType || 'audio' })
        } else if (type === 'call_answer') {
          // our offer was answered
          const pc = peerConnRef.current
          if (pc) pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(() => {})
        } else if (type === 'ice_candidate') {
          const pc = peerConnRef.current
          if (pc && data.candidate) pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {})
        } else if (type === 'call_end' || type === 'call_reject') {
          closePeer()
          if (type === 'call_reject') toast('رفض المكالمة', false)
        }
      } catch {}
    }

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
    activeChatRef.current = { chat_id: chatId, title }
    setActiveChat({ chat_id: chatId, title })
    setUnread(prev => ({ ...prev, [chatId]: 0 }))
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

  // ── Send text message ─────────────────────────────────────────
  const sendMsg = async () => {
    if (!msgInput.trim() || !activeChat || sending) return
    setSending(true)
    try {
      const msg = await api('POST', '/social/messages', token, {
        chat_id: activeChat.chat_id,
        content: msgInput.trim(),
        msg_type: 'text',
      })
      setMessages(prev => [...prev, msg])
      setMsgInput('')
    } catch (err) { toast(err.message, false) }
    setSending(false)
  }

  // ── Voice recording ───────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordedChunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) recordedChunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        if (blob.size < 100 || !activeChat) return
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result
          try {
            const msg = await api('POST', '/social/messages', token, {
              chat_id: activeChat.chat_id,
              content: '🎤 رسالة صوتية',
              msg_type: 'voice',
              voice_data: base64,
            })
            setMessages(prev => [...prev, msg])
          } catch (err) { toast(err.message, false) }
        }
        reader.readAsDataURL(blob)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setIsRecording(true)
    } catch {
      toast('تعذّر الوصول للميكروفون', false)
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
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
      setNewGroupName(''); setShowNewGroup(false); loadGroups()
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
      setAddMemberInput(''); setAddMemberRes([]); loadGroups()
    } catch (err) { toast(err.message, false) }
  }

  // ── Challenge actions ─────────────────────────────────────────
  const createChallenge = async () => {
    if (!challengeName.trim()) return
    try {
      await api('POST', '/social/challenges', token, {
        name: challengeName.trim(),
        goal_level: challengeLevel,
        deadline: challengeDeadline || null,
      })
      toast('تم إنشاء التحدي 🏆')
      setChallengeName(''); setChallengeDeadline(''); setShowNewChallenge(false)
      loadChallenges()
    } catch (err) { toast(err.message, false) }
  }

  const searchInvite = async q => {
    setChallengeInviteInput(q)
    if (!q.trim()) { setChallengeInviteRes([]); return }
    try {
      const res = await api('GET', `/social/search?q=${encodeURIComponent(q)}`, token)
      setChallengeInviteRes(res)
    } catch {}
  }

  const inviteToChallenge = async (cid, uid, name) => {
    try {
      await api('POST', `/social/challenges/${cid}/invite`, token, { user_id: uid })
      toast(`تمت دعوة ${name} للتحدي ✅`)
      setChallengeInviteInput(''); setChallengeInviteRes([])
    } catch (err) { toast(err.message, false) }
  }

  const saveProgress = async (cid, pct, share) => {
    try {
      await api('PUT', `/social/challenges/${cid}/progress`, token, {
        progress_pct: pct, share_progress: share,
      })
      toast('تم حفظ التقدم ✅')
      setEditingProgress(null); loadChallenges()
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

      {/* ── Incoming call overlay ── */}
      {incomingCall && !activeCall && (
        <div className="el-call-overlay incoming">
          <div className="el-call-card">
            <div className="el-call-ring">📲</div>
            <div className="el-call-name">{incomingCall.from_name}</div>
            <div className="el-call-type">{incomingCall.callType === 'video' ? 'مكالمة فيديو' : 'مكالمة صوتية'}</div>
            <div className="el-call-actions">
              <button className="el-call-reject" onClick={rejectCall}>✕ رفض</button>
              <button className="el-call-accept" onClick={acceptCall}>✔ قبول</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active call overlay ── */}
      {activeCall && (
        <div className="el-call-overlay active">
          {activeCall.callType === 'video' && (
            <video ref={remoteVideoRef} autoPlay playsInline className="el-call-remote-video" />
          )}
          <div className="el-call-info-bar">
            <span className="el-call-peer-name">{activeCall.peer_name}</span>
            <span className="el-call-duration-badge">
              {activeCall.callType === 'video' ? '📹' : '📞'} متصل
            </span>
          </div>
          {activeCall.callType === 'video' && (
            <video ref={localVideoRef} autoPlay playsInline muted className="el-call-local-video" />
          )}
          <div className="el-call-controls">
            <button
              className={`el-call-ctrl${callMuted ? ' off' : ''}`}
              onClick={() => {
                const enabled = !callMuted
                localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = enabled })
                setCallMuted(!callMuted)
              }}
            >{callMuted ? '🔇' : '🎙️'}</button>
            {activeCall.callType === 'video' && (
              <button
                className={`el-call-ctrl${camOff ? ' off' : ''}`}
                onClick={() => {
                  const enabled = !camOff
                  localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = enabled })
                  setCamOff(!camOff)
                }}
              >{camOff ? '📷' : '🎥'}</button>
            )}
            <button className="el-call-ctrl end" onClick={endCall}>📵 إنهاء</button>
          </div>
        </div>
      )}

      <div className={`el-social-layout${activeChat ? ' chat-open' : ''}`}>
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
              👥
              {friends.pending_in.length > 0 && (
                <span className="el-social-badge red">{friends.pending_in.length}</span>
              )}
            </button>
            <button className={`el-social-tab${tab === 'groups' ? ' active' : ''}`} onClick={() => setTab('groups')}>
              📢
            </button>
            <button className={`el-social-tab${tab === 'challenges' ? ' active' : ''}`} onClick={() => setTab('challenges')}>
              🏆
            </button>
          </div>

          <div className="el-social-list">
            {/* ── FRIENDS TAB ── */}
            {tab === 'friends' && (
              <>
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
                  const cnt = unread[chatId] || 0
                  return (
                    <div
                      key={f.friendship_id}
                      className={`el-social-friend-row${activeChat?.chat_id === chatId ? ' active' : ''}`}
                      onClick={() => openChat(chatId, f.name)}
                    >
                      <Avatar name={f.name} size={36} online={onlineIds.has(f.id)} />
                      <div className="el-social-friend-info">
                        <div className="el-social-friend-name">{f.name}</div>
                        <div className="el-social-friend-sub">{onlineIds.has(f.id) ? '🟢 متصل' : '⚫ غير متصل'}</div>
                      </div>
                      {cnt > 0 && <span className="el-social-unread-badge">{cnt}</span>}
                      <button
                        className="el-social-remove-btn"
                        title="إزالة"
                        onClick={e => { e.stopPropagation(); removeFriend(f.friendship_id) }}
                      >✕</button>
                    </div>
                  )
                })}

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
                {groups.map(g => {
                  const gcnt = unread[g.chat_id] || 0
                  return (
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
                      {gcnt > 0 && <span className="el-social-unread-badge">{gcnt}</span>}
                    </div>
                  )
                })}
              </>
            )}

            {/* ── CHALLENGES TAB ── */}
            {tab === 'challenges' && (
              <>
                <button className="el-social-new-group-btn" onClick={() => setShowNewChallenge(v => !v)}>
                  ➕ تحدي جديد
                </button>
                {showNewChallenge && (
                  <div className="el-challenge-create-form">
                    <input
                      className="el-social-search"
                      placeholder="اسم التحدي..."
                      value={challengeName}
                      onChange={e => setChallengeName(e.target.value)}
                    />
                    <div className="el-challenge-level-row">
                      {LEVELS.map(l => (
                        <button
                          key={l}
                          className={`el-challenge-level-btn${challengeLevel === l ? ' active' : ''}`}
                          onClick={() => setChallengeLevel(l)}
                        >{l.toUpperCase()}</button>
                      ))}
                    </div>
                    <input
                      type="date"
                      className="el-social-search"
                      style={{ fontSize: '.8rem' }}
                      value={challengeDeadline}
                      onChange={e => setChallengeDeadline(e.target.value)}
                    />
                    <button className="el-social-accept-btn" style={{ padding: '6px 14px' }} onClick={createChallenge}>
                      إنشاء التحدي 🏆
                    </button>
                  </div>
                )}
                {challenges.length === 0 && !showNewChallenge && (
                  <div className="el-social-empty">
                    <div style={{ fontSize: '2.5rem' }}>🏆</div>
                    <div>تحدَّ أصدقاءك للوصول لمستوى معين!</div>
                  </div>
                )}
                {challenges.map(c => {
                  const ccnt = unread[c.chat_id] || 0
                  return (
                    <div
                      key={c.id}
                      className={`el-social-group-row${activeChat?.chat_id === c.chat_id ? ' active' : ''}`}
                      onClick={() => openChat(c.chat_id, `🏆 ${c.name}`)}
                    >
                      <div className="el-challenge-badge">{c.goal_level.toUpperCase()}</div>
                      <div className="el-social-friend-info">
                        <div className="el-social-friend-name">{c.name}</div>
                        <div className="el-social-friend-sub">{c.participants.length} مشارك • {c.my_progress}%</div>
                      </div>
                      {ccnt > 0 && <span className="el-social-unread-badge">{ccnt}</span>}
                    </div>
                  )
                })}
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
              <p>اختر صديقاً أو مجموعة أو تحدياً للبدء</p>
              <div className="el-social-welcome-tips">
                <div className="el-social-tip">🔍 ابحث عن زملائك بالاسم أو الإيميل</div>
                <div className="el-social-tip">➕ أرسل طلب صداقة وابدأ المحادثة</div>
                <div className="el-social-tip">🏆 أنشئ تحدياً وادعُ أصدقاءك</div>
                <div className="el-social-tip">🎤 أرسل رسائل صوتية بزر الميكروفون</div>
                <div className="el-social-tip">📹 ابدأ مكالمة فيديو أو صوت من زر المكالمة</div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="el-social-chat-header">
                <button className="el-icon-btn" onClick={() => { activeChatRef.current = null; setActiveChat(null) }}>←</button>
                <Avatar
                  name={activeChat.title}
                  size={36}
                  online={activeChat.chat_id.startsWith('dm_')
                    ? (() => {
                        const f = friends.accepted.find(f => {
                          const cid = `dm_${Math.min(user.id,f.id)}_${Math.max(user.id,f.id)}`
                          return cid === activeChat.chat_id
                        })
                        return f ? onlineIds.has(f.id) : undefined
                      })()
                    : undefined}
                />
                <div style={{ flex: 1 }}>
                  <div className="el-social-chat-title">{activeChat.title}</div>
                  {activeChat.chat_id.startsWith('group_') && (() => {
                    const g = groups.find(x => x.chat_id === activeChat.chat_id)
                    return g ? <div className="el-social-chat-sub">{g.members.length} عضو</div> : null
                  })()}
                  {activeChat.chat_id.startsWith('challenge_') && (() => {
                    const c = challenges.find(x => x.chat_id === activeChat.chat_id)
                    return c ? <div className="el-social-chat-sub">الهدف: {c.goal_level.toUpperCase()} • {c.participants.length} مشارك</div> : null
                  })()}
                </div>

                {/* DM: call buttons */}
                {activeChat.chat_id.startsWith('dm_') && (() => {
                  const f = friends.accepted.find(f => {
                    const cid = `dm_${Math.min(user.id,f.id)}_${Math.max(user.id,f.id)}`
                    return cid === activeChat.chat_id
                  })
                  if (!f) return null
                  return (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="el-icon-btn" title="مكالمة صوتية"
                        onClick={() => startCall(f.id, f.name, 'audio')}>📞</button>
                      <button className="el-icon-btn" title="مكالمة فيديو"
                        onClick={() => startCall(f.id, f.name, 'video')}>📹</button>
                    </div>
                  )
                })()}

                {/* Group: add member */}
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

                {/* Challenge: progress + invite */}
                {activeChat.chat_id.startsWith('challenge_') && (() => {
                  const c = challenges.find(x => x.chat_id === activeChat.chat_id)
                  if (!c) return null
                  return (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button className="el-icon-btn" title="تحديث تقدمي"
                        onClick={() => setEditingProgress(c.id === editingProgress ? null : c.id)}>📊</button>
                      {c.creator_id === user?.id && (
                        <button className="el-icon-btn" title="دعوة صديق"
                          onClick={e => { e.stopPropagation(); setChallengeInviteInput('★'); setChallengeInviteRes([]) }}>➕</button>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Challenge: progress editor panel */}
              {activeChat.chat_id.startsWith('challenge_') && editingProgress !== null && (() => {
                const c = challenges.find(x => x.chat_id === activeChat.chat_id)
                if (!c || c.id !== editingProgress) return null
                return (
                  <ProgressPanel
                    challenge={c}
                    onSave={(pct, share) => saveProgress(c.id, pct, share)}
                    onClose={() => setEditingProgress(null)}
                  />
                )
              })()}

              {/* Challenge: participants progress bar */}
              {activeChat.chat_id.startsWith('challenge_') && (() => {
                const c = challenges.find(x => x.chat_id === activeChat.chat_id)
                if (!c) return null
                const visible = c.participants.filter(p => p.progress_pct !== undefined)
                if (visible.length === 0) return null
                return (
                  <div className="el-challenge-progress-panel">
                    {visible.map(p => (
                      <div key={p.user_id} className="el-challenge-progress-row">
                        <span className="el-challenge-progress-name">{p.name}</span>
                        <div className="el-challenge-progress-bar-wrap">
                          <div className="el-challenge-progress-fill" style={{ width: `${p.progress_pct}%` }} />
                        </div>
                        <span className="el-challenge-progress-pct">{p.progress_pct}%</span>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Challenge: invite search */}
              {activeChat.chat_id.startsWith('challenge_') && challengeInviteInput && (() => {
                const c = challenges.find(x => x.chat_id === activeChat.chat_id)
                if (!c || c.creator_id !== user?.id) return null
                return (
                  <div className="el-challenge-invite-panel">
                    <input
                      className="el-social-search"
                      placeholder="ابحث عن صديق للدعوة..."
                      value={challengeInviteInput === '★' ? '' : challengeInviteInput}
                      onChange={e => searchInvite(e.target.value)}
                      autoFocus
                    />
                    {challengeInviteRes.map(u => (
                      <div key={u.id} className="el-social-search-row">
                        <Avatar name={u.name} size={28} />
                        <div className="el-social-search-info" style={{ flex: 1 }}>
                          <div className="el-social-search-name">{u.name}</div>
                        </div>
                        <button className="el-social-add-btn"
                          onClick={() => inviteToChallenge(c.id, u.id, u.name)}>دعوة</button>
                      </div>
                    ))}
                    <button style={{ fontSize: '.75rem', color: 'var(--el-muted)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                      onClick={() => { setChallengeInviteInput(''); setChallengeInviteRes([]) }}>إغلاق ✕</button>
                  </div>
                )
              })()}

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
                        {m.msg_type === 'voice' && m.voice_data ? (
                          <audio controls src={m.voice_data} style={{ maxWidth: 220, height: 36 }} />
                        ) : (
                          <span className="el-social-msg-text">{m.content}</span>
                        )}
                        <TimeAgo iso={m.created_at} />
                      </div>
                    </div>
                  )
                })}
                <div ref={msgBottomRef} />
              </div>

              {/* Input */}
              <div className="el-social-input-row">
                <button
                  className={`el-social-voice-btn${isRecording ? ' recording' : ''}`}
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  title={isRecording ? 'ارفع للإرسال' : 'اضغط مع الإمساك للتسجيل'}
                >{isRecording ? '⏹' : '🎤'}</button>
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

// ── Progress editor sub-component ────────────────────────────────
function ProgressPanel({ challenge, onSave, onClose }) {
  const [pct, setPct] = useState(challenge.my_progress || 0)
  const [share, setShare] = useState(challenge.my_share || false)
  return (
    <div className="el-challenge-edit-panel">
      <div className="el-challenge-edit-title">📊 تحديث تقدمي في التحدي</div>
      <div className="el-challenge-edit-row">
        <span style={{ minWidth: 36 }}>{pct}%</span>
        <input type="range" min={0} max={100} value={pct}
          onChange={e => setPct(Number(e.target.value))} style={{ flex: 1 }} />
      </div>
      <label className="el-challenge-share-toggle">
        <input type="checkbox" checked={share} onChange={e => setShare(e.target.checked)} />
        <span>السماح للمشاركين برؤية تقدمي</span>
      </label>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="el-social-accept-btn" onClick={() => onSave(pct, share)}>حفظ</button>
        <button className="el-social-reject-btn" onClick={onClose}>إلغاء</button>
      </div>
    </div>
  )
}
