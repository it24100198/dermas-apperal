import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import authService from '../../services/authService'
import { getErrorMessage } from '../../utils/helpers'

const schema = yup.object({
	email: yup.string().email('Please enter a valid email').required('Email is required')
})

const ForgotPassword = () => {
	const [loading, setLoading] = useState(false)
	const [resetToken, setResetToken] = useState('')

	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm({
		resolver: yupResolver(schema)
	})

	const submitHandler = async ({ email }) => {
		try {
			setLoading(true)
			const response = await authService.forgotPassword(email)
			if (response.resetToken) {
				setResetToken(response.resetToken)
			}
			toast.success('Password reset instructions sent')
		} catch (error) {
			toast.error(getErrorMessage(error, 'Unable to process request'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen grid place-items-center bg-shell p-4">
			<div className="w-full max-w-lg panel">
				<h1 className="text-3xl font-display text-brand-navy">Forgot Password</h1>
				<p className="text-slate-600 mt-2">Enter your email and we will generate a reset token.</p>

				<form onSubmit={handleSubmit(submitHandler)} className="mt-6 space-y-4">
					<div>
						<label htmlFor="email" className="label">Email</label>
						<input
							id="email"
							type="email"
							{...register('email')}
							className="input-field"
							placeholder="you@example.com"
						/>
						{errors.email ? <p className="mt-1 text-sm text-rose-600">{errors.email.message}</p> : null}
					</div>

					<button type="submit" className="btn-primary w-full" disabled={loading}>
						{loading ? 'Submitting...' : 'Send Reset Token'}
					</button>
				</form>

				{resetToken ? (
					<div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
						<p className="font-semibold text-amber-900">Development token</p>
						<p className="text-amber-800 break-all mt-1">{resetToken}</p>
					</div>
				) : null}

				<Link to="/login" className="inline-block mt-5 text-sm text-brand-cyan font-semibold hover:underline">
					Back to login
				</Link>
			</div>
		</div>
	)
}

export default ForgotPassword
