import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import useUIStore from '../../store/uiStore'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !email.trim()) {
      return setError('Please enter your email address.')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return setError('Please enter a valid work email address.')
    }

    setLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      setSuccess(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to process request. Please try again.')
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
            Recover Password
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
            Enter your work email address to receive password recovery instructions.
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
              <h2 style={{ color: '#22c55e', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Recovery Email Sent</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 20px 0' }}>
                If this email exists in our system, a password recovery link and token have been generated.
              </p>
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                style={{
                  height: 48,
                  width: '100%',
                  background: isDarkMode ? 'linear-gradient(135deg, #FAA71A 0%, #f57c00 100%)' : 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)',
                  border: 'none',
                  borderRadius: 12,
                  color: isDarkMode ? '#10113F' : '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: isDarkMode ? '0 4px 14px rgba(250, 167, 26, 0.25)' : '0 4px 14px rgba(16, 17, 63, 0.2)',
                  transition: 'all 0.2s',
                  marginBottom: 12,
                }}
              >
                Go to Reset Password
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(16,17,63,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'block', color: 'var(--color-text-primary)', fontSize: 12, fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="Enter your work email address"
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

              {/* Error */}
              {error && (
                <div style={{ background: 'rgba(233,64,67,0.08)', border: '1px solid rgba(233,64,67,0.2)', borderRadius: 12, padding: '12px 14px', color: '#E94043', fontSize: 13, fontWeight: 500 }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 48,
                  padding: '10px 24px',
                  background: isDarkMode ? 'linear-gradient(135deg, #FAA71A 0%, #f57c00 100%)' : 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)',
                  border: 'none',
                  borderRadius: 12,
                  color: isDarkMode ? '#10113F' : '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isDarkMode ? '0 4px 14px rgba(250, 167, 26, 0.25)' : '0 4px 14px rgba(16, 17, 63, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Sending Recovery Link...
                  </span>
                ) : 'Send Reset Link'}
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
