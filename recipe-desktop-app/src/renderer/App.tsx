import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { LazyMotion, domAnimation } from 'framer-motion'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/hooks/useTheme'
import { AppShell } from '@/components/layouts/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { HomePage } from '@/features/recipes/HomePage'
import { RecipeDetailPage } from '@/features/recipes/RecipeDetailPage'
import { RecipeFormPage } from '@/features/recipes/RecipeFormPage'
import { GroceriesPage } from '@/features/groceries/GroceriesPage'
import { CookbooksPage } from '@/features/cookbooks/CookbooksPage'
import { CookbookDetailPage } from '@/features/cookbooks/CookbookDetailPage'
import { CookingPage } from '@/features/cooking/CookingPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { TimerTickProvider } from '@/hooks/useTimerTick'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: true
    }
  }
})

export default function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domAnimation}>
        <ThemeProvider>
          <AuthProvider>
            <HashRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Full-screen immersive route (no shell) */}
                <Route path="/cooking/:id" element={<CookingPage />} />

                {/* Protected routes inside AppShell */}
                <Route element={<AppShell />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/recipes/create" element={<RecipeFormPage />} />
                  <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                  <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
                  <Route path="/groceries" element={<GroceriesPage />} />
                  <Route path="/cookbooks" element={<CookbooksPage />} />
                  <Route path="/cookbooks/:id" element={<CookbookDetailPage />} />
                  <Route path="/cookbooks/:id/recipes/:recipeId" element={<CookbookDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Routes>
            </HashRouter>
            <TimerTickProvider />
            <Toaster position="bottom-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </LazyMotion>
    </QueryClientProvider>
  )
}
