import { useState, useEffect } from 'react'

const KEY = 'el_portrait_locked'
const PROPS = ['position', 'top', 'left', 'width', 'height', 'transformOrigin', 'transform', 'overflow', 'zIndex']

let _handler = null

function getApp() { return document.querySelector('.el-app') }

function applyPortraitLock() {
  const app = getApp()
  if (!app) return

  if (window.innerWidth <= window.innerHeight) {
    // Already portrait — remove any rotation
    PROPS.forEach(p => { app.style[p] = '' })
    return
  }

  const h = window.innerHeight   // landscape short side = portrait width
  const w = window.innerWidth    // landscape long side  = portrait height

  // Detect which side the phone was rotated toward.
  // screen.orientation.angle: 90 = CCW (right-side up), 270 = CW (left-side up)
  // window.orientation (iOS legacy): 90 = CCW, -90 = CW
  // eslint-disable-next-line no-restricted-globals
  const rawAngle = (screen.orientation?.angle ?? window.orientation) ?? 90
  const angle = ((rawAngle % 360) + 360) % 360   // normalise to 0-360
  const clockwise = angle === 270                 // left-side up

  Object.assign(app.style, {
    position: 'fixed',
    left: '0',
    width: h + 'px',
    height: w + 'px',
    transformOrigin: 'left top',
    overflow: 'hidden',
    zIndex: '9999',
  })

  if (clockwise) {
    // Phone rotated CW (left side up).
    // Portrait header must appear at screen RIGHT (user's visual top).
    // Math: rotate(90deg) translateY(-100%) from top:0 fills the viewport with
    // portrait-top at the right edge.
    app.style.top = '0'
    app.style.transform = 'rotate(90deg) translateY(-100%)'
  } else {
    // Phone rotated CCW (right side up) — the more common case.
    // Portrait header must appear at screen LEFT (user's visual top).
    // Math: rotate(-90deg) from top:H fills the viewport with
    // portrait-top at the left edge.
    app.style.top = h + 'px'
    app.style.transform = 'rotate(-90deg)'
  }
}

function startLock() {
  applyPortraitLock()
  if (!_handler) {
    _handler = (e) => {
      if (e?.type === 'orientationchange') {
        // iOS fires orientationchange before innerWidth/Height update — wait for it
        setTimeout(applyPortraitLock, 150)
      } else {
        // resize fires with updated dimensions already
        applyPortraitLock()
      }
    }
    window.addEventListener('resize', _handler)
    window.addEventListener('orientationchange', _handler)
  }
}

function stopLock() {
  const app = getApp()
  if (app) PROPS.forEach(p => { app.style[p] = '' })
  if (_handler) {
    window.removeEventListener('resize', _handler)
    window.removeEventListener('orientationchange', _handler)
    _handler = null
  }
}

export default function OrientLockBtn() {
  const [locked, setLocked] = useState(() => localStorage.getItem(KEY) === '1')

  useEffect(() => {
    // Runs on every mount (new page = new component instance = new .el-app in DOM)
    locked ? startLock() : stopLock()
  }, [locked])

  const toggle = () => {
    const next = !locked
    setLocked(next)
    localStorage.setItem(KEY, next ? '1' : '0')
  }

  return (
    <button
      className={'el-icon-btn' + (locked ? ' active' : '')}
      title={locked ? 'فتح التدوير' : 'قفل التدوير'}
      onClick={toggle}
    >
      {locked ? '🔒' : '🔓'}
    </button>
  )
}
