import { useCallback } from 'react'
import { toast as globalToast } from '@/components/ui/toaster'

/**
 * useToast — hook tipis yang delegate ke fungsi toast global di toaster.jsx.
 * Dengan begini, semua component yang pakai useToast() akan tampil di Toaster
 * yang di-mount di App.jsx.
 */
export function useToast() {
  const toast = useCallback((args) => globalToast(args), [])
  return { toast }
}

// Re-export untuk kompatibilitas (kalau ada yang import langsung)
export { toast } from '@/components/ui/toaster'
