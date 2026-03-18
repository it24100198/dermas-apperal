import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import toast from 'react-hot-toast'
import authService from '../../services/authService'
import { setCredentials } from '../../store/slices/authSlice'
import { registerSchema } from '../../utils/validators'
import { USER_ROLES, ROLE_LABELS } from '../../utils/constants'
import heroImage from '../../assets/login-bg.png'
import dermasLogo from '../../assets/dermas-logo.png'
import { getErrorMessage } from '../../utils/helpers'

const DEPARTMENTS = [
  'Sales',
  'Marketing',
  'Operations',
  'Finance',
  'HR',
  'IT',
  'Customer Service'
]

const ROLE_OPTIONS = [
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGER,
  USER_ROLES.HR,
  USER_ROLES.ACCOUNTANT,
  USER_ROLES.EMPLOYEE
]

const Register = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      role: USER_ROLES.EMPLOYEE
    }
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      const { confirmPassword: _confirmPassword, phone: _phone, firstName, lastName, ...payload } = data
      // Combine firstName and lastName into name
      payload.name = `${firstName} ${lastName}`.trim()
      const response = await authService.register(payload)
      dispatch(setCredentials(response))
      toast.success('Registration successful!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed'))
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

          <div className="mt-8">
            <h1 className="font-display text-4xl text-brand-navy">Create your account</h1>
            <p className="mt-2 text-slate-600">Join us to manage expenses and operations.</p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="label">First Name</label>
                <input
                  {...register('firstName')}
                  id="firstName"
                  type="text"
                  className="input-field"
                  placeholder="First name"
                />
                {errors.firstName ? <p className="mt-1 text-sm text-rose-600">{errors.firstName.message}</p> : null}
              </div>

              <div>
                <label htmlFor="lastName" className="label">Last Name</label>
                <input
                  {...register('lastName')}
                  id="lastName"
                  type="text"
                  className="input-field"
                  placeholder="Last name"
                />
                {errors.lastName ? <p className="mt-1 text-sm text-rose-600">{errors.lastName.message}</p> : null}
              </div>
            </div>

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
              <label htmlFor="phone" className="label">Phone</label>
              <input
                {...register('phone')}
                id="phone"
                type="tel"
                className="input-field"
                placeholder="Your phone number"
              />
              {errors.phone ? <p className="mt-1 text-sm text-rose-600">{errors.phone.message}</p> : null}
            </div>

            <div>
              <label htmlFor="department" className="label">Department</label>
              <select
                {...register('department')}
                id="department"
                className="input-field"
              >
                <option value="">Select a department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department ? <p className="mt-1 text-sm text-rose-600">{errors.department.message}</p> : null}
            </div>

            <div>
              <label htmlFor="role" className="label">User Role</label>
              <select
                {...register('role')}
                id="role"
                className="input-field"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
              {errors.role ? <p className="mt-1 text-sm text-rose-600">{errors.role.message}</p> : null}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="new-password"
                className="input-field"
                placeholder="At least 6 characters"
              />
              {errors.password ? <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p> : null}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm Password</label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="input-field"
                placeholder="Confirm your password"
              />
              {errors.confirmPassword ? <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p> : null}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="text-sm text-center text-slate-500 pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-orange font-semibold hover:underline">
                Sign In
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

export default Register
