import { useState, useCallback } from 'react'

let toastId = 0
const listeners = []

function dispatch(toast) {
  listeners.forEach(fn => fn(toast))
}

export function useToast() {
  const toast = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    dispatch({ id: ++toastId, title, description, variant, duration })
  }, [])

  return { toast }
}

export function useToastState() {
  const [toasts, setToasts] = useState([])

  useState(() => {
    const handler = (toast) => {
      setToasts(prev => [...prev, toast])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      }, toast.duration)
    }
    listeners.push(handler)
    return () => {
      const i = listeners.indexOf(handler)
      if (i > -1) listeners.splice(i, 1)
    }
  })

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return { toasts, dismiss }
}
