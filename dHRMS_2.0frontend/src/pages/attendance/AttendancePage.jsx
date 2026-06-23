import { useState, useEffect } from 'react'
import { Card, Button, Row, Col, Space, Table, Tag, Modal, Form, Input, DatePicker, Select, TimePicker, message, Tabs, Tooltip, notification } from 'antd'
import { VALIDATORS } from '../../constants/validation'
import {
  ClockCircleOutlined, LoginOutlined, LogoutOutlined, CheckCircleOutlined,
  AlertOutlined, HistoryOutlined, FormOutlined, CalendarOutlined, SolutionOutlined,
  LeftOutlined, RightOutlined, CheckOutlined, ExclamationCircleOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import { attendanceService } from '../../services/attendanceService'
import EmptyState from '../../components/common/EmptyState'


// Brand-palette status colors (dark-mode safe)
const STATUS_CONFIG = {
  present:  { bg: 'rgba(21, 128, 61, 0.15)',   border: 'rgba(21, 128, 61, 0.35)',   color: '#15803d',  darkColor: '#4ade80',  label: 'Present' },
  absent:   { bg: 'rgba(233, 64, 67, 0.15)',   border: 'rgba(233, 64, 67, 0.35)',   color: '#E94043',  darkColor: '#f87171',  label: 'Absent' },
  leave:    { bg: 'rgba(77, 27, 59, 0.15)',    border: 'rgba(77, 27, 59, 0.35)',    color: '#4D1B3B',  darkColor: '#c084fc',  label: 'Leave' },
  late:     { bg: 'rgba(250, 167, 26, 0.15)',  border: 'rgba(250, 167, 26, 0.35)',  color: '#b45309',  darkColor: '#FAA71A',  label: 'Late' },
  wfh:      { bg: 'rgba(16, 17, 63, 0.15)',    border: 'rgba(16, 17, 63, 0.3)',     color: '#10113F',  darkColor: '#a5b4fc',  label: 'WFH' },
  holiday:  { bg: 'rgba(134, 22, 48, 0.15)',   border: 'rgba(134, 22, 48, 0.3)',    color: '#861630',  darkColor: '#fb7185',  label: 'Holiday' },
  weekend:  { bg: 'transparent',               border: 'transparent',               color: null,       darkColor: null,       label: 'Weekend' },
  spacer:   { bg: 'transparent',               border: 'none',                      color: 'transparent', darkColor: 'transparent', label: '' },
}

function DayCell({ day, status, isDarkMode }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.spacer
  if (status === 'spacer') return <div style={{ height: 38 }} />

  const color = isDarkMode ? (cfg.darkColor || 'var(--color-text-muted)') : (cfg.color || 'var(--color-text-muted)')
  const bg = cfg.bg
  const border = cfg.border === 'none' ? 'none' : `1px solid ${cfg.border}`
  const isWeekend = status === 'weekend'

  return (
    <Tooltip title={!isWeekend ? cfg.label : ''} placement="top">
      <div
        style={{
          height: 38,
          borderRadius: 8,
          background: bg,
          border: border,
          color: isWeekend
            ? (isDarkMode ? 'rgba(240,244,255,0.25)' : 'rgba(16,17,63,0.3)')
            : color,
          fontWeight: 700,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isWeekend ? 'default' : 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        {day}
        {status === 'present' && (
          <span style={{ position: 'absolute', top: 2, right: 4, fontSize: 8, color }}>●</span>
        )}
      </div>
    </Tooltip>
  )
}

export default function AttendancePage() {
  const { user } = useAuthStore()
  const { isDarkMode } = useUIStore()
  const [currentTime, setCurrentTime] = useState(dayjs())
  const [punchedIn, setPunchedIn] = useState(false)
  const [punchInTime, setPunchInTime] = useState(null)
  const [todayLogs, setTodayLogs] = useState([])
  const [historyLogs, setHistoryLogs] = useState([])
  const [regularizations, setRegularizations] = useState([])
  const [weeklyHours, setWeeklyHours] = useState('0.0 hrs')
  const [avgInTime, setAvgInTime] = useState('—')
  const [calendarDays, setCalendarDays] = useState([])
  const [currentMonthDate, setCurrentMonthDate] = useState(dayjs())
  const [isRegModalOpen, setIsRegModalOpen] = useState(false)
  const [isPunching, setIsPunching] = useState(false)
  const [regForm] = Form.useForm()

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadAttendanceData = async () => {
    try {
      // 1. Fetch current status
      const statusRes = await attendanceService.getStatus()
      if (statusRes?.success && statusRes.data) {
        setPunchedIn(statusRes.data.punchedIn)
        setPunchInTime(statusRes.data.punchInTime)
        if (statusRes.data.logs && statusRes.data.logs.length > 0) {
          setTodayLogs(statusRes.data.logs)
        } else {
          setTodayLogs([])
        }
      }

      // 2. Fetch history (stats, history logs, calendar days)
      const month = currentMonthDate.month() + 1
      const year = currentMonthDate.year()
      const historyRes = await attendanceService.getHistory(month, year)
      if (historyRes?.success && historyRes.data) {
        setWeeklyHours(historyRes.data.weeklyHours || '0.0 hrs')
        setAvgInTime(historyRes.data.avgInTime || '—')
        setCalendarDays(historyRes.data.calendarDays || [])
        setHistoryLogs(historyRes.data.historyLogs || [])

        // If today's logs are not present in status, fallback to matching date logs in history
        if (!statusRes?.data?.logs || statusRes.data.logs.length === 0) {
          const todayStr = dayjs().format('DD MMM YYYY')
          const todayLogsFromHistory = (historyRes.data.historyLogs || []).filter(l => l.date === todayStr)
          setTodayLogs(todayLogsFromHistory)
        }
      }

      // 3. Fetch regularizations
      const regRes = await attendanceService.getRegularizations()
      if (regRes?.success && regRes.data) {
        setRegularizations(regRes.data)
      }
    } catch (err) {
      console.error('Failed to load attendance data', err)
    }
  }

  useEffect(() => {
    if (user) {
      loadAttendanceData()
    }
  }, [user, currentMonthDate])

  const handlePunch = async () => {
    setIsPunching(true)
    try {
      const res = await attendanceService.punch()
      if (res?.success) {
        notification.success({
          message: punchedIn ? 'Punched Out' : 'Punched In',
          description: res.message || 'Operation completed successfully!',
          placement: 'topRight'
        })
        loadAttendanceData()
      } else {
        notification.error({
          message: 'Operation Failed',
          description: res.message || 'Punch operation failed.',
          placement: 'topRight'
        })
      }
    } catch (err) {
      notification.error({
        message: 'Punch Failed',
        description: err.response?.data?.message || 'Failed to check-in/out. Please try again.',
        placement: 'topRight'
      })
    } finally {
      setIsPunching(false)
    }
  }

  const handleApplyRegularization = async (values) => {
    try {
      const payload = {
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm:ss'),
        reason: values.reason
      }
      const res = await attendanceService.applyRegularization(payload)
      if (res?.success) {
        notification.success({
          message: 'Request Submitted',
          description: res.message || 'Regularization request submitted successfully',
          placement: 'topRight'
        })
        setIsRegModalOpen(false)
        regForm.resetFields()
        loadAttendanceData()
      } else {
        notification.error({
          message: 'Submission Failed',
          description: res.message || 'Failed to submit regularization.',
          placement: 'topRight'
        })
      }
    } catch (err) {
      notification.error({
        message: 'Request Failed',
        description: err.response?.data?.message || 'Failed to submit regularization.',
        placement: 'topRight'
      })
    }
  }

  // Dynamic calendar grid generation
  const getCalendarDays = () => {
    const year = currentMonthDate.year()
    const month = currentMonthDate.month() // 0-indexed
    const daysInMonth = currentMonthDate.daysInMonth()

    // First day of the month offset: 0 for Sunday, 1 for Monday, etc.
    const firstDayOfWeek = dayjs(new Date(year, month, 1)).day()

    const days = []

    // Add empty spacers for offsets from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: '', status: 'spacer', key: `spacer-${i}` })
    }

    // Populate actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const isWeekend = (firstDayOfWeek + d - 1) % 7 === 0 || (firstDayOfWeek + d - 1) % 7 === 6
      let status = isWeekend ? 'weekend' : 'spacer'

      const record = calendarDays.find(r => r.day === d)
      if (record) {
        status = record.status
      } else {
        const dayDate = dayjs(new Date(year, month, d))
        if (dayDate.isBefore(dayjs(), 'day') && !isWeekend) {
          status = 'absent'
        }
      }

      days.push({ day: d, status, key: `day-${d}` })
    }

    return days
  }

  const computedCalendarDays = getCalendarDays()

  // Compute summary stats for the month
  const monthStats = (() => {
    const counts = { present: 0, absent: 0, late: 0, leave: 0, wfh: 0, holiday: 0 }
    computedCalendarDays.forEach(({ status }) => {
      if (counts[status] !== undefined) counts[status]++
    })
    return counts
  })()

  // Brand-palette status tag renderer
  const StatusTag = ({ v }) => {
    if (!v) return <Tag style={{ borderRadius: 6 }}>—</Tag>
    const statusMap = {
      'Approved': { color: isDarkMode ? 'rgba(21,128,61,0.2)' : 'rgba(21,128,61,0.1)', text: isDarkMode ? '#4ade80' : '#15803d', icon: <CheckOutlined /> },
      'Pending':  { color: isDarkMode ? 'rgba(250,167,26,0.2)' : 'rgba(250,167,26,0.1)', text: '#FAA71A', icon: <ExclamationCircleOutlined /> },
      'Active':   { color: isDarkMode ? 'rgba(16,17,63,0.4)' : 'rgba(16,17,63,0.08)', text: isDarkMode ? '#a5b4fc' : '#10113F', icon: <ClockCircleOutlined /> },
      'Rejected': { color: isDarkMode ? 'rgba(233,64,67,0.2)' : 'rgba(233,64,67,0.1)', text: '#E94043', icon: <MinusCircleOutlined /> },
    }
    const cfg = statusMap[v] || statusMap['Pending']
    return (
      <Tag style={{
        background: cfg.color,
        color: cfg.text,
        border: `1px solid ${cfg.text}30`,
        borderRadius: 6,
        fontWeight: 700,
        fontSize: 11,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {cfg.icon} {v}
      </Tag>
    )
  }

  const logColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v) => <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{v}</span> },
    {
      title: 'Punch In', dataIndex: 'in', key: 'in',
      render: (v) => (
        <Tag style={{ background: isDarkMode ? 'rgba(21,128,61,0.18)' : 'rgba(21,128,61,0.1)', color: isDarkMode ? '#4ade80' : '#15803d', border: '1px solid rgba(21,128,61,0.3)', borderRadius: 6, fontWeight: 600 }}>
          {v || '—'}
        </Tag>
      )
    },
    {
      title: 'Punch Out', dataIndex: 'out', key: 'out',
      render: (v) => v === '—' || !v ? (
        <Tag style={{ borderRadius: 6, background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--border-glass)' }}>—</Tag>
      ) : (
        <Tag style={{ background: isDarkMode ? 'rgba(77,27,59,0.2)' : 'rgba(77,27,59,0.1)', color: isDarkMode ? '#c084fc' : '#4D1B3B', border: '1px solid rgba(77,27,59,0.3)', borderRadius: 6, fontWeight: 600 }}>
          {v}
        </Tag>
      )
    },
    { title: 'Duration', dataIndex: 'duration', key: 'duration', render: (v) => <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{v || '—'}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <StatusTag v={v} /> },
  ]

  const regColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v) => <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{v}</span> },
    { title: 'Requested Time', dataIndex: 'requestTime', key: 'time', render: (v) => <span style={{ color: 'var(--color-text-secondary)' }}>{v || '—'}</span> },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', ellipsis: true, render: (v) => <span style={{ color: 'var(--color-text-secondary)' }}>{v || '—'}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <StatusTag v={v} /> },
  ]

  // divider style (dark-aware)
  const dividerStyle = {
    width: '100%',
    height: 1,
    background: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(16,17,63,0.07)',
    margin: '16px 0',
  }

  const isCurrentMonth = currentMonthDate.isSame(dayjs(), 'month')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Attendance Center"
        subtitle="Manage check-ins, view calendar, and request regularization"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Attendance' }]}
        actions={
          <Button type="primary" icon={<FormOutlined />} onClick={() => setIsRegModalOpen(true)} style={{ borderRadius: 8 }}>
            Request Regularization
          </Button>
        }
      />

      <Row gutter={[20, 20]}>
        {/* Left Column - Live clock & Punch Panel */}
        <Col xs={24} md={10}>
          <Card
            style={{
              height: '100%',
              borderRadius: 16,
              background: 'var(--color-card-bg)',
              border: 'var(--border-glass)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '24px 16px',
            }}
          >
            <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              {dayjs().format('dddd, DD MMMM YYYY')}
            </div>

            {/* Live Clock Display */}
            <div style={{
              fontSize: 38,
              fontWeight: 800,
              color: 'var(--color-text-primary)',
              margin: '14px 0 4px',
              letterSpacing: '0.02em',
              fontFamily: 'monospace',
              transition: 'color 0.2s ease',
            }}>
              {currentTime.format('hh:mm:ss A')}
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13.5, marginBottom: 24 }}>
              {punchedIn
                ? <><CheckCircleOutlined style={{ color: '#15803d', marginRight: 6 }} />Punched In at {punchInTime}</>
                : <><AlertOutlined style={{ color: isDarkMode ? '#FAA71A' : '#E94043', marginRight: 6 }} />Currently logged out</>
              }
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }}>
                <Button
                  type="primary"
                  shape="round"
                  size="large"
                  icon={punchedIn ? <LogoutOutlined /> : <LoginOutlined />}
                  onClick={handlePunch}
                  loading={isPunching}
                  style={{
                    height: 52,
                    padding: '0 32px',
                    fontSize: 16,
                    fontWeight: 700,
                    background: punchedIn
                      ? 'linear-gradient(135deg, #861630 0%, #E94043 100%)'
                      : 'linear-gradient(135deg, #10113F 0%, #292a7e 100%)',
                    border: 'none',
                    boxShadow: punchedIn
                      ? '0 6px 18px rgba(134, 22, 48, 0.35)'
                      : '0 6px 18px rgba(16, 17, 63, 0.25)',
                  }}
                >
                  {punchedIn ? 'Punch Out' : 'Punch In'}
                </Button>
              </motion.div>
            </div>

            <div style={dividerStyle} />

            <Row gutter={12}>
              <Col span={12} style={{ borderRight: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(16,17,63,0.07)'}` }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Weekly Hours</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 4 }}>{weeklyHours}</div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Avg In-Time</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 4 }}>{avgInTime}</div>
              </Col>
            </Row>

            <div style={dividerStyle} />

            {/* Monthly Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: 'Present', count: monthStats.present, color: isDarkMode ? '#4ade80' : '#15803d' },
                { label: 'Absent', count: monthStats.absent, color: '#E94043' },
                { label: 'Leave', count: monthStats.leave, color: isDarkMode ? '#c084fc' : '#4D1B3B' },
                { label: 'Late', count: monthStats.late, color: '#FAA71A' },
                { label: 'WFH', count: monthStats.wfh, color: isDarkMode ? '#a5b4fc' : '#10113F' },
                { label: 'Holiday', count: monthStats.holiday, color: isDarkMode ? '#fb7185' : '#861630' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{
                  textAlign: 'center',
                  padding: '8px 4px',
                  borderRadius: 8,
                  background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(16,17,63,0.03)',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color }}>{count}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right Column - Attendance Calendar Grid View */}
        <Col xs={24} md={14}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <CalendarOutlined style={{ color: '#FAA71A' }} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Attendance — {currentMonthDate.format('MMMM YYYY')}</span>
                </Space>
                <Space size={6}>
                  <Button
                    size="small"
                    icon={<LeftOutlined />}
                    onClick={() => setCurrentMonthDate(d => d.subtract(1, 'month'))}
                    style={{ borderRadius: 6, height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  />
                  <Button
                    size="small"
                    onClick={() => setCurrentMonthDate(dayjs())}
                    disabled={isCurrentMonth}
                    style={{ borderRadius: 6, height: 28, fontSize: 11, fontWeight: 600 }}
                  >
                    Today
                  </Button>
                  <Button
                    size="small"
                    icon={<RightOutlined />}
                    onClick={() => setCurrentMonthDate(d => d.add(1, 'month'))}
                    disabled={isCurrentMonth}
                    style={{ borderRadius: 6, height: 28, width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  />
                </Space>
              </div>
            }
            style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)', height: '100%' }}
            styles={{ header: { borderBottom: 'var(--border-glass)' } }}
          >
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 4 }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 16 }}>
              {computedCalendarDays.map(({ day, status, key }) => (
                <DayCell key={key} day={day} status={status} isDarkMode={isDarkMode} />
              ))}
            </div>

            {/* Legend Bar */}
            <div style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
              fontSize: 11.5,
              color: 'var(--color-text-secondary)',
              borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(16,17,63,0.07)'}`,
              paddingTop: 12,
            }}>
              {[
                { label: 'Present', color: isDarkMode ? '#4ade80' : '#15803d' },
                { label: 'Late',    color: '#FAA71A' },
                { label: 'Leave',   color: isDarkMode ? '#c084fc' : '#4D1B3B' },
                { label: 'WFH',     color: isDarkMode ? '#a5b4fc' : '#10113F' },
                { label: 'Absent',  color: '#E94043' },
                { label: 'Holiday', color: isDarkMode ? '#fb7185' : '#861630' },
              ].map(({ label, color }) => (
                <Space key={label} size={5}>
                  <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: color }} />
                  <span>{label}</span>
                </Space>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tabs for Punch History & Regularizations */}
      <Card style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)', marginTop: 20 }}>
        <Tabs
          defaultActiveKey="logs"
          items={[
            {
              key: 'logs',
              label: <span><HistoryOutlined style={{ marginRight: 6 }} />Today's Punch Logs</span>,
              children: (
                <Table
                  columns={logColumns}
                  dataSource={todayLogs}
                  rowKey={(r, i) => r.date + i}
                  pagination={false}
                  locale={{ emptyText: <EmptyState variant="attendance" title="No punch logs for today" description="" size={120} /> }}
                  size="small"
                />
              )
            },
            {
              key: 'monthly',
              label: <span><CalendarOutlined style={{ marginRight: 6 }} />Monthly History</span>,
              children: (
                <Table
                  columns={logColumns}
                  dataSource={historyLogs}
                  rowKey={(r, i) => r.date + i}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  locale={{ emptyText: <EmptyState variant="attendance" title={`No logs found for ${currentMonthDate.format('MMMM YYYY')}`} description="" size={120} /> }}
                  size="small"
                />
              )
            },
            {
              key: 'regs',
              label: <span><SolutionOutlined style={{ marginRight: 6 }} />Regularization History</span>,
              children: (
                <Table
                  columns={regColumns}
                  dataSource={regularizations}
                  rowKey={(r, i) => (r.date || '') + i}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  locale={{ emptyText: <EmptyState variant="attendance" title="No regularization requests" description="" size={120} /> }}
                  size="small"
                />
              )
            }
          ]}
        />
      </Card>

      {/* Regularization Request Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FormOutlined style={{ color: '#FAA71A', fontSize: 14 }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Apply for Attendance Regularization</span>
          </div>
        }
        open={isRegModalOpen}
        onCancel={() => setIsRegModalOpen(false)}
        onOk={() => regForm.submit()}
        okText="Submit Request"
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 600 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        destroyOnClose
      >
        <Form form={regForm} layout="vertical" onFinish={handleApplyRegularization} style={{ marginTop: 8 }} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
          <Form.Item name="date" label="Date" rules={[VALIDATORS.requiredSelect('Date')]}>
            <DatePicker style={{ width: '100%', borderRadius: 8 }} disabledDate={(d) => d && d.isAfter(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item name="time" label="Corrected Punch Time" rules={[VALIDATORS.requiredSelect('Corrected Punch Time')]}>
            <TimePicker use12Hours format="h:mm a" style={{ width: '100%', borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason for Regularization" rules={[VALIDATORS.required('Reason for Regularization')]}>
            <Input.TextArea rows={3} placeholder="e.g. Card not working, Forgot to punch in/out, working offsite..." style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
