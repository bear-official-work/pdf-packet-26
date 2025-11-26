import { useEffect } from 'react'

interface ThemeProviderProps {
  darkMode: boolean
  children: React.ReactNode
}

export default function ThemeProvider({ darkMode, children }: ThemeProviderProps) {
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return <>{children}</>
}
