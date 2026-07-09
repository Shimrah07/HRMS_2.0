import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import queryClient from './lib/queryClient'
import router from './router'

export default function App() {
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (
        e.key === 'Enter' &&
        e.target.tagName === 'INPUT' &&
        e.target.type !== 'submit' &&
        e.target.type !== 'button'
      ) {
        const form = e.target.closest('form')
        if (form) {
          const isLoginForm = window.location.pathname.startsWith('/login')
          const isSearch = 
            e.target.type === 'search' || 
            e.target.placeholder?.toLowerCase().includes('search') ||
            e.target.id?.toLowerCase().includes('search') ||
            e.target.classList.contains('allow-enter') ||
            e.target.getAttribute('data-allow-enter') === 'true'
            
          if (!isLoginForm && !isSearch) {
            // Do not block selection search input in Ant Design select dropdowns
            const isSelectDropdown = e.target.closest('.ant-select')
            if (!isSelectDropdown) {
              e.preventDefault()
            }
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
