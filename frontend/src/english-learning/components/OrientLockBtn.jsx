import { useState, useEffect } from 'react'

const KEY = 'el_portrait_locked'
const PROPS = ['position', 'top', 'left', 'width', 'height', 'transformOrigin', 'transform', 'overflow', 'zIndex']

let _handler = null

function getApp() { return document.querySelector('.el-app') }

function applyPortraitLock() {
  const app = getApp()
  if (!app) return
  if (window.innerWidth > window.innerHeight) {
    // Device is landscape — rotate content -90deg so it appears portrait
    const h = window.innerHeight
    const w = window.innerWidth
    Object.assign(app.style, {
      position: 'fixed',
      top: h + 'px',
      left: '0',
      width: h + 'px',
      height: w + 'px',
      transformOrigin: 'left top',
      transform: 'rotate(-90deg)',
      overflow: 'hidden',
      zIndex: '9999',
    })
  } else {
    // Device is already portrait — clear rotation styles
    PROPS.forEach(p => { app.style[p] = '' })
  }
}

function startLock() {
  applyPortraitLock()
  if (!_handler) {
    _handler = () => setTimeout(applyPortraitLock, 50)
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

  // Re-apply on every mount (navigation creates a new component instance and new .el-app)
  useEffect(() => {
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
