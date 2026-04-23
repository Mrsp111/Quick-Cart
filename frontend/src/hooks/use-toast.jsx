import React from 'react'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

const toastTypes = {
  background: 'bg-background',
  foreground: 'text-foreground',
  card: 'bg-card',
  cardForeground: 'text-card-foreground',
  popover: 'bg-popover',
  popoverForeground: 'text-popover-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  muted: 'bg-muted text-muted-foreground',
  accent: 'bg-accent text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
}

const actionTypes = {
  link: 'text-primary underline-offset-4 hover:underline',
  button: 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
}

export function useToast() {
  const [toasts, setToasts] = React.useState([])

  const toast = React.useCallback(
    ({ title, description, type, action }) => {
      setToasts((current) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = {
          id,
          title,
          description,
          type: toastTypes[type] || toastTypes.primary,
          action: action && {
            ...action,
            className: actionTypes[action.type] || actionTypes.button,
          },
        }

        return [newToast, ...current].slice(0, TOAST_LIMIT)
      })
    },
    [setToasts]
  )

  const dismiss = React.useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}