import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'
import useUIStore from '../../store/uiStore'

// Password policy: 12+ chars, upper, lower, number, special
const RULES = [
  { id: 'length', label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { id: 'upper', label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$%...)', test: (p) => /[!@#$%^&*()\-_=+\[\]{}|;:,.<>?/\\]/.test(p) },
]

function getStrength(password) {
  const passed = RULES.filter((r) => r.test(password)).length
  return passed
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isDarkMode, toggleDarkMode } = useUIStore()

  const urlToken = searchParams.get('token') || ''
  const [form, setForm] = useState({ token: urlToken, newPass: '', confirm: '' })
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const strength = getStrength(form.newPass)
  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981']
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong']

  const handleChange = useCallback((field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setError('')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.token || !form.token.trim()) return setError('Please enter your reset token.')
    if (form.newPass !== form.confirm) return setError('Passwords do not match.')

    const failedRules = RULES.filter((r) => !r.test(form.newPass))
    if (failedRules.length > 0) return setError(`Password requirements not fully met. Ensure all 5 policy rules are satisfied.`)

    setLoading(true)
    try {
      const res = await authService.resetPassword(
        form.token.trim(),
        form.newPass,
        form.confirm
      )
      if (res.success) {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 2000)
      } else {
        setError(res.message || 'Token is invalid or expired.')
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password. Please verify your token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-color 0.25s ease',
    }}>
      {/* Dark mode toggle */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
        <button
          onClick={toggleDarkMode}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(16,17,63,0.03)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(16,17,63,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {isDarkMode ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAA71A" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10113F" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </button>
      </div>

      {/* Decorative blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(250,167,26,0.04) 0%, rgba(250,167,26,0) 70%)'
            : 'radial-gradient(circle, rgba(250,167,26,0.07) 0%, rgba(250,167,26,0) 70%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '20%',
          width: '40vw',
          height: '40vw',
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(77,27,59,0.08) 0%, rgba(77,27,59,0) 70%)'
            : 'radial-gradient(circle, rgba(77,27,59,0.05) 0%, rgba(77,27,59,0) 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ 
            width: 56, 
            height: 56, 
            borderRadius: 14, 
            background: isDarkMode ? 'linear-gradient(135deg, #FAA71A 0%, #f57c00 100%)' : 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px', 
            boxShadow: isDarkMode ? '0 10px 20px rgba(250, 167, 26, 0.2)' : '0 10px 20px rgba(16, 17, 63, 0.15)' 
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" fill={isDarkMode ? "#10113F" : "white"}/>
            </svg>
          </div>
          <h1 style={{ color: 'var(--color-text-primary)', fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
            Reset Password
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
            Enter your reset token and define a new secure password.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-card-bg)',
          border: 'var(--border-glass)',
          borderRadius: 24,
          padding: '28px 32px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: isDarkMode
            ? '0 20px 45px -12px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 20px 45px -12px rgba(16, 17, 63, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
          transition: 'all 0.25s ease',
        }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#22c55e">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <h2 style={{ color: '#22c55e', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Password Reset Successful!</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 13.5, margin: 0 }}>You can now sign in using your new credentials. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Token Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: 12, fontWeight: 600 }}>
                  Reset Token
                </label>
                <input
                  type="text"
                  value={form.token}
                  onChange={handleChange('token')}
                  placeholder="Enter the reset token received"
                  style={{
                    width: '100%',
                    height: 48,
                    padding: '0 16px',
                    background: isDarkMode ? 'rgba(10,12,35,0.45)' : '#fff',
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(16,17,63,0.12)'}`,
                    borderRadius: 12,
                    color: 'var(--color-text-primary)',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>

              {/* New Password */}
              <InputField
                label="New Password"
                value={form.newPass}
                onChange={handleChange('newPass')}
                show={showNew}
                onToggle={() => setShowNew(v => !v)}
                placeholder="Create strong password"
                isDarkMode={isDarkMode}
              />

              {/* Password Strength Meter */}
              {form.newPass.length > 0 && (
                <div style={{ marginTop: -4 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ flex: 1, height: 5, borderRadius: 2, background: i <= strength ? strengthColors[strength - 1] : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(16,17,63,0.08)'), transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ color: strength > 0 ? strengthColors[strength - 1] : (isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(16,17,63,0.4)'), fontSize: 12, fontWeight: 700 }}>
                      {strength > 0 ? strengthLabels[strength - 1] : ''}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      {RULES.map(rule => {
                        const passed = rule.test(form.newPass);
                        return (
                          <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: passed ? '#22c55e' : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(16,17,63,0.2)'), transition: 'background 0.2s' }} />
                            <span style={{ fontSize: 11, fontWeight: 500, color: passed ? '#22c55e' : (isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(16,17,63,0.5)'), transition: 'color 0.2s' }}>{rule.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <InputField
                label="Confirm New Password"
                value={form.confirm}
                onChange={handleChange('confirm')}
                show={showConfirm}
                onToggle={() => setShowConfirm(v => !v)}
                placeholder="Confirm your new password"
                showMatch={form.confirm.length > 0}
                isMatch={form.newPass === form.confirm}
                isDarkMode={isDarkMode}
              />

              {/* Error */}
              {error && (
                <div style={{ background: 'rgba(233,64,67,0.08)', border: '1px solid rgba(233,64,67,0.2)', borderRadius: 12, padding: '12px 14px', color: '#E94043', fontSize: 13, fontWeight: 500 }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || strength < 5}
                style={{
                  height: 48,
                  padding: '10px 24px',
                  background: strength === 5
                    ? (isDarkMode
                        ? 'linear-gradient(135deg, #FAA71A 0%, #f57c00 100%)'
                        : 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)')
                    : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(16,17,63,0.06)'),
                  border: 'none',
                  borderRadius: 12,
                  color: strength === 5
                    ? (isDarkMode ? '#10113F' : '#fff')
                    : (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(16,17,63,0.4)'),
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: strength === 5 && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  boxShadow: strength === 5
                    ? (isDarkMode ? '0 4px 14px rgba(250, 167, 26, 0.25)' : '0 4px 14px rgba(16, 17, 63, 0.2)')
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Resetting Password...
                  </span>
                ) : 'Reset Password'}
              </button>

              {/* Back to Login */}
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(16,17,63,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0, marginTop: 4, transition: 'color 0.2s' }}
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  )
}

function InputField({ label, value, onChange, show, onToggle, placeholder, showMatch, isMatch, isDarkMode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: 12, fontWeight: 600 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          style={{
            width: '100%',
            height: 48,
            padding: '0 48px 0 16px',
            background: isDarkMode ? 'rgba(10,12,35,0.45)' : '#fff',
            border: showMatch
              ? (isMatch ? '2px solid #22c55e' : '2px solid #E94043')
              : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(16,17,63,0.12)'}`,
            borderRadius: 12,
            color: 'var(--color-text-primary)',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'all 0.2s ease',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(16,17,63,0.35)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
        >
          {show ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
          )}
        </button>
        {showMatch && (
          <div style={{ position: 'absolute', right: 44, top: '50%', transform: 'translateY(-50%)' }}>
            {isMatch
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="#E94043"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            }
          </div>
        )}
      </div>
    </div>
  )
}
