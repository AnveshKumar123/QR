import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errors'

interface LoginForm {
  username: string
  password: string
}

export function LoginPage() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>()

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.username, values.password)
      showToast('Welcome back!', 'success')
    } catch (error) {
      setError('root', { message: getErrorMessage(error, 'Login failed') })
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Use your username or phone number (+91…).
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="Username or phone"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username', { required: 'Username is required' })}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />
        {errors.root ? <ErrorDisplay error={errors.root.message} title="Login failed" /> : null}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        No account?{' '}
        <Link className="font-medium text-brand-600 hover:underline" to="/signup">
          Create one
        </Link>
      </p>
    </div>
  )
}
