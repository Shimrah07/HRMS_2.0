import { Form, Input, Button, Checkbox, notification } from 'antd'
import { 
  UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, SunOutlined, MoonOutlined,
  LaptopOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, FireOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import useAuthStore from '../../store/authStore'
import { authService } from '../../services/authService'
import useUIStore from '../../store/uiStore'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated } = useAuthStore()
  const { isDarkMode, toggleDarkMode } = useUIStore()
  const [form] = Form.useForm()

  const [focusedField, setFocusedField] = useState(null)
  const [selectedQuickRole, setSelectedQuickRole] = useState(null)

  const passwordValue = Form.useWatch('password', form) || ''

  // Password strength — visual only, does not block submission
  const getPasswordStrength = (pwd) => {
    if (!pwd || !pwd.trim()) return { level: 0, label: '', color: 'transparent', width: '0%' }
    const checks = [
      pwd.length >= 8,
      /[A-Z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ]
    const score = checks.filter(Boolean).length
    if (score <= 1) return { level: 1, label: 'Weak', color: '#E94043', width: '25%' }
    if (score === 2) return { level: 2, label: 'Fair', color: '#FAA71A', width: '50%' }
    if (score === 3) return { level: 3, label: 'Good', color: isDarkMode ? '#3B82F6' : '#1D4ED8', width: '75%' }
    return { level: 4, label: 'Strong', color: '#10B981', width: '100%' }
  }
  const strength = getPasswordStrength(passwordValue)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const loginMutation = useMutation({
    mutationFn: ({ username, password, rememberMe }) =>
      authService.login(username, password, rememberMe),
    onSuccess: (response) => {
      if (response.success && response.data) {
        setAuth(response.data)
        notification.success({
          message: 'Access Granted',
          description: 'Welcome to MPOSethu. Session established.',
          placement: 'topRight',
        })
        navigate('/dashboard', { replace: true })
      } else {
        const errorText = response.message || response.errors?.[0] || 'Invalid credentials. Please try again.'
        notification.error({
          message: 'Authentication Failure',
          description: errorText,
          placement: 'topRight',
        })
      }
    },
    onError: () => {
      notification.error({
        message: 'Connection Failed',
        description: 'Unable to process your request. Check your network connection.',
        placement: 'topRight',
      })
    },
  })

  const onFinish = (values) => {
    const trimmedUsername = values.username?.trim() || ''
    const trimmedPassword = values.password?.trim() || ''
    loginMutation.mutate({
      username: trimmedUsername,
      password: trimmedPassword,
      rememberMe: values.rememberMe,
    })
  }

  const handleQuickAccess = (username) => {
    form.setFieldsValue({
      username,
      password: 'Hrms@123456',
      rememberMe: true,
    })
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div
      className="min-h-screen h-auto md:h-screen md:overflow-hidden overflow-y-auto"
      style={{
        display: 'flex',
        background: 'var(--color-surface)',
        position: 'relative',
        transition: 'background-color 0.25s ease',
      }}
    >
      {/* Dark mode toggle */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
        <Button
          type="text"
          icon={isDarkMode ? <SunOutlined style={{ color: '#FAA71A', fontSize: 18 }} /> : <MoonOutlined style={{ color: '#10113F', fontSize: 18 }} />}
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
            transition: 'all 0.2s',
          }}
        />
      </div>

      {/* Decorative blobs for the entire screen (behind panels) */}
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

      {/* Left Panel — Brand */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          flex: '0 0 45%',
          background: 'linear-gradient(135deg, #10113F 0%, #20133A 35%, #4D1B3B 70%, #861630 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'min(4vh, 44px) min(3vw, 40px)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
          boxShadow: '10px 0 30px rgba(16, 17, 63, 0.15)',
        }}
        className="hidden md:flex"
      >
        {/* Glowing vector blobs inside left panel */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,167,26,0.18) 0%, rgba(250,167,26,0) 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(134,22,48,0.3) 0%, rgba(134,22,48,0) 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #FAA71A 0%, #f5c842 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 18,
              color: '#10113F',
              boxShadow: '0 4px 12px rgba(250, 167, 26, 0.3)',
            }}
          >
            MP
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.02em' }} title="MPOnline Systematic Employee Tracking Human Utilities">MPOSethu</div>
            <div style={{ color: '#FAA71A', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }} title="MPOnline Systematic Employee Tracking Human Utilities">Systematic Workforce Platform</div>
          </div>
        </div>

        {/* Floating Mini-Dashboard Cards Mockup */}
        <div style={{ position: 'relative', height: 320, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2, margin: '20px 0' }}>
          {/* Card 1: Payroll Stats */}
          <motion.div
            initial={{ y: 20, rotate: -6 }}
            animate={{ y: 0, rotate: -4 }}
            whileHover={{ scale: 1.05, rotate: -2, zIndex: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              width: 220,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PAYROLL STATUS</div>
              <CheckCircleOutlined style={{ color: '#FAA71A', fontSize: 14 }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>₹8.45 Lakhs</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>June 2026 Processed</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>100% Compliant (PF & ESI)</span>
            </div>
          </motion.div>

          {/* Card 2: Attendance Tracking */}
          <motion.div
            initial={{ y: 40, rotate: 6 }}
            animate={{ y: 0, rotate: 4 }}
            whileHover={{ scale: 1.05, rotate: 2, zIndex: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 10,
              width: 220,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ATTENDANCE PUNCH</div>
              <ClockCircleOutlined style={{ color: '#FAA71A', fontSize: 14 }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Geo-punch Active</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>98.4% Present Today</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} style={{ flex: 1, height: 4, borderRadius: 2, background: item < 5 ? '#10B981' : 'rgba(255,255,255,0.15)' }} />
              ))}
            </div>
          </motion.div>

          {/* Card 3: Employee Stats */}
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute',
              width: 160,
              background: 'linear-gradient(135deg, rgba(250,167,26,0.18) 0%, rgba(250,167,26,0.03) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(250,167,26,0.3)',
              borderRadius: 16,
              padding: 14,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)',
              zIndex: 3
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>EMPLOYEES</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>142 Active</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>+12 Joined this month</div>
          </motion.div>
        </div>

        {/* Center content in Glass Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: '24px 28px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.25,
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            The operating system for
            <br />
            <span style={{ color: '#FAA71A' }}>modern workforces.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5, margin: 0, maxWidth: 380 }}
          >
            MPOSethu manages employee compliance, lifecycle tracking, payroll, attendance, and human resources utilities under a unified, high-performance platform.
          </motion.p>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 2, color: 'rgba(255,255,255,0.3)', fontSize: 11, lineHeight: 1.4 }}>
          © MP Online Limited · MPOSethu
          <br />
          All rights reserved.
        </div>
      </motion.div>

      {/* Right Panel — Login Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'min(4vh, 48px) min(4vw, 40px)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            width: '100%',
            maxWidth: 460,
            background: 'var(--color-card-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 24,
            border: 'var(--border-glass)',
            boxShadow: isDarkMode
              ? '0 20px 45px -12px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 20px 45px -12px rgba(16, 17, 63, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
            padding: '32px 36px',
            transition: 'background-color 0.25s ease, border 0.25s ease, box-shadow 0.25s ease',
          }}
        >
          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }} className="flex md:hidden">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FAA71A', fontWeight: 900, fontSize: 14 }}>MP</div>
            <span style={{ fontWeight: 800, fontSize: 18, color: isDarkMode ? '#ffffff' : '#10113F', letterSpacing: '-0.01em', transition: 'color 0.25s' }}>MPOSethu</span>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: isDarkMode ? '#ffffff' : '#10113F', margin: '0 0 6px', letterSpacing: '-0.02em', transition: 'color 0.25s', display: 'flex', alignItems: 'center', gap: 8 }}>
              Welcome back <span className="wave-emoji">👋</span>
            </h2>
            <p style={{ color: isDarkMode ? 'rgba(240, 244, 255, 0.6)' : 'rgba(16,17,63,0.55)', margin: 0, fontSize: 13.5, fontWeight: 500, transition: 'color 0.25s' }}>
              Sign in to access your workspace
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            size="large"
            requiredMark={false}
            validateTrigger={['onBlur', 'onChange']}
            scrollToFirstError={{ focusFirstInput: true }}
          >
            {/* Stagger field entrance */}
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.1 }}
              >
                {i === 0 ? (
                  <Form.Item
                    label={
                      <span style={{ 
                        fontWeight: 600, 
                        color: focusedField === 'username' 
                          ? '#FAA71A' 
                          : (isDarkMode ? 'rgba(240,244,255,0.85)' : '#10113F'), 
                        fontSize: 12.5, 
                        transition: 'color 0.2s' 
                      }}>
                        Email Address / Username
                      </span>
                    }
                    name="username"
                    style={{ marginBottom: 20 }}
                    rules={[
                      { required: true, message: 'Please enter your email address or username.' },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve()
                          const trimmed = value.trim()
                          if (trimmed.includes('@') || !['super_admin', 'hr_manager', 'employee', 'admin', 'it_admin', 'hr_admin', 'payroll_admin', 'dept_manager'].includes(trimmed)) {
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                            if (!emailRegex.test(trimmed)) {
                              return Promise.reject(new Error('Enter a valid work email address (example: john@company.com).'))
                            }
                          }
                          return Promise.resolve()
                        }
                      }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: focusedField === 'username' ? '#FAA71A' : (isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(16,17,63,0.35)'), transition: 'color 0.2s', marginRight: 4 }} />}
                      placeholder="john@company.com or username"
                      disabled={loginMutation.isPending}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      style={{ 
                        borderRadius: 12, 
                        height: 48,
                        background: isDarkMode ? 'rgba(10,12,35,0.45)' : '#fff',
                        border: focusedField === 'username' 
                          ? '2px solid #FAA71A' 
                          : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(16,17,63,0.12)'),
                        boxShadow: focusedField === 'username' ? '0 0 10px rgba(250,167,26,0.15)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </Form.Item>
                ) : (
                  <>
                    <Form.Item
                      label={
                        <span style={{ 
                          fontWeight: 600, 
                          color: focusedField === 'password' 
                            ? '#FAA71A' 
                            : (isDarkMode ? 'rgba(240,244,255,0.85)' : '#10113F'), 
                          fontSize: 12.5, 
                          transition: 'color 0.2s' 
                        }}>
                          Password
                        </span>
                      }
                      name="password"
                      style={{ marginBottom: passwordValue && passwordValue.trim().length > 0 ? 8 : 20 }}
                      rules={[{ required: true, message: 'Please enter your password.' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: focusedField === 'password' ? '#FAA71A' : (isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(16,17,63,0.35)'), transition: 'color 0.2s', marginRight: 4 }} />}
                        placeholder="Enter your account password"
                        disabled={loginMutation.isPending}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        style={{ 
                          borderRadius: 12, 
                          height: 48,
                          background: isDarkMode ? 'rgba(10,12,35,0.45)' : '#fff',
                          border: focusedField === 'password' 
                            ? '2px solid #FAA71A' 
                            : (isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(16,17,63,0.12)'),
                          boxShadow: focusedField === 'password' ? '0 0 10px rgba(250,167,26,0.15)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                        iconRender={(visible) => visible ? <EyeTwoTone twoToneColor="#FAA71A" /> : <EyeInvisibleOutlined />}
                      />
                    </Form.Item>
                    {/* Password strength bar */}
                    {passwordValue && passwordValue.trim().length > 0 && (
                      <div style={{ marginTop: -12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(16,17,63,0.08)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: strength.width }}
                            transition={{ duration: 0.3 }}
                            style={{ height: '100%', background: strength.color, borderRadius: 3 }}
                          />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: strength.color, minWidth: 46, transition: 'color 0.2s' }}>{strength.label}</span>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Form.Item name="rememberMe" valuePropName="checked" noStyle>
                <Checkbox style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(16,17,63,0.6)', fontSize: 13, fontWeight: 500, transition: 'color 0.25s' }} disabled={loginMutation.isPending}>Remember me</Checkbox>
              </Form.Item>
              <a
                href="/forgot-password"
                style={{ fontSize: 13, color: isDarkMode ? '#FAA71A' : '#10113F', fontWeight: 600, textDecoration: 'none', transition: 'color 0.25s' }}
              >
                Forgot password?
              </a>
            </div>

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loginMutation.isPending}
                disabled={loginMutation.isPending}
                block
                style={{
                  height: 48,
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, #FAA71A 0%, #f57c00 100%)' 
                    : 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)',
                  border: 'none',
                  boxShadow: isDarkMode 
                    ? '0 4px 14px rgba(250, 167, 26, 0.25)' 
                    : '0 4px 14px rgba(16, 17, 63, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form.Item>
          </Form>

          {/* Quick Access Demo Panel */}
          <div style={{
            marginTop: 16,
            padding: '14px 16px',
            borderRadius: 16,
            background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(16,17,63,0.015)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(16,17,63,0.06)',
          }}>
            <div style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: isDarkMode ? 'rgba(255,255,255,0.65)' : '#10113F',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <FireOutlined style={{ color: '#FAA71A' }} />
              Quick Sandbox Logins
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Admin', username: 'super_admin', icon: <LaptopOutlined /> },
                { label: 'Manager', username: 'hr_manager', icon: <TeamOutlined /> },
                { label: 'Employee', username: 'employee', icon: <UserOutlined /> },
              ].map((role) => {
                const isSelected = selectedQuickRole === role.username;
                return (
                  <div
                    key={role.username}
                    onClick={() => {
                      setSelectedQuickRole(role.username);
                      handleQuickAccess(role.username);
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: '10px 8px',
                      borderRadius: 12,
                      textAlign: 'center',
                      background: isSelected 
                        ? (isDarkMode ? 'rgba(250,167,26,0.12)' : 'rgba(250,167,26,0.06)') 
                        : (isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff'),
                      border: isSelected 
                        ? '1.5px solid #FAA71A' 
                        : (isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(16,17,63,0.1)'),
                      boxShadow: isSelected 
                        ? '0 4px 12px rgba(250,167,26,0.12)' 
                        : '0 2px 4px rgba(0,0,0,0.01)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.border = isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(16,17,63,0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.border = isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(16,17,63,0.1)';
                      }
                    }}
                  >
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: isSelected ? '#FAA71A' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(16,17,63,0.04)'), 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: isSelected ? '#10113F' : (isDarkMode ? 'rgba(255,255,255,0.75)' : '#10113F'),
                      fontSize: 14,
                      transition: 'all 0.2s ease'
                    }}>
                      {role.icon}
                    </div>
                    <div style={{ 
                      fontSize: 11, 
                      fontWeight: 700, 
                      color: isSelected ? '#FAA71A' : (isDarkMode ? 'rgba(240,244,255,0.8)' : 'rgba(16,17,63,0.85)') 
                    }}>{role.label}</div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ fontSize: 10.5, color: isDarkMode ? 'rgba(255,255,255,0.35)' : 'rgba(16,17,63,0.45)', marginTop: 6, fontWeight: 500, lineHeight: 1.4 }}>
              💡 Selecting a role auto-fills sandbox credentials. Fallback verification works on <code style={{ color: isDarkMode ? '#FAA71A' : '#861630', fontWeight: 600 }}>Hrms@123456</code>.
            </div>
          </div>

          <p style={{ textAlign: 'center', color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(16,17,63,0.4)', fontSize: 12, marginTop: 16, fontWeight: 500, transition: 'color 0.25s' }}>
            Secure enterprise login · Protected by JWT
          </p>
        </motion.div>
      </div>
    </div>
  )
}
