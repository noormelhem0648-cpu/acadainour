import { useState } from 'react'
import { createPortal } from 'react-dom'

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

export default function OrientLockBtn() {
  const [locked, setLocked] = useState(false)
  const [show, setShow] = useState(false)

  const toggle = () => {
    const next = !locked
    setLocked(next)
    if (next) setShow(true)   // show instructions only when locking
  }

  const overlay = show
    ? createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
            zIndex: 99999, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 24,
          }}
          onClick={() => setShow(false)}
        >
          <div
            style={{
              background: 'var(--el-bg2)', borderRadius: 16, padding: '24px 20px 20px',
              width: '100%', maxWidth: 340, border: '1.5px solid var(--el-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,.25)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--el-accent)', marginBottom: 14, direction: 'rtl' }}>
              🔒 قفل دوران الشاشة
            </div>
            <div style={{ direction: 'rtl', lineHeight: 1.7, fontSize: '.9rem', color: 'var(--el-text)' }}>
              {isIOS ? (
                <>
                  🍎 <strong>آيفون / آيباد:</strong><br />
                  اسحب من الزاوية العلوية اليمنى ← Control Center<br />
                  ← اضغط على رمز القفل الدائري
                </>
              ) : (
                <>
                  🤖 <strong>أندرويد:</strong><br />
                  اسحب من أعلى الشاشة لفتح الإعدادات السريعة<br />
                  ← اضغط على <strong>"تدوير تلقائي"</strong> لإيقافه
                </>
              )}
            </div>
            <button
              className="el-nav-btn primary"
              style={{ marginTop: 16, width: '100%' }}
              onClick={() => setShow(false)}
            >
              حسناً
            </button>
          </div>
        </div>,
        document.body
      )
    : null

  return (
    <>
      <button
        className={'el-icon-btn' + (locked ? ' active' : '')}
        title={locked ? 'فتح التدوير' : 'قفل التدوير'}
        onClick={toggle}
      >
        {locked ? '🔒' : '🔓'}
      </button>
      {overlay}
    </>
  )
}
