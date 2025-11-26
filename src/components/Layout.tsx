import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { SunIcon, MoonIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils'

interface LayoutProps {
  children: React.ReactNode
  darkMode: boolean
  onToggleDarkMode: () => void
  onReset: () => void
}

export default function Layout({ 
  children,
  darkMode, 
  onToggleDarkMode,
  onReset 
}: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminPage = location.pathname === '/admin'
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30 dark:opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-accent-50/50 dark:from-primary-900/20 dark:to-accent-900/20" />
      </div>

      {/* Floating particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary-400/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end">
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              {/* Admin Button (only show on main page) */}
              {!isAdminPage && (
                <button
                  onClick={() => navigate('/admin')}
                  className={cn(
                    "btn btn-ghost btn-sm",
                    "hidden sm:flex",
                    "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                  )}
                  title="Admin Panel"
                >
                  <Cog6ToothIcon className="w-4 h-4 mr-2" />
                  Admin
                </button>
              )}
              
              {/* Reset Button */}
              {!isAdminPage && (
                <button
                  onClick={onReset}
                  className={cn(
                    "btn btn-ghost btn-sm",
                    "hidden sm:flex",
                    "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  )}
                  title="Reset Application"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Reset
                </button>
              )}

              {/* Theme Toggle */}
              <button
                onClick={onToggleDarkMode}
                className="btn btn-ghost btn-sm p-2"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: darkMode ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {darkMode ? (
                    <SunIcon className="w-5 h-5" />
                  ) : (
                    <MoonIcon className="w-5 h-5" />
                  )}
                </motion.div>
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Mobile Reset Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        onClick={onReset}
        className={cn(
          "fixed bottom-20 left-6 z-50",
          "btn btn-secondary btn-sm",
          "sm:hidden",
          "shadow-lg hover:shadow-xl",
          "backdrop-blur-sm"
        )}
        title="Reset Application"
      >
        <ArrowPathIcon className="w-4 h-4" />
      </motion.button>
    </div>
  )
}
