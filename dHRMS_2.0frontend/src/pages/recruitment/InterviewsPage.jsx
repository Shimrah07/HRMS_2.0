import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input, DatePicker, Select,
  message, Row, Col, Typography, InputNumber, Divider, Badge, Avatar, Descriptions,
  Tabs, Statistic, Tooltip, Dropdown, Menu, Alert
} from 'antd'
import {
  CalendarOutlined, PlusOutlined, EditOutlined, CheckCircleOutlined,
  CloseCircleOutlined, InfoCircleOutlined, UserOutlined, VideoCameraOutlined,
  HomeOutlined, SendOutlined, MailOutlined, CopyOutlined, TeamOutlined,
  ClockCircleOutlined, UserAddOutlined, SwapOutlined, GlobalOutlined,
  FolderOpenOutlined, EyeOutlined, CheckOutlined, ExclamationCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { recruitmentService } from '../../services/recruitmentService'
import { employeeService } from '../../services/employeeService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import useUIStore from '../../store/uiStore'

const { Option } = Select
const { Text, Title, Paragraph } = Typography

const INTERVIEW_ROUND_TYPES = [
  { value: 'Technical', label: 'Technical Assessment' },
  { value: 'Managerial', label: 'Manager Review' },
  { value: 'HR', label: 'HR Discussion' },
  { value: 'CultureFit', label: 'Culture & Fitment' }
]

const GENERAL_CATEGORIES = [
  'Walk-in',
  'Campus Drive',
  'Referral Drive',
  'Vendor',
  'Internal Transfer',
  'Promotion',
  'Exit Interview',
  'Leadership Discussion',
  'Other'
]

const STATUS_LIFECYCLE = [
  'Scheduled',
  'InvitationSent',
  'Confirmed',
  'InProgress',
  'Completed',
  'FeedbackPending',
  'Evaluated',
  'Cancelled',
  'Rescheduled'
]

const getStatusTag = (status) => {
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 28,
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.5px',
    textAlign: 'center',
    textTransform: 'uppercase',
    margin: 0
  }

  switch (status) {
    case 'Scheduled':
      return <Tag color="blue" style={badgeStyle}>SCHEDULED</Tag>
    case 'InvitationSent':
      return <Tag color="cyan" style={badgeStyle}>INVITE SENT</Tag>
    case 'Confirmed':
      return <Tag color="purple" style={badgeStyle}>CONFIRMED</Tag>
    case 'InProgress':
      return <Tag color="processing" style={badgeStyle}>IN PROGRESS</Tag>
    case 'Completed':
      return <Tag color="success" style={badgeStyle}>COMPLETED</Tag>
    case 'FeedbackPending':
      return <Tag color="orange" style={badgeStyle}>FEEDBACK PENDING</Tag>
    case 'OverdueFeedback':
      return <Tag color="error" style={badgeStyle}>OVERDUE FEEDBACK</Tag>
    case 'Evaluated':
      return <Tag color="gold" style={badgeStyle}>EVALUATED</Tag>
    case 'Cancelled':
      return <Tag color="error" style={badgeStyle}>CANCELLED</Tag>
    case 'Rescheduled':
      return <Tag color="warning" style={badgeStyle}>RESCHEDULED</Tag>
    default:
      return <Tag style={badgeStyle}>{status?.toUpperCase() || 'SCHEDULED'}</Tag>
  }
}

