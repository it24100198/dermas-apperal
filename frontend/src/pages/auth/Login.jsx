import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import toast from 'react-hot-toast'
import authService from '../../services/authService'
import { setCredentials } from '../../store/slices/authSlice'
import { loginSchema } from '../../utils/validators'
import heroImage from '../../assets/login-bg.png'
import dermasLogo from '../../assets/dermas-logo.png'
import { getErrorMessage } from '../../utils/helpers'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(loginSchema)
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      console.log('Attempting login with:', data.email)
      const payload = await authService.login(data.email, data.password)
      console.log('Login response:', payload)
      dispatch(setCredentials(payload))
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = getErrorMessage(error, 'Login failed')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-sand via-brand-sand to-white flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl bg-white/85 border border-slate-200 shadow-xl rounded-2xl overflow-hidden grid lg:grid-cols-2">
        <section className="p-8 md:p-12">
          <div className="flex items-center gap-3">
            <img src={dermasLogo} alt="Dermas Logo" className="w-12 h-12" />
            <p className="font-display text-brand-navy text-2xl font-bold">DERMAS APPAREL</p>
          </div>
          <p className="text-slate-500 text-sm mt-2">Expense and Employee ERP</p>

          <div className="mt-12">
            <h1 className="font-display text-4xl text-brand-navy">Login to your account</h1>
            <p className="mt-2 text-slate-600">Sign in to continue managing operations.</p>
          </div>

          <form className="mt-10 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
              />
              {errors.email ? <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="current-password"
                className="input-field"
                placeholder="Enter password"
              />
              {errors.password ? <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p> : null}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-sm text-center text-slate-500">
              <Link to="/forgot-password" className="text-brand-orange font-semibold hover:underline">
                Forgot your password?
              </Link>
            </div>

            <div className="text-sm text-center text-slate-500 pt-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-orange font-semibold hover:underline">
                Register
              </Link>
            </div>
          </form>
        </section>

        <section className="hidden lg:flex items-center justify-center bg-slate-50">
          <img src={heroImage} alt="Factory management" className="w-full h-full object-cover" />
        </section>
      </div>
    </div>
  )
}

export default Login
