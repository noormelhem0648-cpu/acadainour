import { useState } from 'react'

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

export default function OrientLockBtn() {
  const [show, setShow] = useState(false)
  return (
    <>
      <button className="el-icon-btn" title="قفل دوران الشاشة" onClick={() => setShow(true)}>
        🔄
      </button>
      {show && (
        <div className="el-orient-tip-overlay" onClick={() => setShow(false)}>
          <div className="el-orient-tip" onClick={e => e.stopPropagation()}>
            <div className="el-orient-tip-title">🔒 قفل دوران الشاشة</div>
            <div className="el-orient-tip-body">
              {isIOS ? (
                <div className="el-orient-tip-row">
                  🍎 <strong>آيفون / آيباد:</strong><br />
                  اسحب من الزاوية العلوية اليمنى لفتح Control Center
                  ← اضغط على رمز القفل الدائري
                </div>
              ) : (
                <div className="el-orient-tip-row">
                  🤖 <strong>أندرويد:</strong><br />
                  اسحب من أعلى الشاشة لفتح الإعدادات السريعة
                  ← اضغط على <strong>"تدوير تلقائي"</strong> لتفعيل أو إيقاف قفل الاتجاه
                </div>
              )}
            </div>
            <button
              className="el-nav-btn primary"
              style={{ marginTop: 12, width: '100%' }}
              onClick={() => setShow(false)}
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </>
  )
}
