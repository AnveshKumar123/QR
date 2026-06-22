import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errors'

interface SignupForm {
  username: string
  phone_number: string
  password: string
}

export function SignupPage() {
  const { signup } = useAuth()
  const { showToast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignupForm>()

  const onSubmit = handleSubmit(async (values) => {
    try {
      await signup(values)
      showToast('Account created successfully', 'success')
    } catch (error) {
      setError('root', { message: getErrorMessage(error, 'Signup failed') })
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Phone numbers must start with +91.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username', { required: 'Username is required', minLength: 3 })}
        />
        <Input
          label="Phone number"
          placeholder="+91XXXXXXXXXX"
          autoComplete="tel"
          error={errors.phone_number?.message}
          {...register('phone_number', {
            required: 'Phone number is required',
            validate: (value) => {
              const cleaned = value.trim()
              if (!cleaned.startsWith('+91')) {
                return 'Phone number must start with +91'
              }
              const digits = cleaned.replace('+91', '').replace(/\D/g, '')
              if (digits.length !== 10) {
                return 'Phone number must have 10 digits after +91'
              }
              return true
            },
          })}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Minimum 6 characters' },
          })}
        />
        {errors.root ? <ErrorDisplay error={errors.root.message} title="Signup failed" /> : null}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        Already registered?{' '}
        <Link className="font-medium text-brand-600 hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  )
}
