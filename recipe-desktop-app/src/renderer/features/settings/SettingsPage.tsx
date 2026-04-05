import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, LogOut, Trash2, Sun, Moon, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader } from '@/components/ui/loader'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import api from '@/services/api'
import { ENDPOINTS } from '@/services/endpoints'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email()
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export function SettingsPage(): JSX.Element {
  const navigate = useNavigate()
  const { user, logout, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance'>('profile')

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'security' as const, label: 'Security', icon: Lock },
    { id: 'appearance' as const, label: 'Appearance', icon: Sun }
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="font-heading text-2xl font-bold">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors flex-1 justify-center',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-warm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'profile' && <ProfileSection user={user} onRefresh={refreshUser} />}
      {activeTab === 'security' && (
        <SecuritySection onLogout={() => logout().then(() => navigate('/login'))} />
      )}
      {activeTab === 'appearance' && <AppearanceSection theme={theme} setTheme={setTheme} />}
    </div>
  )
}

function ProfileSection({
  user,
  onRefresh
}: {
  user: ReturnType<typeof useAuth>['user']
  onRefresh: () => Promise<void>
}): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  })

  const onSubmit = async (values: ProfileFormValues): Promise<void> => {
    try {
      await api.patch(ENDPOINTS.UPDATE_PROFILE, { data: values })
      await onRefresh()
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-lg p-6 space-y-5">
      <h2 className="font-heading text-lg font-semibold">Profile</h2>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...register('name')} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input {...register('email')} disabled className="opacity-60" />
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader size={14} className="text-white" /> : 'Save'}
      </Button>
    </form>
  )
}

function SecuritySection({ onLogout }: { onLogout: () => void }): JSX.Element {
  const [showDeactivate, setShowDeactivate] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
  })

  const onSubmit = async (values: PasswordFormValues): Promise<void> => {
    try {
      await api.patch(ENDPOINTS.UPDATE_PASSWORD, {
        data: {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        }
      })
      toast.success('Password updated')
      reset()
    } catch {
      toast.error('Failed to update password. Check your current password.')
    }
  }

  const handleDeactivate = async (): Promise<void> => {
    try {
      await api.post(ENDPOINTS.DEACTIVATE_ACCOUNT)
      toast.success('Account deactivated')
      onLogout()
    } catch {
      toast.error('Failed to deactivate account')
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-lg p-6 space-y-5">
        <h2 className="font-heading text-lg font-semibold">Change Password</h2>
        <div className="space-y-2">
          <Label>Current Password</Label>
          <Input type="password" {...register('currentPassword')} />
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input type="password" {...register('newPassword')} />
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Confirm New Password</Label>
          <Input type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader size={14} className="text-white" /> : 'Update Password'}
        </Button>
      </form>

      {/* Sign out & deactivate */}
      <div className="glass rounded-lg p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold">Account</h2>
        <Button variant="outline" onClick={onLogout} className="w-full gap-2">
          <LogOut size={16} />
          Sign Out
        </Button>
        <div>
          {showDeactivate ? (
            <div className="space-y-3 rounded-lg bg-destructive/5 p-4">
              <p className="text-sm text-destructive font-medium">
                This will permanently deactivate your account.
              </p>
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDeactivate}>
                  Confirm Deactivate
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeactivate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 gap-2"
              onClick={() => setShowDeactivate(true)}
            >
              <Trash2 size={16} />
              Deactivate Account
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function AppearanceSection({
  theme,
  setTheme
}: {
  theme: string
  setTheme: (t: 'light' | 'dark' | 'system') => void
}): JSX.Element {
  const themes = [
    { id: 'light' as const, label: 'Light', icon: Sun },
    { id: 'dark' as const, label: 'Dark', icon: Moon },
    { id: 'system' as const, label: 'System', icon: Monitor }
  ]

  return (
    <div className="glass rounded-lg p-6 space-y-4">
      <h2 className="font-heading text-lg font-semibold">Appearance</h2>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
              theme === t.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            )}
          >
            <t.icon size={24} className={theme === t.id ? 'text-primary' : 'text-muted-foreground'} />
            <span className="text-sm font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
