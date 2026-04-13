import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/client';

const WEAK_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'letmein',
  'welcome123',
  'abc12345',
  'iloveyou',
  'changeme',
  'dermas123',
]);

export default function Register() {
  const navigate = useNavigate();
  const [requestId, setRequestId] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    reasonForAccess: '',
  });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const validatePhone = (value) => /^[+]?[(]?[0-9\s\-()]{7,20}$/.test(value.trim());

  const errors = useMemo(() => {
    const next = {};

    if (!form.fullName.trim()) next.fullName = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!validateEmail(form.email)) next.email = 'Enter a valid email address.';

    if (!form.phoneNumber.trim()) next.phoneNumber = 'Phone number is required.';
    else if (!validatePhone(form.phoneNumber)) next.phoneNumber = 'Enter a valid phone number.';

    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 12) next.password = 'Password must be at least 12 characters.';
    else if (!/[a-z]/.test(form.password)) next.password = 'Password must include at least one lowercase letter.';
    else if (!/[A-Z]/.test(form.password)) next.password = 'Password must include at least one uppercase letter.';
    else if (!/[0-9]/.test(form.password)) next.password = 'Password must include at least one number.';
    else if (!/[^A-Za-z0-9]/.test(form.password)) next.password = 'Password must include at least one special character.';
    else if (WEAK_PASSWORDS.has(form.password.trim().toLowerCase())) next.password = 'Choose a stronger password that is not commonly used.';

    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.';

    return next;
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
    setSuccess('');
    setRequestId('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      phoneNumber: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        reasonForAccess: form.reasonForAccess.trim(),
      });
      setRequestId(String(data?._id || ''));

      setSuccess('Your registration request will be reviewed by an administrator before account activation.');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to submit registration request right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) => `w-full px-4 py-3 rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-2 outline-none transition-all duration-200 shadow-sm ${
    touched[fieldName] && errors[fieldName]
      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
      : 'border-slate-200 focus:ring-amber-400/50 focus:border-amber-400'
  }`;

  return (
    <div className="min-h-screen flex">
      <div className="w-full lg:w-[52%] flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-gradient-to-b from-amber-50/80 via-white to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-20 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl translate-x-1/3 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 max-w-lg w-full animate-fade-in-left">
          <div className="mb-10 flex items-center gap-3">
            <img src="/dermas-logo.png" alt="Dermas Apparel" className="h-10 w-10 object-contain" />
            <span className="text-xl font-semibold text-slate-800">DERMAS APPAREL</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-2">Request account access</h1>
          <p className="text-slate-500 text-sm mb-2">Register to access the ERP platform</p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-6">
            Your registration request will be reviewed by an administrator before account activation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm border border-emerald-100" role="status">
                {success}
                {requestId && (
                  <p className="mt-2 text-xs text-emerald-800">
                    Request ID: <span className="font-mono">{requestId}</span>.{' '}
                    <Link to="/request-status" className="font-semibold underline underline-offset-2">Check status</Link>
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} onBlur={handleBlur} className={inputClass('fullName')} placeholder="Your full name" />
              {touched.fullName && errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} className={inputClass('email')} placeholder="you@company.com" autoComplete="email" />
                {touched.email && errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <input id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} onBlur={handleBlur} className={inputClass('phoneNumber')} placeholder="07X XXX XXXX" autoComplete="tel" />
                {touched.phoneNumber && errors.phoneNumber && <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} onBlur={handleBlur} className={`${inputClass('password')} pr-24`} placeholder="Min 12 chars with upper/lower/number/symbol" autoComplete="new-password" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-base`} />
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                {touched.password && errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} className={`${inputClass('confirmPassword')} pr-24`} placeholder="Re-enter password" autoComplete="new-password" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} text-base`} />
                    <span>{showConfirmPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="reasonForAccess" className="block text-sm font-medium text-slate-700 mb-2">Reason for Access (optional)</label>
              <input
                id="reasonForAccess"
                name="reasonForAccess"
                value={form.reasonForAccess}
                onChange={handleChange}
                className={inputClass('reasonForAccess')}
                placeholder="Brief reason"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <i className="bi bi-arrow-repeat animate-spin" /> Submitting request...
                </span>
              ) : (
                'Request Access'
              )}
            </button>
          </form>

          <p className="mt-7 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden animate-fade-in-right">
        <img
          src="/login-bg.png"
          alt="Manufacturing"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            const fallback = document.getElementById('register-bg-fallback');
            if (fallback) fallback.classList.remove('hidden');
          }}
        />
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 hidden" id="register-bg-fallback" aria-hidden="true" />
        <div className="absolute inset-0 bg-slate-900/25" />
        <div className="absolute bottom-8 left-8 right-8 rounded-2xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">Dermas Apparel ERP</p>
          <p className="mt-2 text-xl font-semibold">Submit request for account access</p>
          <p className="mt-1 text-sm text-white/80">Your request will be reviewed and approved by an administrator before activation.</p>
        </div>
      </div>
    </div>
  );
}
