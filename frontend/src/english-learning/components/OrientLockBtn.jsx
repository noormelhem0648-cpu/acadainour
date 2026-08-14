import { useState, useEffect } from 'react'

const KEY = 'el_portrait_locked'

function applyLock(locked) {
  document.querySelectorAll('.el-app').forEach(el =>
    el.classList.toggle('el-portrait-locked', locked)
  )
}

export default function OrientLockBtn() {
  const [locked, setLocked] = useState(() => localStorage.getItem(KEY) === '1')

  // Apply saved preference on every mount (page navigation creates a new instance)
  useEffect(() => { applyLock(locked) }, [locked])

  const toggle = () => {
    const next = !locked
    setLocked(next)
    localStorage.setItem(KEY, next ? '1' : '0')
    applyLock(next)
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
