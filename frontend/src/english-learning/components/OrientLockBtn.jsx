import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

export default function OrientLockBtn() {
  const [locked, setLocked] = useState(false)
  const [show, setShow] = useState(false)
  const [portal, setPortal] = useState(null)
  const btnRef = useRef(null)

  useEffect(() => {
    // Render inside .el-app so CSS variables and scoped selectors work
    const el = btnRef.current?.closest('.el-app') || document.body
    setPortal(el)
  }, [])

  const toggle = () => {
    const next = !locked
    setLocked(next)
    if (next) setShow(true)
  }

  const overlay = show && portal
    ? createPortal(
        <div
          className="el-orient-overlay"
          onClick={() => setShow(false)}
        >
          <div
            className="el-orient-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="el-orient-title">🔒 قفل دوران الشاشة</div>
            <div className="el-orient-body">
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
            <button className="el-nav-btn primary" style={{ marginTop: 16, width: '100%' }} onClick={() => setShow(false)}>
              حسناً
            </button>
          </div>
        </div>,
        portal
      )
    : null

  return (
    <>
      <button
        ref={btnRef}
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
