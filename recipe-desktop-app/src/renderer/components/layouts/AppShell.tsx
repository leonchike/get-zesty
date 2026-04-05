import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Toolbar } from './Toolbar'
import { useAuth } from '@/hooks/useAuth'
import { PageLoader } from '@/components/ui/loader'

export function AppShell(): JSX.Element {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  // Listen for menu-driven navigation
  useEffect(() => {
    const unsub = window.api.onNavigate((path) => {
      navigate(path)
    })
    return unsub
  }, [navigate])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="h-screen bg-background">
        <PageLoader />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <></>
  }

  return (
    <div className="flex h-screen bg-background bg-grain overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col ml-56">
        <Toolbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