// Standardized Enterprise KPI Card Component
function StandardKpiCard({ title, value, icon, color, badgeText, badgeColor = 'default' }) {
  const isLongValue = typeof value === 'string' && value.length > 4

  return (
    <Card
      bordered={false}
      style={{
        background: 'var(--color-card-bg)',
        backdropFilter: 'blur(12px)',
        border: 'var(--border-glass)',
        borderRadius: 12,
        height: '100%',
        minHeight: 92,
        transition: 'all 0.2s ease-in-out',
        boxShadow: 'var(--shadow-subtle)'
      }}
      styles={{
        body: {
          padding: '12px 14px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 6
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            lineHeight: 1.2,
            wordBreak: 'break-word'
          }}
          title={title}
        >
          {title}
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            color: color,
            flexShrink: 0
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
        <span
          style={{
            fontSize: isLongValue ? 15 : 21,
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            lineHeight: 1.1,
            wordBreak: 'break-word'
          }}
        >
          {value}
        </span>
        {badgeText && (
          <Tag
            color={badgeColor}
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              margin: 0,
              borderRadius: 4,
              padding: '0 6px',
              height: 20,
              lineHeight: '20px',
              border: 'none',
              flexShrink: 0,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {badgeText}
          </Tag>
        )}
      </div>
    </Card>
  )
}

export default function InterviewsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isDarkMode } = useUIStore()

  // Active tab state: 'recruitment' vs 'general'
  const [activeTab, setActiveTab] = useState('recruitment')
  const [recruitmentFilter, setRecruitmentFilter] = useState('all') // all, today, upcoming, completed

  // Schedulers & Modals state
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingRound, setEditingRound] = useState(null)
  const [presetApp, setPresetApp] = useState(null)

  const [generalScheduleOpen, setGeneralScheduleOpen] = useState(false)
  const [editingGeneralRound, setEditingGeneralRound] = useState(null)

  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [selectedRound, setSelectedRound] = useState(null)
  const [selectedPanelistId, setSelectedPanelistId] = useState(null)

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteTarget, setInviteTarget] = useState(null)

  // Candidate conversion modal for General Interviews
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [convertingGeneralRound, setConvertingGeneralRound] = useState(null)
  const [converting, setConverting] = useState(false)

  const [form] = Form.useForm()
  const [generalForm] = Form.useForm()
  const [feedbackForm] = Form.useForm()
  const [convertForm] = Form.useForm()

  const [savingSchedule, setSavingSchedule] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // Queries
  const { data: interviewsData, isLoading } = useQuery({
    queryKey: ['interviews-list'],
    queryFn: () => recruitmentService.getInterviews()
  })

  const { data: employeesData } = useQuery({
    queryKey: ['active-employees-lookup'],
    queryFn: () => employeeService.getEmployees({ pageSize: 1000, activeStatus: 'active' })
  })

  const { data: appsData } = useQuery({
    queryKey: ['all-active-applications'],
    queryFn: () => recruitmentService.getApplications()
  })

  const interviews = useMemo(() => interviewsData?.data || [], [interviewsData])
  const employees = useMemo(() => employeesData?.data || [], [employeesData])
  const applications = useMemo(() => appsData?.data || [], [appsData])

  // Filter recruitment vs general interviews
  const recruitmentInterviews = useMemo(() => interviews.filter(i => !i.isGeneralInterview), [interviews])
  const generalInterviews = useMemo(() => interviews.filter(i => i.isGeneralInterview), [interviews])

  // Filter active Applications that are in interview stages but have NO scheduled interview (Needs Scheduling)
  const interviewStages = ['InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview']
  const needsSchedulingApps = useMemo(() => {
    return applications.filter(app => {
      if (!interviewStages.includes(app.currentStage)) return false
      // Check if there is an active (non-cancelled) interview round for this application
      const hasRound = recruitmentInterviews.some(r => r.appId === app.appId && r.status !== 'Cancelled')
      return !hasRound
    })
  }, [applications, recruitmentInterviews])

  // Filter recruitment interviews by sub-filter
  const filteredRecruitmentInterviews = useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD')
    if (recruitmentFilter === 'today') {
      return recruitmentInterviews.filter(i => dayjs(i.scheduledAt).format('YYYY-MM-DD') === todayStr)
    }
    if (recruitmentFilter === 'upcoming') {
      return recruitmentInterviews.filter(i => dayjs(i.scheduledAt).isAfter(dayjs()) && i.status !== 'Completed' && i.status !== 'Cancelled')
    }
    if (recruitmentFilter === 'completed') {
      return recruitmentInterviews.filter(i => i.status === 'Completed' || i.status === 'Evaluated' || i.status === 'FeedbackPending')
    }
    return recruitmentInterviews
  }, [recruitmentInterviews, recruitmentFilter])

  // KPI Header Stats
  const kpis = useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD')
    const todayCount = interviews.filter(i => dayjs(i.scheduledAt).format('YYYY-MM-DD') === todayStr).length
    const upcomingCount = interviews.filter(i => dayjs(i.scheduledAt).isAfter(dayjs()) && i.status !== 'Completed' && i.status !== 'Cancelled').length
    const completedToday = interviews.filter(i => dayjs(i.scheduledAt).format('YYYY-MM-DD') === todayStr && (i.status === 'Completed' || i.status === 'Evaluated')).length
    const pendingFeedbackCount = interviews.filter(i => i.status === 'FeedbackPending' || (i.panelists && i.panelists.some(p => p.status === 'Pending'))).length
    const cancelledCount = interviews.filter(i => i.status === 'Cancelled').length

    return {
      needsScheduling: needsSchedulingApps.length,
      today: todayCount,
      upcoming: upcomingCount,
      completedToday,
      pendingFeedback: pendingFeedbackCount,
      cancelled: cancelledCount
    }
  }, [interviews, needsSchedulingApps])

  // ICS Calendar Generator
  const downloadICS = (interview) => {
    const start = dayjs(interview.scheduledAt).format('YYYYMMDDTHHmmss')
    const duration = interview.durationMinutes || 45
    const end = dayjs(interview.scheduledAt).add(duration, 'minute').format('YYYYMMDDTHHmmss')
    const title = interview.roundName || interview.category || 'Interview Session'
    const description = `Interview Session: ${title} with ${interview.candidateName || 'Candidate'}`
    const location = interview.meetingLink || interview.venue || 'Online Meeting'

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//IndiaHRMS//Interview Hub//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `interview_${dayjs(interview.scheduledAt).format('YYYYMMDD_HHmm')}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('Calendar .ics file downloaded.')
  }

  // Handle Quick Schedule / Save Recruitment Interview
  const handleSaveRecruitmentSchedule = async (values) => {
    setSavingSchedule(true)
    try {
      const payload = {
        appId: values.appId,
        roundName: values.roundName,
        roundType: values.roundType,
        scheduledAt: values.scheduledAt.format('YYYY-MM-DDTHH:mm:ssZ'),
        durationMinutes: values.durationMinutes || 45,
        venue: values.venue || null,
        meetingLink: values.meetingLink || null,
        interviewerIds: values.interviewerIds,
        notes: values.notes || null,
        isGeneralInterview: false
      }

      let res
      if (editingRound) {
        res = await recruitmentService.updateInterview(editingRound.roundId, payload)
      } else {
        res = await recruitmentService.createInterview(payload)
      }

      if (res.success) {
        message.success(editingRound ? 'Interview details updated successfully.' : 'Interview scheduled successfully.')
        setScheduleOpen(false)
        setEditingRound(null)
        setPresetApp(null)
        form.resetFields()
        queryClient.invalidateQueries({ queryKey: ['interviews-list'] })
        queryClient.invalidateQueries({ queryKey: ['all-active-applications'] })
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save interview schedule.')
    } finally {
      setSavingSchedule(false)
    }
  }

  // Handle Save General Interview
  const handleSaveGeneralSchedule = async (values) => {
    setSavingSchedule(true)
    try {
      const payload = {
        roundName: values.roundName || values.category,
        category: values.category,
        candidateName: values.candidateName,
        candidateEmail: values.candidateEmail,
        candidatePhone: values.candidatePhone,
        company: values.company || null,
        department: values.department || null,
        scheduledAt: values.scheduledAt.format('YYYY-MM-DDTHH:mm:ssZ'),
        durationMinutes: values.durationMinutes || 45,
        venue: values.venue || null,
        meetingLink: values.meetingLink || null,
        interviewerIds: values.interviewerIds,
        notes: values.notes || null,
        isGeneralInterview: true
      }

      let res
      if (editingGeneralRound) {
        res = await recruitmentService.updateInterview(editingGeneralRound.roundId, payload)
      } else {
        res = await recruitmentService.createInterview(payload)
      }

      if (res.success) {
        message.success('General interview record saved successfully.')
        setGeneralScheduleOpen(false)
        setEditingGeneralRound(null)
        generalForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['interviews-list'] })
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save general interview.')
    } finally {
      setSavingSchedule(false)
    }
  }

  // Update Status mutation helper
  const handleStatusChange = async (roundId, newStatus) => {
    try {
      const res = await recruitmentService.updateInterviewStatus(roundId, newStatus)
      if (res.success) {
        message.success(`Interview status updated to ${newStatus}`)
        queryClient.invalidateQueries({ queryKey: ['interviews-list'] })
      }
    } catch {
      message.error('Failed to update interview status.')
    }
  }

  // Handle Panelist Feedback Submission
  const handleFeedbackSubmit = async (values) => {
    setSubmittingFeedback(true)
    try {
      const payload = {
        panelistId: selectedPanelistId,
        rating: values.rating,
        feedback: values.feedback
      }
      const res = await recruitmentService.submitInterviewFeedback(payload)
      if (res.success) {
        message.success('Panelist evaluation feedback submitted successfully.')
        setFeedbackOpen(false)
        feedbackForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['interviews-list'] })
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit panelist feedback.')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Convert General Interview to Candidate (Prefills Candidate Drawer / Modal)
  const openConvertModal = (generalRound) => {
    setConvertingGeneralRound(generalRound)
    convertForm.setFieldsValue({
      firstName: generalRound.candidateName?.split(' ')[0] || generalRound.candidateName,
      lastName: generalRound.candidateName?.split(' ').slice(1).join(' ') || '',
      email: generalRound.candidateEmail,
      phone: generalRound.candidatePhone,
      source: generalRound.category === 'Walk-in' ? 'WalkIn' : generalRound.category === 'Campus Drive' ? 'CampusDrive' : 'ManualHR',
      currentCompany: generalRound.company,
      notes: generalRound.notes || `Converted from General Interview (${generalRound.category})`
    })
    setConvertModalOpen(true)
  }

  const handleConvertCandidateSubmit = async (values) => {
    setConverting(true)
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
        currentCompany: values.currentCompany || null,
        source: values.source || 'ManualHR',
        candidateStatus: 'Active'
      }

      const res = await recruitmentService.createCandidate(payload)
      if (res.success) {
        message.success(`Candidate ${values.firstName} registered successfully!`)
        // Update general interview status to Evaluated / Converted
        if (convertingGeneralRound) {
          await recruitmentService.updateInterviewStatus(convertingGeneralRound.roundId, 'Evaluated').catch(() => { })
        }
        setConvertModalOpen(false)
        convertForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['interviews-list'] })
      } else {
        message.error(res.errors?.[0] || 'Failed to convert to candidate.')
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Candidate registration failed. Duplicate check triggered.')
    } finally {
      setConverting(false)
    }
  }

  // Table Columns for Recruitment Interviews
  const recruitmentColumns = [
    {
      title: 'Candidate & Opening',
      key: 'candidate',
      width: 250,
      render: (_, r) => {
        const matchedApp = applications.find(a => a.appId === r.appId)
        const candName = r.candidateName || (matchedApp ? `${matchedApp.candidate?.firstName} ${matchedApp.candidate?.lastName || ''}` : 'Candidate')
        const jobTitle = r.jobTitle || matchedApp?.requisition?.jobTitle || 'Job Opening'

        return (
          <Space align="center" size={12}>
            <Avatar size={38} icon={<UserOutlined />} style={{ background: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#111' : '#fff', fontWeight: 700 }}>
              {candName[0]}
            </Avatar>
            <div>
              <div
                style={{ fontWeight: 700, fontSize: 13.5, color: '#3B82F6', cursor: 'pointer' }}
                onClick={() => {
                  if (matchedApp?.candidateId) navigate(`/recruitment/candidates?search=${encodeURIComponent(candName)}`)
                }}
              >
                {candName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{jobTitle}</div>
            </div>
          </Space>
        )
      }
    },
    {
      title: 'Round & Type',
      key: 'roundName',
      width: 170,
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{r.roundName}</span>
          {r.roundType && (
            <Tag color="purple" style={{ width: 100, textAlign: 'center', fontWeight: 700, fontSize: 10, margin: 0, borderRadius: 4, textTransform: 'uppercase' }}>
              {r.roundType}
            </Tag>
          )}
        </div>
      )
    },
    {
      title: 'Schedule',
      key: 'scheduledAt',
      width: 190,
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontWeight: 600, fontSize: 12.5 }}><CalendarOutlined style={{ color: '#3B82F6', marginRight: 6 }} />{dayjs(r.scheduledAt).format('DD MMM YYYY')}</div>
          <div style={{ fontSize: 11.5, opacity: 0.65 }}><ClockCircleOutlined style={{ color: '#A855F7', marginRight: 6 }} />{dayjs(r.scheduledAt).format('hh:mm A')} ({r.durationMinutes || 45} mins)</div>
        </div>
      )
    },
    {
      title: 'Panelists',
      key: 'panelists',
      width: 190,
      render: (_, r) => {
        if (!r.panelists || !r.panelists.length) return <span style={{ opacity: 0.45, fontSize: 12 }}>Unassigned</span>
        const displayPanelists = r.panelists.slice(0, 2)
        const extraCount = r.panelists.length - 2
        return (
          <Space size={4} wrap>
            {displayPanelists.map(p => (
              <Tag key={p.panelistId} color={p.status === 'Submitted' ? 'success' : 'default'} style={{ margin: 0, borderRadius: 4, fontWeight: 600 }}>
                {p.employeeName}
              </Tag>
            ))}
            {extraCount > 0 && (
              <Tag color="purple" style={{ margin: 0, borderRadius: 4, fontWeight: 700 }}>
                +{extraCount}
              </Tag>
            )}
          </Space>
        )
      }
    },
    {
      title: 'Venue / Link',
      key: 'venue',
      width: 150,
      render: (_, r) => r.meetingLink ? (
        <a href={r.meetingLink} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 12 }}>
          <VideoCameraOutlined style={{ marginRight: 4 }} /> Join Meeting
        </a>
      ) : (
        <span style={{ fontSize: 12, opacity: 0.8 }}><HomeOutlined style={{ marginRight: 4 }} /> {r.venue || 'Office'}</span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (v) => getStatusTag(v)
    },
    {
      title: 'Quick Actions',
      key: 'actions',
      width: 250,
      align: 'right',
      render: (_, r) => {
        const matchedApp = applications.find(a => a.appId === r.appId)

        return (
          <Space size={6} align="center">
            {matchedApp?.candidateId && (
              <Tooltip title="View Candidate Profile">
                <Button
                  size="small"
                  type="text"
                  icon={<UserOutlined style={{ color: '#3B82F6' }} />}
                  onClick={() => navigate(`/recruitment/candidates?search=${encodeURIComponent(r.candidateName || '')}`)}
                  style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </Tooltip>
            )}

            {matchedApp && (
              <Tooltip title="Open Application Workspace">
                <Button
                  size="small"
                  type="text"
                  icon={<FolderOpenOutlined style={{ color: '#8B5CF6' }} />}
                  onClick={() => navigate('/recruitment/applications')}
                  style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </Tooltip>
            )}

            <Tooltip title="Send Invitation Options">
              <Button
                size="small"
                type="text"
                icon={<SendOutlined style={{ color: '#06B6D4' }} />}
                onClick={() => {
                  setInviteTarget(r)
                  setInviteModalOpen(true)
                }}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Tooltip>

            <Tooltip title="Edit Schedule / Panel">
              <Button
                size="small"
                type="text"
                icon={<EditOutlined style={{ color: '#FAA71A' }} />}
                onClick={() => {
                  setEditingRound(r)
                  form.setFieldsValue({
                    appId: r.appId,
                    roundName: r.roundName,
                    roundType: r.roundType,
                    scheduledAt: dayjs(r.scheduledAt),
                    durationMinutes: r.durationMinutes || 45,
                    venue: r.venue,
                    meetingLink: r.meetingLink,
                    interviewerIds: r.panelists?.map(p => p.employeeId) || [r.interviewerId],
                    notes: r.notes
                  })
                  setScheduleOpen(true)
                }}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Tooltip>

            {r.status !== 'Cancelled' && (
              <Tooltip title="Submit Evaluator Feedback">
                <Button
                  type={r.status === 'FeedbackPending' ? 'primary' : 'default'}
                  danger={r.status === 'OverdueFeedback'}
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setSelectedRound(r)
                    const firstPending = r.panelists?.find(p => p.status === 'Pending')
                    setSelectedPanelistId(firstPending?.panelistId || r.panelists?.[0]?.panelistId)
                    setFeedbackOpen(true)
                  }}
                  style={{ borderRadius: 6, fontWeight: 600, height: 32 }}
                >
                  Feedback
                </Button>
              </Tooltip>
            )}
          </Space>
        )
      }
    }
  ]

  // Table Columns for General Interviews
  const generalColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (v) => (
        <Tag color="gold" style={{ width: 110, textAlign: 'center', fontWeight: 700, fontSize: 10, borderRadius: 4, textTransform: 'uppercase' }}>
          {v || 'GENERAL'}
        </Tag>
      )
    },
    {
      title: 'Candidate Name',
      key: 'candName',
      width: 220,
      render: (_, r) => (
        <Space align="center" size={10}>
          <Avatar size={34} style={{ background: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#111' : '#fff', fontWeight: 700 }}>
            {(r.candidateName || 'U')[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>{r.candidateName || 'Unnamed'}</div>
            {r.candidateEmail && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.candidateEmail}</div>}
          </div>
        </Space>
      )
    },
    {
      title: 'Company / Dept',
      key: 'dept',
      width: 170,
      render: (_, r) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {r.company || '-'} / {r.department || '-'}
        </span>
      )
    },
    {
      title: 'Date & Time',
      key: 'scheduledAt',
      width: 180,
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontWeight: 600, fontSize: 12.5 }}><CalendarOutlined style={{ color: '#3B82F6', marginRight: 6 }} />{dayjs(r.scheduledAt).format('DD MMM YYYY')}</div>
          <div style={{ fontSize: 11.5, opacity: 0.65 }}><ClockCircleOutlined style={{ color: '#A855F7', marginRight: 6 }} />{dayjs(r.scheduledAt).format('hh:mm A')}</div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (v) => getStatusTag(v)
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      align: 'right',
      render: (_, r) => (
        <Space size={6}>
          {r.status !== 'Completed' && (
            <Button size="small" type="default" onClick={() => handleStatusChange(r.roundId, 'Completed')} style={{ borderRadius: 6, fontWeight: 600, height: 32 }}>
              Mark Completed
            </Button>
          )}

          <Button
            type="primary"
            size="small"
            icon={<UserAddOutlined />}
            style={{ background: '#22C55E', borderColor: '#22C55E', borderRadius: 6, fontWeight: 600, height: 32 }}
            onClick={() => openConvertModal(r)}
          >
            Convert to Candidate
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Interviews Management Hub"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment', path: '/recruitment' }, { label: 'Interviews Hub' }]}
        subtitle="Enterprise control center for ATS Recruitment interviews and standalone General interviews."
        extra={
          <Space>
            {activeTab === 'recruitment' ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingRound(null)
                  setPresetApp(null)
                  form.resetFields()
                  setScheduleOpen(true)
                }}
                style={{
                  background: isDarkMode ? '#FAA71A' : '#11133F',
                  borderColor: isDarkMode ? '#FAA71A' : '#11133F',
                  color: isDarkMode ? '#11133F' : '#fff',
                  borderRadius: 8,
                  fontWeight: 600
                }}
              >
                Schedule ATS Interview
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingGeneralRound(null)
                  generalForm.resetFields()
                  setGeneralScheduleOpen(true)
                }}
                style={{
                  background: '#22C55E',
                  borderColor: '#22C55E',
                  color: '#fff',
                  borderRadius: 8,
                  fontWeight: 600
                }}
              >
                Create General Interview
              </Button>
            )}
          </Space>
        }
      />

      {/* KPI Dashboard Header */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8} md={8} lg={4}>
          <StandardKpiCard
            title="Needs Scheduling"
            value={kpis.needsScheduling}
            icon={<ExclamationCircleOutlined />}
            color="#EF4444"
            badgeText={kpis.needsScheduling > 0 ? "ACTION REQD" : "CLEAR"}
            badgeColor={kpis.needsScheduling > 0 ? "error" : "success"}
          />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <StandardKpiCard
            title="Today's"
            value={kpis.today}
            icon={<CalendarOutlined />}
            color="#3B82F6"
            badgeText="TODAY"
            badgeColor="processing"
          />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <StandardKpiCard
            title="Upcoming"
            value={kpis.upcoming}
            icon={<ClockCircleOutlined />}
            color="#A855F7"
            badgeText="SCHEDULED"
            badgeColor="purple"
          />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <StandardKpiCard
            title="Completed"
            value={kpis.completedToday}
            icon={<CheckCircleOutlined />}
            color="#22C55E"
            badgeText="DONE"
            badgeColor="success"
          />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <StandardKpiCard
            title="Pending Feedback"
            value={kpis.pendingFeedback}
            icon={<InfoCircleOutlined />}
            color="#F97316"
            badgeText={kpis.pendingFeedback > 0 ? "PENDING" : "CLEAR"}
            badgeColor={kpis.pendingFeedback > 0 ? "warning" : "default"}
          />
        </Col>
        <Col xs={12} sm={8} md={8} lg={4}>
          <StandardKpiCard
            title="Avg Duration"
            value={(() => {
              const total = (interviews || []).reduce((acc, r) => acc + (r.durationMinutes || 45), 0)
              return interviews?.length > 0 ? `${Math.round(total / interviews.length)}m` : '45m'
            })()}
            icon={<ClockCircleOutlined />}
            color="#10B981"
            badgeText="STANDARD"
            badgeColor="cyan"
          />
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: 'recruitment',
            label: <span style={{ fontWeight: 600 }}>🎯 Recruitment Interviews (ATS)</span>,
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Needs Scheduling Panel */}
                {needsSchedulingApps.length > 0 && (
                  <Card
                    title={
                      <Space align="center">
                        <ExclamationCircleOutlined style={{ color: '#EF4444', fontSize: 18 }} />
                        <span style={{ fontWeight: 700, color: '#EF4444', fontSize: 15 }}>Needs Scheduling ({needsSchedulingApps.length})</span>
                      </Space>
                    }
                    style={{ border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 12, background: 'rgba(239, 68, 68, 0.02)' }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <Table
                      dataSource={needsSchedulingApps}
                      rowKey="appId"
                      pagination={false}
                      size="middle"
                      scroll={{ x: 'max-content' }}
                      columns={[
                        {
                          title: 'Candidate Name & Email',
                          key: 'cand',
                          width: 260,
                          render: (_, r) => (
                            <Space align="center" size={12}>
                              <Avatar size={36} style={{ background: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#111' : '#fff', fontWeight: 700 }}>
                                {r.candidate?.firstName?.[0]}
                              </Avatar>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text)' }}>
                                  {r.candidate?.firstName} {r.candidate?.lastName}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                  {r.candidate?.email || 'No Email'}
                                </div>
                              </div>
                            </Space>
                          )
                        },
                        {
                          title: 'Job Opening',
                          dataIndex: ['requisition', 'jobTitle'],
                          key: 'job',
                          width: 220,
                          render: v => <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{v || 'Software Opening'}</span>
                        },
                        {
                          title: 'Current Stage',
                          dataIndex: 'currentStage',
                          key: 'stage',
                          width: 140,
                          render: v => (
                            <Tag color="orange" style={{ width: 120, textAlign: 'center', fontWeight: 700, fontSize: 10, margin: 0, borderRadius: 4, textTransform: 'uppercase' }}>
                              {v}
                            </Tag>
                          )
                        },
                        {
                          title: 'Action',
                          key: 'act',
                          align: 'right',
                          width: 180,
                          render: (_, r) => (
                            <Button
                              type="primary"
                              size="small"
                              icon={<CalendarOutlined />}
                              style={{ background: '#EF4444', borderColor: '#EF4444', fontWeight: 600, height: 32, borderRadius: 6 }}
                              onClick={() => {
                                setEditingRound(null)
                                setPresetApp(r)
                                form.setFieldsValue({
                                  appId: r.appId,
                                  roundName: `${r.currentStage} Round`,
                                  roundType: r.currentStage === 'InterviewL1' ? 'Technical' : r.currentStage === 'InterviewL2' ? 'HR' : 'Managerial'
                                })
                                setScheduleOpen(true)
                              }}
                            >
                              Schedule Interview
                            </Button>
                          )
                        }
                      ]}
                    />
                  </Card>
                )}

                {/* Sub-filters for Scheduled Recruitment Interviews */}
                <Card
                  title={<span style={{ fontWeight: 700 }}>Scheduled ATS Interviews ({filteredRecruitmentInterviews.length})</span>}
                  extra={
                    <Space>
                      <Button type={recruitmentFilter === 'all' ? 'primary' : 'default'} size="small" onClick={() => setRecruitmentFilter('all')}>All</Button>
                      <Button type={recruitmentFilter === 'today' ? 'primary' : 'default'} size="small" onClick={() => setRecruitmentFilter('today')}>Today</Button>
                      <Button type={recruitmentFilter === 'upcoming' ? 'primary' : 'default'} size="small" onClick={() => setRecruitmentFilter('upcoming')}>Upcoming</Button>
                      <Button type={recruitmentFilter === 'completed' ? 'primary' : 'default'} size="small" onClick={() => setRecruitmentFilter('completed')}>Completed</Button>
                    </Space>
                  }
                  style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 16 }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Table
                    columns={recruitmentColumns}
                    dataSource={filteredRecruitmentInterviews}
                    rowKey="roundId"
                    loading={isLoading}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <EmptyState title="No scheduled recruitment interviews" /> }}
                  />
                </Card>
              </Space>
            )
          },
          {
            key: 'general',
            label: <span style={{ fontWeight: 600 }}>🌐 General Interviews (Walk-ins / Drives)</span>,
            children: (
              <Card
                title={<span style={{ fontWeight: 700 }}>General Interviews Database ({generalInterviews.length})</span>}
                style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 16 }}
                bodyStyle={{ padding: 16 }}
              >
                <Table
                  columns={generalColumns}
                  dataSource={generalInterviews}
                  rowKey="roundId"
                  loading={isLoading}
                  scroll={{ x: 'max-content' }}
                  locale={{ emptyText: <EmptyState title="No general interviews recorded" /> }}
                />
              </Card>
            )
          }
        ]}
      />

      {/* Schedule / Edit Recruitment Interview Modal */}
      <Modal
        title={editingRound ? 'Edit ATS Interview Schedule' : 'Schedule ATS Pipeline Interview'}
        open={scheduleOpen}
        onCancel={() => { setScheduleOpen(false); setEditingRound(null); setPresetApp(null) }}
        onOk={() => form.submit()}
        confirmLoading={savingSchedule}
        width={580}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveRecruitmentSchedule} style={{ marginTop: 16 }}>
          <Form.Item name="appId" label="Select Active Application" rules={[{ required: true, message: 'Select application' }]}>
            <Select placeholder="Select Candidate..." disabled={!!presetApp || !!editingRound} dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
              {applications
                .filter(a => !['Joined', 'Rejected', 'Withdrawn'].includes(a.currentStage))
                .map(app => (
                  <Option key={app.appId} value={app.appId}>
                    {app.candidate?.firstName} {app.candidate?.lastName} · {app.requisition?.jobTitle} (Stage: {app.currentStage})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="roundName" label="Round Name" rules={[{ required: true, message: 'Round Name is required' }]}>
                <Input placeholder="e.g. Technical Round 1" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="roundType" label="Round Type" rules={[{ required: true, message: 'Select type' }]}>
                <Select placeholder="Select Type" options={INTERVIEW_ROUND_TYPES} dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scheduledAt" label="Scheduled Date & Time" rules={[{ required: true, message: 'Scheduled time is required' }]}>
                <DatePicker showTime style={{ width: '100%', borderRadius: 6 }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="durationMinutes" label="Duration (Minutes)">
                <InputNumber min={15} max={240} style={{ width: '100%', borderRadius: 6 }} placeholder="45" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="interviewerIds" label="Select Interviewers / Panelists" rules={[{ required: true, message: 'Select at least one interviewer' }]}>
            <Select
              mode="multiple"
              placeholder="Select Interviewers..."
              options={employees.map(e => ({ value: e.employeeId, label: `${e.firstName} ${e.lastName || ''}` }))}
              dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}
            />
          </Form.Item>

          <Form.Item name="meetingLink" label="Online Meeting Link">
            <Input placeholder="https://teams.microsoft.com/..." prefix={<VideoCameraOutlined />} style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item name="venue" label="Physical Location (Room/Cabin)">
            <Input placeholder="e.g. Room 3A, Tech Park Office" prefix={<HomeOutlined />} style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item name="notes" label="Special Instructions / Internal Notes">
            <Input.TextArea rows={2} style={{ borderRadius: 6 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create General Interview Modal */}
      <Modal
        title="Create Standalone General Interview"
        open={generalScheduleOpen}
        onCancel={() => setGeneralScheduleOpen(false)}
        onOk={() => generalForm.submit()}
        confirmLoading={savingSchedule}
        width={600}
      >
        <Form form={generalForm} layout="vertical" onFinish={handleSaveGeneralSchedule} style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Interview Category" rules={[{ required: true, message: 'Category is required' }]}>
                <Select placeholder="Select Category">
                  {GENERAL_CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="roundName" label="Interview Title">
                <Input placeholder="e.g. Walk-in Discussion" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="candidateName" label="Candidate Name" rules={[{ required: true, message: 'Name is required' }]}>
                <Input placeholder="Full Name" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="candidateEmail" label="Email Address">
                <Input placeholder="email@example.com" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="candidatePhone" label="Phone Number">
                <Input placeholder="+91..." style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="company" label="Company / Institute">
                <Input placeholder="Current Company / College" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Target Department">
                <Input placeholder="e.g. Engineering" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scheduledAt" label="Scheduled Date & Time" rules={[{ required: true, message: 'Date & Time is required' }]}>
                <DatePicker showTime style={{ width: '100%', borderRadius: 6 }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="durationMinutes" label="Duration (Minutes)">
                <InputNumber min={15} max={240} style={{ width: '100%', borderRadius: 6 }} placeholder="45" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="interviewerIds" label="Select Interviewers" rules={[{ required: true, message: 'Select interviewers' }]}>
            <Select
              mode="multiple"
              placeholder="Select Assigned Interviewers..."
              options={employees.map(e => ({ value: e.employeeId, label: `${e.firstName} ${e.lastName || ''}` }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="meetingLink" label="Online Meeting Link">
                <Input placeholder="https://meet.google.com/..." prefix={<VideoCameraOutlined />} style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="venue" label="Physical Location">
                <Input placeholder="Office Cabin / Room" prefix={<HomeOutlined />} style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes / Agenda">
            <Input.TextArea rows={2} style={{ borderRadius: 6 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Send Invitation Options Modal */}
      <Modal
        title="Send Interview Invitations & Links"
        open={inviteModalOpen}
        onCancel={() => setInviteModalOpen(false)}
        footer={null}
        width={500}
      >
        {inviteTarget && (
          <div style={{ marginTop: 16 }}>
            <Alert
              type="info"
              message={`Session: ${inviteTarget.roundName} with ${inviteTarget.candidateName || 'Candidate'}`}
              description={`Scheduled: ${dayjs(inviteTarget.scheduledAt).format('DD MMM YYYY, hh:mm A')}`}
              style={{ marginBottom: 20 }}
            />

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Button
                block
                icon={<MailOutlined />}
                onClick={() => {
                  recruitmentService.sendInterviewInvitation(inviteTarget.roundId)
                  message.success(`Invitation email sent to candidate (${inviteTarget.candidateEmail || 'Candidate Email'})`)
                  setInviteModalOpen(false)
                  queryClient.invalidateQueries({ queryKey: ['interviews-list'] })
                }}
              >
                Email Candidate Invitation
              </Button>

              <Button
                block
                icon={<TeamOutlined />}
                onClick={() => {
                  recruitmentService.sendInterviewInvitation(inviteTarget.roundId)
                  message.success('Invitation notification sent to assigned interviewers.')
                  setInviteModalOpen(false)
                  queryClient.invalidateQueries({ queryKey: ['interviews-list'] })
                }}
              >
                Email Assigned Interviewer Panelists
              </Button>

              <Button
                block
                icon={<CalendarOutlined />}
                onClick={() => downloadICS(inviteTarget)}
              >
                Generate & Download iCalendar (.ics) File
              </Button>

              {inviteTarget.meetingLink && (
                <Button
                  block
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(inviteTarget.meetingLink)
                    message.success('Meeting link copied to clipboard!')
                  }}
                >
                  Copy Online Meeting Link
                </Button>
              )}
            </Space>
          </div>
        )}
      </Modal>

      {/* Submit Feedback Modal */}
      <Modal
        title="Submit Panel Interview Evaluation Feedback"
        open={feedbackOpen}
        onCancel={() => setFeedbackOpen(false)}
        onOk={() => feedbackForm.submit()}
        confirmLoading={submittingFeedback}
      >
        {selectedRound && (
          <div style={{ marginTop: 16 }}>
            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Round Name">{selectedRound.roundName}</Descriptions.Item>
              <Descriptions.Item label="Scheduled Time">{dayjs(selectedRound.scheduledAt).format('DD MMM YYYY, hh:mm A')}</Descriptions.Item>
            </Descriptions>

            <Form.Item label="Select Reviewing Panelist Member" required>
              <Select
                value={selectedPanelistId}
                onChange={v => setSelectedPanelistId(v)}
              >
                {selectedRound.panelists
                  ?.filter(p => p.status !== 'Submitted')
                  .map(p => (
                    <Option key={p.panelistId} value={p.panelistId}>{p.employeeName}</Option>
                  ))}
              </Select>
            </Form.Item>

            <Form form={feedbackForm} layout="vertical" onFinish={handleFeedbackSubmit}>
              <Form.Item name="rating" label="Rating (1 to 5 Stars)" rules={[{ required: true, message: 'Rating is required' }]}>
                <InputNumber min={1} max={5} step={0.5} style={{ width: '100%', borderRadius: 6 }} placeholder="4.5" />
              </Form.Item>

              <Form.Item name="feedback" label="Technical Evaluation Feedback Notes" rules={[{ required: true, message: 'Feedback notes are required' }]}>
                <Input.TextArea rows={4} placeholder="Describe candidate strengths, weaknesses, technical answers..." style={{ borderRadius: 6 }} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* General Interview -> Candidate Conversion Modal (Human in the loop review) */}
      <Modal
        title="Convert General Interview to Candidate Record"
        open={convertModalOpen}
        onCancel={() => setConvertModalOpen(false)}
        onOk={() => convertForm.submit()}
        confirmLoading={converting}
        okText="Register Candidate"
        okButtonProps={{ style: { background: '#22C55E', borderColor: '#22C55E' } }}
      >
        <Alert
          type="info"
          message="Review & Register Candidate Profile"
          description="Prefilled details from General Interview. HR can edit details before saving to enforce duplicate candidate detection."
          style={{ marginBottom: 16 }}
        />
        <Form form={convertForm} layout="vertical" onFinish={handleConvertCandidateSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'First name is required' }]}>
                <Input style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name">
                <Input style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
            <Input style={{ borderRadius: 6 }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone Number">
                <Input style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="Source">
                <Input style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="currentCompany" label="Current Company">
            <Input style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item name="notes" label="Remarks / Notes">
            <Input.TextArea rows={2} style={{ borderRadius: 6 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
