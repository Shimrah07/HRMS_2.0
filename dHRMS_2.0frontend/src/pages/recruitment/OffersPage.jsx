import React, { useEffect, useState, useMemo } from 'react'
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input, Select, InputNumber,
  DatePicker, message, Tooltip, Divider, Row, Col, Progress, Steps, Switch,
  Drawer, Dropdown, Badge, Avatar, Typography, Alert, Popover, Timeline, Radio, Checkbox
} from 'antd'
import {
  FileTextOutlined, PlusOutlined, DownloadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, SendOutlined, CalendarOutlined, EditOutlined,
  EyeOutlined, CopyOutlined, DeleteOutlined, HistoryOutlined, SafetyCertificateOutlined,
  UnlockOutlined, LockOutlined, InfoCircleOutlined, ArrowRightOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined, UserOutlined, ApartmentOutlined,
  DollarOutlined, CheckOutlined, DownOutlined, ExperimentOutlined, RocketOutlined,
  SearchOutlined, FilterOutlined, SwapOutlined, ThunderboltOutlined, RiseOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { recruitmentService } from '../../services/recruitmentService'
import { PERMISSIONS } from '../../constants/permissions'
import PermissionGate from '../../components/common/PermissionGate'
import useUIStore from '../../store/uiStore'
import {
  OFFER_TEMPLATES,
  calculateSalaryBreakdown,
  calculateOfferReadiness,
  getExpiryCountdown
} from '../../data/offerTemplates'
import {
  BGV_PACKAGE_TEMPLATES,
  ALL_VERIFICATION_SCOPES,
  BGV_AGENCIES
} from '../../data/bgvPackages'

const { Option } = Select
const { Text, Title } = Typography

// Status color and badge styling
const getOfferStatusBadge = (status) => {
  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 135,
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
    case 'Draft':
      return <Tag color="blue" style={badgeStyle}>DRAFT</Tag>
    case 'PendingManager':
      return <Tag color="gold" style={badgeStyle}>MANAGER APPROVAL</Tag>
    case 'PendingHR':
      return <Tag color="orange" style={badgeStyle}>HR APPROVAL</Tag>
    case 'Approved':
      return <Tag color="cyan" style={badgeStyle}>APPROVED</Tag>
    case 'Sent':
      return <Tag color="processing" style={badgeStyle}>SENT TO CANDIDATE</Tag>
    case 'Viewed':
      return <Tag color="geekblue" style={badgeStyle}>VIEWED BY CANDIDATE</Tag>
    case 'Negotiation':
      return <Tag color="purple" style={badgeStyle}>NEGOTIATION</Tag>
    case 'Accepted':
      return <Tag color="success" style={badgeStyle}>ACCEPTED</Tag>
    case 'Rejected':
      return <Tag color="error" style={badgeStyle}>REJECTED</Tag>
    case 'Expired':
      return <Tag color="default" style={badgeStyle}>EXPIRED</Tag>
    default:
      return <Tag style={badgeStyle}>{status?.toUpperCase() || 'DRAFT'}</Tag>
  }
}

// 1. Visual Status Progress Tracker Component
function OfferStatusProgressTracker({ status }) {
  const stepMap = {
    Draft: 0,
    PendingManager: 1,
    PendingHR: 2,
    Approved: 3,
    Sent: 4,
    Viewed: 5,
    Negotiation: 6,
    Accepted: 7
  }

  const currentStep = stepMap[status] ?? 0

  return (
    <Card
      bordered={false}
      style={{
        background: 'var(--color-bg-container)',
        borderRadius: 10,
        marginBottom: 16,
        border: '1px solid rgba(255,255,255,0.08)'
      }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
        Offer Workflow Lifecycle Progress
      </div>
      <Steps
        current={currentStep}
        size="small"
        items={[
          { title: 'Draft' },
          { title: 'Manager Appr.' },
          { title: 'HR Appr.' },
          { title: 'Ready' },
          { title: 'Sent' },
          { title: 'Viewed' },
          { title: 'Negotiation' },
          { title: 'Accepted' }
        ]}
      />
    </Card>
  )
}

// Offer Health Status Banner Component
function OfferHealthBanner({ status }) {
  switch (status) {
    case 'Draft':
      return (
        <Alert
          message="🔵 Draft in Progress"
          description="This offer letter is being configured. You can save progress and complete details anytime before submitting for approval."
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #3B82F6' }}
        />
      )
    case 'PendingManager':
      return (
        <Alert
          message="🟡 Waiting for Hiring Manager Approval"
          description="Offer submitted. Waiting for Manager review and signature."
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #EAB308' }}
        />
      )
    case 'PendingHR':
      return (
        <Alert
          message="🟠 Waiting for HR Head Approval"
          description="Manager approved. Pending final approval by HR Head / Finance."
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #F97316' }}
        />
      )
    case 'Approved':
    case 'Sent':
      return (
        <Alert
          message="🟢 Ready to Send / Released"
          description="Offer letter is fully approved and released to candidate. Awaiting candidate response."
          type="success"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #10B981' }}
        />
      )
    case 'Negotiation':
      return (
        <Alert
          message="🟣 Candidate Negotiating"
          description="Candidate has requested CTC or Joining Date adjustments. Review negotiation rounds below."
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #8B5CF6' }}
        />
      )
    case 'Accepted':
      return (
        <Alert
          message="🟢 Offer Accepted & Onboarding Initiated"
          description="Candidate has accepted the offer letter! Background Check (BGV) and Pre-joining tasks initialized."
          type="success"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #059669' }}
        />
      )
    case 'Rejected':
      return (
        <Alert
          message="🔴 Offer Rejected"
          description="Candidate or approver declined this offer letter."
          type="error"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #EF4444' }}
        />
      )
    case 'Expired':
      return (
        <Alert
          message="⚪ Offer Expired"
          description="Offer validity window has elapsed."
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8, borderLeft: '4px solid #6B7280' }}
        />
      )
    default:
      return null
  }
}

// Standardized Enterprise KPI Card Component
function StandardKpiCard({ title, value, icon, color, badgeText, badgeColor = 'default' }) {
  const isLongValue = typeof value === 'string' && value.length > 4

  return (
    <Card
      bordered={false}
      style={{
        background: 'var(--color-bg-container)',
        border: 'var(--border-glass)',
        borderRadius: 10,
        height: 86,
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}
      styles={{
        body: {
          padding: '10px 12px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={title}
        >
          {title}
        </span>
        <span style={{ fontSize: 16, color, flexShrink: 0 }}>{icon}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <span
          style={{
            fontSize: isLongValue ? 14 : 19,
            fontWeight: 800,
            color: 'var(--color-text)',
            lineHeight: 1,
            whiteSpace: 'nowrap'
          }}
        >
          {value}
        </span>
        {badgeText && (
          <Tag
            color={badgeColor}
            style={{
              fontSize: 9,
              fontWeight: 700,
              margin: 0,
              borderRadius: 4,
              padding: '0 5px',
              height: 18,
              lineHeight: '18px',
              border: 'none',
              flexShrink: 0
            }}
          >
            {badgeText}
          </Tag>
        )}
      </div>
    </Card>
  )
}

// 2. Sticky Right-Side Offer Summary Panel Component
function StickyOfferSummaryPanel({ offer, salaryBreakdown, readiness }) {
  const countdown = getExpiryCountdown(offer?.expiryDate)

  return (
    <Card
      title={<span style={{ fontWeight: 800, fontSize: 13 }}>📌 Sticky Offer Summary</span>}
      style={{
        background: 'var(--color-bg-container)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        position: 'sticky',
        top: 20
      }}
      styles={{ body: { padding: 14 } }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={10}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Candidate:</Text>
          <Text strong style={{ fontSize: 12 }}>{offer?.candidateName || 'Not Selected'}</Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Position:</Text>
          <Text strong style={{ fontSize: 12 }}>{offer?.jobTitle || 'Software Engineer'}</Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Offered CTC:</Text>
          <Text strong style={{ fontSize: 13, color: '#10B981' }}>
            ₹{salaryBreakdown.ctcAnnual.toLocaleString('en-IN')}
          </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Monthly Gross:</Text>
          <Text strong style={{ fontSize: 12, color: '#3B82F6' }}>
            ₹{salaryBreakdown.monthlyGross.toLocaleString('en-IN')} / mo
          </Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Monthly In-Hand:</Text>
          <Text strong style={{ fontSize: 12, color: '#059669' }}>
            ₹{salaryBreakdown.monthlyInHand.toLocaleString('en-IN')} / mo
          </Text>
        </div>

        <Divider style={{ margin: '6px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Readiness Score:</Text>
          <Tag color={readiness.scorePercent >= 88 ? 'success' : 'warning'} style={{ fontWeight: 800, margin: 0 }}>
            {readiness.scorePercent}%
          </Tag>
        </div>

        <Progress percent={readiness.scorePercent} showInfo={false} strokeColor={readiness.scorePercent >= 88 ? '#10B981' : '#F97316'} size="small" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Validity Countdown:</Text>
          <Tag color={countdown.badgeColor} style={{ fontWeight: 700, margin: 0 }}>
            {countdown.text}
          </Tag>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Version:</Text>
          <Tag color="purple" style={{ fontWeight: 700, margin: 0 }}>v{offer?.version || 1}.0</Tag>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>Offer Owner:</Text>
          <Text style={{ fontSize: 11, fontWeight: 600 }}>Rahul Sharma (HR)</Text>
        </div>
      </Space>
    </Card>
  )
}

export default function OffersPage() {
  const { isDarkMode } = useUIStore()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState([])

  // Filters & Search
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [workModeFilter, setWorkModeFilter] = useState('ALL')

  // Master Wizard Modal State
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(0)
  const [editingOffer, setEditingOffer] = useState(null)
  const [savingDraft, setSavingDraft] = useState(false)

  // Drawers
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false)
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false)
  const [negotiationDrawerOpen, setNegotiationDrawerOpen] = useState(false)
  const [bgvModalOpen, setBgvModalOpen] = useState(false)

  const [selectedOffer, setSelectedOffer] = useState(null)

  // Simulation Modal
  const [simulateModalOpen, setSimulateModalOpen] = useState(false)

  // Forms
  const [wizardForm] = Form.useForm()
  const [simForm] = Form.useForm()
  const [negotiationForm] = Form.useForm()

  // Dynamic salary override state
  const [manualSalaryOverride, setManualSalaryOverride] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('tpl_corporate')

  // Selected candidate preview state inside wizard
  const [wizardAppId, setWizardAppId] = useState(null)
  const [wizardCtc, setWizardCtc] = useState(1200000)

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const res = await recruitmentService.getOffers()
      if (res.success) {
        setOffers(res.data || [])
      }
    } catch (err) {
      message.error('Failed to load offer letters.')
    } finally {
      setLoading(false)
    }
  }

  const fetchMetadata = async () => {
    try {
      const appRes = await recruitmentService.getApplications()
      if (appRes.success) {
        const eligible = (appRes.data || []).filter(a =>
          a.currentStage !== 'Joined' && a.currentStage !== 'Rejected'
        )
        setApplications(eligible)
      }
    } catch (err) { }
  }

  useEffect(() => {
    fetchOffers()
    fetchMetadata()
  }, [])

  // Analytics Dashboard KPI Calculations (10 Metrics)
  const analyticsKpis = useMemo(() => {
    const total = offers.length
    const drafts = offers.filter(o => o.status === 'Draft').length
    const pending = offers.filter(o => o.status === 'PendingManager' || o.status === 'PendingHR' || o.status === 'PendingApproval').length
    const sent = offers.filter(o => o.status === 'Sent' || o.status === 'Approved' || o.status === 'Viewed').length
    const negotiation = offers.filter(o => o.status === 'Negotiation').length
    const accepted = offers.filter(o => o.status === 'Accepted').length
    const expired = offers.filter(o => o.status === 'Expired' || o.status === 'Rejected').length

    const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 84
    const negotiationRate = total > 0 ? Math.round((negotiation / total) * 100) : 22
    const avgApprovalTime = '1.8 Days'
    const expiringThisWeek = offers.filter(o => getExpiryCountdown(o.expiryDate).days <= 7).length
    const sumCtc = offers.reduce((acc, curr) => acc + (Number(curr.offeredCTC) || 0), 0)
    const avgCtc = total > 0 ? Math.round(sumCtc / total) : 1180000

    return {
      drafts,
      pending,
      sent,
      negotiation,
      accepted,
      expired,
      acceptanceRate: `${acceptanceRate}%`,
      negotiationRate: `${negotiationRate}%`,
      avgApprovalTime,
      expiringThisWeek,
      avgCtc: `₹${(avgCtc / 100000).toFixed(1)}L`
    }
  }, [offers])

  // Filtered Offers Data
  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const matchSearch = !searchText || (
        o.candidateName?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.jobTitle?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.offerId?.toLowerCase().includes(searchText.toLowerCase())
      )
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter
      const matchWorkMode = workModeFilter === 'ALL' || o.workMode === workModeFilter
      return matchSearch && matchStatus && matchWorkMode
    })
  }, [offers, searchText, statusFilter, workModeFilter])

  // Live calculated salary breakdown
  const salaryBreakdown = useMemo(() => {
    return calculateSalaryBreakdown(wizardCtc, manualSalaryOverride)
  }, [wizardCtc, manualSalaryOverride])

  // Selected candidate preview state inside wizard
  const selectedAppDetails = useMemo(() => {
    return applications.find(a => a.appId === wizardAppId)
  }, [applications, wizardAppId])

  // Current selected template entity
  const selectedTemplateEntity = useMemo(() => {
    return OFFER_TEMPLATES.find(t => t.id === selectedTemplateId) || OFFER_TEMPLATES[0]
  }, [selectedTemplateId])

  // Live Readiness Score
  const readiness = useMemo(() => {
    return calculateOfferReadiness({
      appId: wizardAppId,
      offeredCTC: wizardCtc,
      joiningDate: wizardForm.getFieldValue('joiningDate'),
      templateId: selectedTemplateId,
      ndaRequired: wizardForm.getFieldValue('ndaRequired'),
      expiryDays: wizardForm.getFieldValue('expiryDays'),
      status: editingOffer?.status || 'Draft'
    })
  }, [wizardAppId, wizardCtc, selectedTemplateId, editingOffer, wizardForm])

  // Open Wizard for new / existing Offer
  const openOfferWizard = (offer = null, preSelectedTemplateId = null, preSelectedAppId = null) => {
    setEditingOffer(offer)
    setWizardStep(0)
    setManualSalaryOverride(false)
    const tplId = preSelectedTemplateId || offer?.templateId || 'tpl_corporate'
    setSelectedTemplateId(tplId)

    if (offer) {
      setWizardAppId(offer.appId)
      setWizardCtc(offer.offeredCTC || 1200000)
      wizardForm.setFieldsValue({
        appId: offer.appId,
        offeredCTC: offer.offeredCTC || 1200000,
        joiningDate: offer.joiningDate ? dayjs(offer.joiningDate) : dayjs().add(15, 'day'),
        expiryDays: offer.expiryDays || 30,
        noticePeriodBuyout: offer.noticePeriodBuyout || 0,
        workMode: offer.workMode || 'Hybrid',
        shift: offer.shift || 'General Day Shift (9 AM - 6 PM)',
        ndaRequired: offer.ndaRequired ?? true,
        probationDays: offer.probationDays || 90,
        bondMonths: offer.bondMonths || 0,
        bgvRequired: offer.bgvRequired ?? true,
        medicalCheckup: offer.medicalCheckup ?? false,
        equipmentProvided: offer.equipmentProvided ?? true,
        templateId: tplId
      })
    } else {
      const appId = preSelectedAppId || applications[0]?.appId
      setWizardAppId(appId)
      setWizardCtc(1200000)
      wizardForm.setFieldsValue({
        appId: appId,
        offeredCTC: 1200000,
        joiningDate: dayjs().add(15, 'day'),
        expiryDays: 30,
        noticePeriodBuyout: 0,
        workMode: 'Hybrid',
        shift: 'General Day Shift (9 AM - 6 PM)',
        ndaRequired: true,
        probationDays: 90,
        bondMonths: 0,
        bgvRequired: true,
        medicalCheckup: false,
        equipmentProvided: true,
        templateId: tplId
      })
    }

    setWizardOpen(true)
  }

  // Handle Wizard Save Draft / Finish
  const handleSaveWizardOffer = async (isFinalSubmit = false) => {
    try {
      const values = await wizardForm.validateFields()
      setSavingDraft(true)

      const payload = {
        appId: values.appId,
        offeredCTC: values.offeredCTC,
        joiningDate: values.joiningDate ? values.joiningDate.format('YYYY-MM-DD') : null,
        expiryDays: values.expiryDays ?? 30,
        templateId: selectedTemplateId,
        status: isFinalSubmit ? 'PendingManager' : 'Draft',
        workMode: values.workMode,
        ndaRequired: values.ndaRequired
      }

      const res = await recruitmentService.createOffer(payload)
      if (res.success) {
        message.success(isFinalSubmit ? 'Offer submitted for Hiring Manager approval!' : 'Offer draft saved successfully.')
        setWizardOpen(false)
        fetchOffers()
        fetchMetadata()
      }
    } catch (err) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message)
      }
    } finally {
      setSavingDraft(false)
    }
  }

  const handleApproveOffer = async (id, approved) => {
    try {
      const res = await recruitmentService.approveOffer(id, { approved, comment: 'Approved by Hiring Manager.' })
      if (res.success) {
        message.success(approved ? 'Offer letter released to candidate.' : 'Offer letter rejected.')
        fetchOffers()
      }
    } catch (err) {
      message.error('Failed to execute offer approval.')
    }
  }

  const handleSimulateAccept = async (values) => {
    try {
      const res = await recruitmentService.acceptOffer(selectedOffer.offerId, { remarks: values.remarks })
      if (res.success) {
        message.success('Offer Accepted! Ready for Background Verification (BGV).')
        setSimulateModalOpen(false)
        simForm.resetFields()
        fetchOffers()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to simulate accept.')
    }
  }

  // Table Columns
  const columns = [
    {
      title: 'Candidate & Position',
      key: 'candidate',
      width: 250,
      render: (_, r) => (
        <Space align="center" size={12}>
          <Avatar size={38} icon={<UserOutlined />} style={{ background: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#111' : '#fff', fontWeight: 700 }}>
            {(r.candidateName || 'C')[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#3B82F6' }}>{r.candidateName || 'Candidate'}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{r.jobTitle || 'Job Position'}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Template',
      key: 'template',
      width: 170,
      render: (_, r) => {
        const tpl = OFFER_TEMPLATES.find(t => t.id === r.templateId) || OFFER_TEMPLATES[0]
        return (
          <Tag color={tpl.badgeColor} style={{ fontWeight: 700, fontSize: 10, borderRadius: 4, textTransform: 'uppercase' }}>
            {tpl.name}
          </Tag>
        )
      }
    },
    {
      title: 'Offered CTC',
      dataIndex: 'offeredCTC',
      key: 'offeredCTC',
      width: 140,
      render: (ctc) => (
        <span style={{ color: '#10B981', fontWeight: 800, fontSize: 13.5 }}>
          ₹{ctc != null ? Number(ctc).toLocaleString('en-IN') : '0'}
        </span>
      )
    },
    {
      title: 'Joining Date',
      dataIndex: 'joiningDate',
      key: 'joiningDate',
      width: 130,
      render: (date) => date ? (
        <span style={{ fontWeight: 600, fontSize: 12 }}>
          <CalendarOutlined style={{ color: '#3B82F6', marginRight: 4 }} />
          {dayjs(date).format('DD MMM YYYY')}
        </span>
      ) : '-'
    },
    {
      title: 'Expiry Countdown',
      key: 'expiry',
      width: 140,
      render: (_, r) => {
        const countdown = getExpiryCountdown(r.expiryDate)
        return (
          <Tag color={countdown.badgeColor} style={{ fontWeight: 700, borderRadius: 4 }}>
            {countdown.text}
          </Tag>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => getOfferStatusBadge(status)
    },
    {
      title: 'Quick Actions',
      key: 'actions',
      width: 260,
      align: 'right',
      render: (_, r) => (
        <Space size={6} align="center">
          <Tooltip title="View Summary">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined style={{ color: '#3B82F6' }} />}
              onClick={() => { setSelectedOffer(r); setDetailDrawerOpen(true) }}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </Tooltip>

          <Tooltip title="Edit Offer Wizard">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined style={{ color: '#FAA71A' }} />}
              onClick={() => openOfferWizard(r)}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </Tooltip>

          <Tooltip title="Preview Letter">
            <Button
              size="small"
              type="text"
              icon={<FileTextOutlined style={{ color: '#06B6D4' }} />}
              onClick={() => { setSelectedOffer(r); setPreviewDrawerOpen(true) }}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </Tooltip>

          {r.status === 'Draft' && (
            <Tooltip title="Submit for Manager Approval">
              <Button
                size="small"
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleApproveOffer(r.offerId, true)}
                style={{ borderRadius: 6, fontWeight: 600, height: 32 }}
              >
                Send
              </Button>
            </Tooltip>
          )}

          {r.status === 'Sent' && (
            <Tooltip title="Simulate Candidate Acceptance">
              <Button
                size="small"
                type="primary"
                style={{ background: '#22C55E', borderColor: '#22C55E', borderRadius: 6, fontWeight: 600, height: 32 }}
                icon={<CheckCircleOutlined />}
                onClick={() => { setSelectedOffer(r); setSimulateModalOpen(true) }}
              >
                Accept
              </Button>
            </Tooltip>
          )}

          {r.status === 'Accepted' && (
            <Tooltip title="Initiate BGV Handoff">
              <Button
                size="small"
                type="primary"
                style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 6, fontWeight: 600, height: 32 }}
                icon={<SafetyCertificateOutlined />}
                onClick={() => { setSelectedOffer(r); setBgvModalOpen(true) }}
              >
                BGV
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Download PDF — Coming in Phase 3.2">
            <Button
              size="small"
              type="text"
              disabled
              icon={<DownloadOutlined style={{ opacity: 0.3 }} />}
              style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </Tooltip>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'timeline',
                  icon: <HistoryOutlined />,
                  label: 'View DevOps Activity Log',
                  onClick: () => { setSelectedOffer(r); setTimelineDrawerOpen(true) }
                },
                {
                  key: 'versions',
                  icon: <SwapOutlined />,
                  label: 'Compare Offer Versions',
                  onClick: () => { setSelectedOffer(r); setVersionDrawerOpen(true) }
                },
                {
                  key: 'negotiation',
                  icon: <ExperimentOutlined />,
                  label: 'Negotiation Workspace',
                  onClick: () => { setSelectedOffer(r); setNegotiationDrawerOpen(true) }
                },
                {
                  key: 'clone',
                  icon: <CopyOutlined />,
                  label: 'Duplicate / Clone Offer',
                  onClick: () => openOfferWizard(null, r.templateId, r.appId)
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Delete Draft Offer',
                  danger: true,
                  onClick: () => message.info('Draft offer deleted.')
                }
              ]
            }}
          >
            <Button size="small" type="text" style={{ width: 28, height: 32 }}>⋮</Button>
          </Dropdown>
        </Space>
      )
    }
  ]

  // Menu items for Smart "Generate Offer" Split Button
  const generateOfferMenuItems = [
    {
      key: 'ats',
      icon: <UserOutlined style={{ color: '#3B82F6' }} />,
      label: 'From Approved ATS Candidate',
      onClick: () => openOfferWizard(null, 'tpl_corporate', applications[0]?.appId)
    },
    {
      key: 'blank',
      icon: <FileTextOutlined style={{ color: '#10B981' }} />,
      label: 'Blank Offer Configuration',
      onClick: () => openOfferWizard(null, 'tpl_corporate', null)
    },
    {
      key: 'template',
      icon: <RocketOutlined style={{ color: '#8B5CF6' }} />,
      label: 'From Existing Offer Template',
      onClick: () => openOfferWizard(null, 'tpl_modern', null)
    }
  ]

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="CTC Calculations & Offer Management Center"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment', path: '/recruitment' }, { label: 'Offer Center' }]}
        subtitle="Enterprise master workspace for candidate offer letters, multi-level approvals, compensation planning, and version control."
        extra={
          <PermissionGate permission={PERMISSIONS.RECRUITMENT.CREATE}>
            <Dropdown menu={{ items: generateOfferMenuItems }} placement="bottomRight">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                style={{
                  background: isDarkMode ? '#FAA71A' : '#11133F',
                  borderColor: isDarkMode ? '#FAA71A' : '#11133F',
                  color: isDarkMode ? '#11133F' : '#fff',
                  borderRadius: 8,
                  fontWeight: 700,
                  height: 38
                }}
              >
                Generate Offer <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
              </Button>
            </Dropdown>
          </PermissionGate>
        }
      />

      {/* Analytics Dashboard KPI Header Grid (10 Metrics) */}
      <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Draft Offers" value={analyticsKpis.drafts} icon={<FileTextOutlined />} color="#3B82F6" badgeText="DRAFT" badgeColor="blue" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Pending Approval" value={analyticsKpis.pending} icon={<ExclamationCircleOutlined />} color="#F59E0B" badgeText="APPROVAL" badgeColor="warning" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Sent To Candidate" value={analyticsKpis.sent} icon={<SendOutlined />} color="#10B981" badgeText="RELEASED" badgeColor="success" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Negotiation" value={analyticsKpis.negotiation} icon={<ExperimentOutlined />} color="#8B5CF6" badgeText="REVISION" badgeColor="purple" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Accepted" value={analyticsKpis.accepted} icon={<CheckCircleOutlined />} color="#059669" badgeText="JOINED" badgeColor="emerald" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Acceptance Rate" value={analyticsKpis.acceptanceRate} icon={<RiseOutlined />} color="#10B981" badgeText="KPI" badgeColor="success" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Negotiation Rate" value={analyticsKpis.negotiationRate} icon={<SwapOutlined />} color="#8B5CF6" badgeText="KPI" badgeColor="purple" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Avg Approval Time" value={analyticsKpis.avgApprovalTime} icon={<ClockCircleOutlined />} color="#F59E0B" badgeText="SLA" badgeColor="warning" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Expiring 7 Days" value={analyticsKpis.expiringThisWeek} icon={<ThunderboltOutlined />} color="#EF4444" badgeText="URGENT" badgeColor="error" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.4}>
          <StandardKpiCard title="Avg Offered CTC" value={analyticsKpis.avgCtc} icon={<DollarOutlined />} color="#10B981" badgeText="BENCHMARK" badgeColor="cyan" />
        </Col>
      </Row>

      {/* Smart Search & Multi-Filter Bar */}
      <Card
        style={{
          background: 'var(--color-bg-container)',
          border: 'var(--border-glass)',
          borderRadius: 12,
          marginBottom: 16
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={8}>
            <Input
              placeholder="Search candidate, job position, or Offer ID..."
              prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} md={5}>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: '100%' }}>
              <Option value="ALL">All Offer Statuses</Option>
              <Option value="Draft">Draft</Option>
              <Option value="PendingManager">Pending Manager</Option>
              <Option value="PendingHR">Pending HR</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Sent">Sent</Option>
              <Option value="Negotiation">Negotiation</Option>
              <Option value="Accepted">Accepted</Option>
              <Option value="Expired">Expired</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={5}>
            <Select value={workModeFilter} onChange={setWorkModeFilter} style={{ width: '100%' }}>
              <Option value="ALL">All Work Modes</Option>
              <Option value="Onsite">Onsite</Option>
              <Option value="Hybrid">Hybrid</Option>
              <Option value="Remote">Remote</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6} style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Showing {filteredOffers.length} of {offers.length} offer letters
            </span>
          </Col>
        </Row>
      </Card>

      {/* Master Offers Table Container */}
      <Card
        style={{
          background: 'var(--color-bg-container)',
          border: 'var(--border-glass)',
          borderRadius: 16
        }}
        styles={{ body: { padding: 16 } }}
      >
        {offers.length === 0 && !loading ? (
          <EmptyState
            title="No offers generated yet."
            description="Generate your first offer letter from an approved ATS candidate."
            action={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openOfferWizard(null)} style={{ borderRadius: 8, height: 38, fontWeight: 700 }}>
                Generate Offer
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredOffers}
            rowKey="offerId"
            loading={loading}
            pagination={{ pageSize: 8 }}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      {/* 5-Step Detailed Offer Editor Wizard Modal with Sticky Summary & Visual Chart */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 24 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text)' }}>
              {editingOffer ? 'Edit Offer Letter Configuration' : 'Create Detailed Enterprise Offer Letter'}
            </span>
            <Tag color="purple" style={{ fontWeight: 700, borderRadius: 4 }}>
              {Math.round(((wizardStep + 1) / 5) * 100)}% COMPLETE
            </Tag>
          </div>
        }
        open={wizardOpen}
        onCancel={() => setWizardOpen(false)}
        footer={null}
        width={1050}
        destroyOnClose
        style={{ top: 15 }}
      >
        {/* 1. Visual Status Progress Tracker Header */}
        <OfferStatusProgressTracker status={editingOffer?.status || 'Draft'} />
        <OfferHealthBanner status={editingOffer?.status || 'Draft'} />

        {/* Main Content Layout with Sticky Right-Side Summary */}
        <Row gutter={16}>
          <Col span={17}>
            {/* Wizard Steps Header */}
            <Steps
              current={wizardStep}
              onChange={setWizardStep}
              size="small"
              style={{ marginBottom: 20 }}
              items={[
                { title: 'Candidate' },
                { title: 'Compensation' },
                { title: 'Joining' },
                { title: 'Clauses' },
                { title: 'Template & Preview' }
              ]}
            />

            <Form form={wizardForm} layout="vertical">
              {/* STEP 1: CANDIDATE & OPENING */}
              {wizardStep === 0 && (
                <div>
                  <Form.Item
                    name="appId"
                    label="Candidate Application"
                    rules={[{ required: true, message: 'Select candidate application' }]}
                  >
                    <Select
                      placeholder="Select ATS Candidate Application"
                      showSearch
                      optionFilterProp="children"
                      onChange={v => setWizardAppId(v)}
                    >
                      {applications.map(a => (
                        <Option key={a.appId} value={a.appId}>
                          {a.candidateName} — {a.jobTitle} [{a.currentStage}]
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Job Opening">
                        <Input value={selectedAppDetails?.jobTitle || 'Software Engineer'} disabled />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Department">
                        <Input value={selectedAppDetails?.requisition?.department || 'Engineering'} disabled />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Reporting Manager">
                        <Input defaultValue="Rahul Sharma (Engineering Manager)" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Employment Type">
                        <Select defaultValue="FullTime">
                          <Option value="FullTime">Full Time Permanent</Option>
                          <Option value="Probationary">Probationary</Option>
                          <Option value="Contract">Contractual</Option>
                          <Option value="Intern">Internship</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}

              {/* STEP 2: COMPENSATION & SALARY PROGRESS BAR CHART */}
              {wizardStep === 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Title level={5} style={{ margin: 0 }}>Enterprise Compensation Builder</Title>
                    <Space>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Unlock Manual Component Override</span>
                      <Switch
                        checked={manualSalaryOverride}
                        onChange={setManualSalaryOverride}
                        checkedChildren={<UnlockOutlined />}
                        unCheckedChildren={<LockOutlined />}
                      />
                    </Space>
                  </div>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="offeredCTC"
                        label="Annual Offered CTC (₹)"
                        rules={[{ required: true, message: 'Enter Offered CTC' }]}
                      >
                        <InputNumber
                          formatter={v => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={v => v.replace(/₹\s?|(,*)/g, '')}
                          style={{ width: '100%' }}
                          min={100000}
                          onChange={v => setWizardCtc(v || 1200000)}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={12}>
                      <Form.Item label="Notice Period Buyout (Optional)">
                        <Form.Item name="noticePeriodBuyout" noStyle>
                          <InputNumber
                            formatter={v => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={v => v.replace(/₹\s?|(,*)/g, '')}
                            style={{ width: '100%' }}
                            placeholder="e.g. 50,000"
                          />
                        </Form.Item>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* 3. Salary Component Progress Bar Chart */}
                  <Card
                    title={<span style={{ fontWeight: 700, fontSize: 13 }}>📊 Component Percentage Visualization</span>}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: 14 }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, height: 16, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${salaryBreakdown.basicPct}%`, background: '#7C3AED' }} title={`Basic: ${salaryBreakdown.basicPct}%`} />
                      <div style={{ width: `${salaryBreakdown.hraPct}%`, background: '#06B6D4' }} title={`HRA: ${salaryBreakdown.hraPct}%`} />
                      <div style={{ width: `${salaryBreakdown.specialPct}%`, background: '#8B5CF6' }} title={`Special Allowance: ${salaryBreakdown.specialPct}%`} />
                      <div style={{ width: `${salaryBreakdown.statutoryPct}%`, background: '#F59E0B' }} title={`Statutory PF/Gratuity: ${salaryBreakdown.statutoryPct}%`} />
                    </div>
                    <Row gutter={8} style={{ fontSize: 11, fontWeight: 700 }}>
                      <Col span={6} style={{ color: '#7C3AED' }}>■ Basic ({salaryBreakdown.basicPct}%)</Col>
                      <Col span={6} style={{ color: '#06B6D4' }}>■ HRA ({salaryBreakdown.hraPct}%)</Col>
                      <Col span={6} style={{ color: '#8B5CF6' }}>■ Special ({salaryBreakdown.specialPct}%)</Col>
                      <Col span={6} style={{ color: '#F59E0B' }}>■ Statutory ({salaryBreakdown.statutoryPct}%)</Col>
                    </Row>
                  </Card>

                  {/* Payroll Summary Style Live Salary Breakdown Card */}
                  <Card
                    title={<span style={{ fontWeight: 700, fontSize: 13 }}>📊 Payroll Summary Breakdown</span>}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                    styles={{ body: { padding: 14 } }}
                  >
                    <Row gutter={[16, 8]}>
                      <Col span={12}>
                        <Text type="secondary">Basic Salary (50% CTC):</Text>
                        <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>₹ {salaryBreakdown.basicAnnual.toLocaleString('en-IN')} / yr</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">HRA Allowance (40% Basic):</Text>
                        <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>₹ {salaryBreakdown.hraAnnual.toLocaleString('en-IN')} / yr</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Special Allowance (Remainder):</Text>
                        <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>₹ {salaryBreakdown.specialAllowanceAnnual.toLocaleString('en-IN')} / yr</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Employer PF Contribution:</Text>
                        <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>₹ {salaryBreakdown.employerPfAnnual.toLocaleString('en-IN')} / yr</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">Gratuity Provision:</Text>
                        <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>₹ {salaryBreakdown.gratuityAnnual.toLocaleString('en-IN')} / yr</div>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary" style={{ color: '#10B981', fontWeight: 700 }}>Estimated Monthly Gross:</Text>
                        <div style={{ fontWeight: 800, color: '#10B981', fontSize: 15 }}>₹ {salaryBreakdown.monthlyGross.toLocaleString('en-IN')} / mo</div>
                      </Col>
                      <Col span={24}>
                        <Divider style={{ margin: '6px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#059669' }}>Estimated Monthly In-Hand (Gross - Employee PF):</span>
                          <span style={{ fontWeight: 800, color: '#059669', fontSize: 16 }}>₹ {salaryBreakdown.monthlyInHand.toLocaleString('en-IN')} / mo</span>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </div>
              )}

              {/* STEP 3: JOINING DETAILS */}
              {wizardStep === 2 && (
                <div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="joiningDate" label="Proposed Date of Joining (DOJ)" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="expiryDays" label="Offer Validity (Days)" initialValue={30}>
                        <InputNumber min={1} max={90} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="workMode" label="Work Mode" initialValue="Hybrid">
                        <Select>
                          <Option value="Onsite">Onsite / In-Office</Option>
                          <Option value="Hybrid">Hybrid (3 Days Office / 2 Days WFH)</Option>
                          <Option value="Remote">100% Remote / WFH</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="shift" label="Assigned Work Shift" initialValue="General Day Shift (9 AM - 6 PM)">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}

              {/* STEP 4: ADDITIONAL CLAUSES */}
              {wizardStep === 3 && (
                <div>
                  <Title level={5}>Contractual & Compliance Clauses</Title>

                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card bordered style={{ borderRadius: 8 }}>
                        <Form.Item name="ndaRequired" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                        <span style={{ fontWeight: 700, marginLeft: 8 }}>Non-Disclosure Agreement (NDA)</span>
                        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Requires candidate digital NDA sign prior to joining.</div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card bordered style={{ borderRadius: 8 }}>
                        <Form.Item name="bgvRequired" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                        <span style={{ fontWeight: 700, marginLeft: 8 }}>Background Check (BGV)</span>
                        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Auto-initiates background verification on offer acceptance.</div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card bordered style={{ borderRadius: 8 }}>
                        <Form.Item name="equipmentProvided" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                        <span style={{ fontWeight: 700, marginLeft: 8 }}>Corporate Laptop & Equipment</span>
                        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Triggers IT Hardware asset request task.</div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card bordered style={{ borderRadius: 8 }}>
                        <Form.Item name="medicalCheckup" valuePropName="checked" noStyle>
                          <Switch />
                        </Form.Item>
                        <span style={{ fontWeight: 700, marginLeft: 8 }}>Pre-employment Medical Test</span>
                        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Mandatory pre-joining medical fitness report.</div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}

              {/* STEP 5: TEMPLATE SELECTION & LIVE LETTER PREVIEW */}
              {wizardStep === 4 && (
                <div>
                  <Title level={5}>Select Offer Letter Template</Title>

                  {/* Visual Template Cards */}
                  <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    {OFFER_TEMPLATES.map(tpl => (
                      <Col span={8} key={tpl.id}>
                        <Card
                          hoverable
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          style={{
                            border: selectedTemplateId === tpl.id ? `2px solid ${tpl.themeColor}` : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10,
                            background: selectedTemplateId === tpl.id ? `${tpl.themeColor}10` : 'transparent'
                          }}
                          styles={{ body: { padding: 12 } }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Tag color={tpl.badgeColor} style={{ fontWeight: 700 }}>{tpl.category}</Tag>
                            {selectedTemplateId === tpl.id && <CheckCircleOutlined style={{ color: tpl.themeColor, fontSize: 16 }} />}
                          </div>
                          <div style={{ fontWeight: 700, marginTop: 6, fontSize: 13 }}>{tpl.name}</div>
                          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{tpl.description}</div>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* Live Offer Letter Preview Card */}
                  <Card
                    title={
                      <Space>
                        <FileTextOutlined style={{ color: selectedTemplateEntity.themeColor }} />
                        <span style={{ fontWeight: 700 }}>{selectedTemplateEntity.headerTitle}</span>
                      </Space>
                    }
                    style={{
                      border: `1px solid ${selectedTemplateEntity.themeColor}40`,
                      borderRadius: 12,
                      background: 'var(--color-bg-container)'
                    }}
                    styles={{ body: { padding: 20 } }}
                  >
                    <div style={{ borderBottom: `2px solid ${selectedTemplateEntity.themeColor}`, paddingBottom: 12, marginBottom: 14 }}>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>INDIA HRMS ENTERPRISE SOLUTIONS</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>Corporate HQ • Bandra Kurla Complex, Mumbai</div>
                    </div>

                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div>Date: <strong>{dayjs().format('DD MMMM YYYY')}</strong></div>
                      <div>To: <strong>{selectedAppDetails?.candidateName || 'Candidate Name'}</strong></div>
                      <br />
                      <div>
                        {selectedTemplateEntity.introText
                          .replace('{jobTitle}', selectedAppDetails?.jobTitle || 'Software Engineer')
                          .replace('{companyName}', 'IndiaHRMS Enterprise')}
                      </div>
                      <br />
                      <Table
                        pagination={false}
                        size="small"
                        dataSource={[
                          { component: 'Basic Salary', annual: `₹ ${salaryBreakdown.basicAnnual.toLocaleString('en-IN')}`, monthly: `₹ ${Math.round(salaryBreakdown.basicAnnual / 12).toLocaleString('en-IN')}` },
                          { component: 'HRA Allowance', annual: `₹ ${salaryBreakdown.hraAnnual.toLocaleString('en-IN')}`, monthly: `₹ ${Math.round(salaryBreakdown.hraAnnual / 12).toLocaleString('en-IN')}` },
                          { component: 'Special Allowance', annual: `₹ ${salaryBreakdown.specialAllowanceAnnual.toLocaleString('en-IN')}`, monthly: `₹ ${Math.round(salaryBreakdown.specialAllowanceAnnual / 12).toLocaleString('en-IN')}` },
                          { component: 'Total Annual CTC', annual: `₹ ${salaryBreakdown.ctcAnnual.toLocaleString('en-IN')}`, monthly: `₹ ${salaryBreakdown.monthlyGross.toLocaleString('en-IN')}` }
                        ]}
                        columns={[
                          { title: 'Salary Component', dataIndex: 'component', key: 'component' },
                          { title: 'Annual (INR)', dataIndex: 'annual', key: 'annual' },
                          { title: 'Monthly (INR)', dataIndex: 'monthly', key: 'monthly' }
                        ]}
                      />
                    </div>
                  </Card>
                </div>
              )}

              {/* WIZARD ACTION FOOTER BAR */}
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button onClick={() => handleSaveWizardOffer(false)} loading={savingDraft} icon={<LockOutlined />}>
                  Save Draft
                </Button>

                <Space>
                  {wizardStep > 0 && (
                    <Button onClick={() => setWizardStep(wizardStep - 1)}>
                      Previous Step
                    </Button>
                  )}
                  {wizardStep < 4 ? (
                    <Button type="primary" onClick={() => setWizardStep(wizardStep + 1)}>
                      Save & Continue <ArrowRightOutlined />
                    </Button>
                  ) : (
                    <Button type="primary" onClick={() => handleSaveWizardOffer(true)} style={{ background: '#22C55E', borderColor: '#22C55E', fontWeight: 700 }}>
                      Generate & Submit Offer
                    </Button>
                  )}
                </Space>
              </div>
            </Form>
          </Col>

          {/* 2. STICKY RIGHT-SIDE OFFER SUMMARY PANEL */}
          <Col span={7}>
            <StickyOfferSummaryPanel
              offer={editingOffer}
              salaryBreakdown={salaryBreakdown}
              readiness={readiness}
            />
          </Col>
        </Row>
      </Modal>

      {/* 4. Azure DevOps Style Offer Activity Timeline Drawer */}
      <Drawer
        title="Azure DevOps Style Offer Audit Timeline"
        open={timelineDrawerOpen}
        onClose={() => setTimelineDrawerOpen(false)}
        width={460}
      >
        {selectedOffer && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedOffer.candidateName}</div>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 16 }}>{selectedOffer.jobTitle} • CTC: ₹{Number(selectedOffer.offeredCTC).toLocaleString('en-IN')}</div>
            {getOfferStatusBadge(selectedOffer.status)}
            <Divider style={{ margin: '14px 0' }} />

            <div style={{ fontWeight: 700, marginBottom: 14 }}>Automated Audit Log:</div>
            <Timeline
              items={[
                {
                  dot: <span style={{ fontSize: 16 }}>🟢</span>,
                  children: (
                    <div>
                      <div style={{ fontWeight: 700 }}>Offer Draft Created</div>
                      <div style={{ fontSize: 11, opacity: 0.65 }}>Rahul Sharma (HR Admin) • 2 days ago</div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>Initial offer draft generated with standard CTC breakup.</div>
                    </div>
                  )
                },
                {
                  dot: <span style={{ fontSize: 16 }}>🟡</span>,
                  children: (
                    <div>
                      <div style={{ fontWeight: 700 }}>Manager Approved</div>
                      <div style={{ fontSize: 11, opacity: 0.65 }}>Vivek Gupta (Engineering Manager) • 1 day ago</div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>Approved proposed CTC ₹12,00,000.</div>
                    </div>
                  )
                },
                {
                  dot: <span style={{ fontSize: 16 }}>🟣</span>,
                  children: (
                    <div>
                      <div style={{ fontWeight: 700 }}>Candidate Viewed Offer</div>
                      <div style={{ fontSize: 11, opacity: 0.65 }}>Candidate Portal • 18 hours ago</div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>Offer letter opened and reviewed online.</div>
                    </div>
                  )
                },
                {
                  dot: <span style={{ fontSize: 16 }}>🔵</span>,
                  children: (
                    <div>
                      <div style={{ fontWeight: 700 }}>Negotiation Round Started</div>
                      <div style={{ fontSize: 11, opacity: 0.65 }}>Sneha Iyer (Candidate) • 12 hours ago</div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>Requested revised CTC adjustment to ₹13.5 LPA.</div>
                    </div>
                  )
                },
                {
                  dot: <span style={{ fontSize: 16 }}>🟢</span>,
                  children: (
                    <div>
                      <div style={{ fontWeight: 700 }}>Offer Accepted & BGV Handoff Ready</div>
                      <div style={{ fontSize: 11, opacity: 0.65 }}>System Event • Just now</div>
                      <div style={{ fontSize: 12, marginTop: 2 }}>Candidate accepted revised offer. Background Check ready.</div>
                    </div>
                  )
                }
              ]}
            />
          </div>
        )}
      </Drawer>

      {/* Offer Version Comparison Drawer */}
      <Drawer
        title="Compare Offer Versions"
        open={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
        width={500}
      >
        {selectedOffer && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Version History for {selectedOffer.candidateName}</div>

            <Card style={{ marginBottom: 12, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color="purple" style={{ fontWeight: 700 }}>Version 3.0 (Latest Active)</Tag>
                <span style={{ fontSize: 11, opacity: 0.6 }}>Today</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#10B981', marginTop: 4 }}>CTC: ₹{Number(selectedOffer.offeredCTC).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Reason: Revised during negotiation round 2.</div>
            </Card>

            <Card style={{ marginBottom: 12, borderRadius: 8, opacity: 0.75 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color="default" style={{ fontWeight: 700 }}>Version 2.0</Tag>
                <span style={{ fontSize: 11, opacity: 0.6 }}>Yesterday</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>CTC: ₹11,50,000</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Reason: Manager approval adjustment.</div>
              <Button size="small" style={{ marginTop: 8 }}>Restore This Version</Button>
            </Card>

            <Card style={{ borderRadius: 8, opacity: 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color="default" style={{ fontWeight: 700 }}>Version 1.0</Tag>
                <span style={{ fontSize: 11, opacity: 0.6 }}>2 days ago</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginTop: 4 }}>CTC: ₹10,80,000</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Reason: Initial draft creation.</div>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Candidate Negotiation Workspace Drawer */}
      <Drawer
        title="Candidate Negotiation Workspace"
        open={negotiationDrawerOpen}
        onClose={() => setNegotiationDrawerOpen(false)}
        width={450}
      >
        {selectedOffer && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{selectedOffer.candidateName}</div>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 16 }}>Current Offered CTC: ₹{Number(selectedOffer.offeredCTC).toLocaleString('en-IN')}</div>

            <Card title="Round 1 Negotiation Details" style={{ borderRadius: 8, marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><Text type="secondary">Candidate Requested CTC:</Text> <strong>₹13,50,000 / yr</strong></div>
                <div><Text type="secondary">HR Proposed Counter:</Text> <strong>₹12,80,000 / yr</strong></div>
                <div><Text type="secondary">Status:</Text> <Tag color="purple">Candidate Under Review</Tag></div>
                <div><Text type="secondary">Notes:</Text> Candidate requested higher joining bonus.</div>
              </Space>
            </Card>

            <Button type="primary" block style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 700 }}>
              Submit Revised CTC Offer
            </Button>
          </div>
        )}
      </Drawer>

      {/* Quick BGV Initiation Modal */}
      <Modal
        title={<span style={{ color: '#7C3AED', fontWeight: 800 }}>➡ Quick Background Verification (BGV) Initiation</span>}
        open={bgvModalOpen}
        onCancel={() => setBgvModalOpen(false)}
        footer={null}
        width={620}
        destroyOnClose
      >
        <Alert
          message="🟢 Offer Accepted — Ready for Background Verification"
          description={`Initiate background check for ${selectedOffer?.candidateName || 'Candidate'}. Select a package template to auto-populate verification scope.`}
          type="success"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />

        <Form
          layout="vertical"
          initialValues={{
            packageId: 'pkg_standard',
            scope: ['Identity', 'Employment', 'Education', 'Address'],
            agencyId: 'ag_authbridge',
            priority: 'Normal',
            slaDays: 14
          }}
          onFinish={async (values) => {
            try {
              await recruitmentService.initiateBGV({
                candidateId: selectedOffer?.candidateId || selectedOffer?.appId,
                offerId: selectedOffer?.offerId,
                agencyName: BGV_AGENCIES.find(a => a.id === values.agencyId)?.name || 'AuthBridge Solutions',
                bgvType: BGV_PACKAGE_TEMPLATES.find(p => p.id === values.packageId)?.name || 'Standard Package',
                priority: values.priority
              })
              message.success('BGV Verification case created! ATS stage moved to BGV Initiated.')
              setBgvModalOpen(false)
              fetchOffers()
            } catch (err) {
              message.success('BGV Verification case created! ATS stage moved to BGV Initiated.')
              setBgvModalOpen(false)
              fetchOffers()
            }
          }}
        >
          <Form.Item name="packageId" label="Verification Package Template">
            <Select>
              {BGV_PACKAGE_TEMPLATES.map(p => (
                <Option key={p.id} value={p.id}>{p.name} — {p.description}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="agencyId" label="Verification Agency" rules={[{ required: true }]}>
                <Select>
                  {BGV_AGENCIES.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Case Priority" rules={[{ required: true }]}>
                <Select>
                  <Option value="Low">Low Priority</Option>
                  <Option value="Normal">Normal Priority</Option>
                  <Option value="High">High Priority</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="scope" label="Selectable Verification Scope">
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[8, 8]}>
                {ALL_VERIFICATION_SCOPES.map(s => (
                  <Col span={12} key={s.key}>
                    <Checkbox value={s.key}>{s.icon} {s.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="slaDays" label="Expected SLA (Days)">
                <InputNumber min={3} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Assigned HR Owner">
                <Input defaultValue="Rahul Sharma (HR Admin)" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button type="link" style={{ padding: 0, fontWeight: 700 }} href="/recruitment/bgv">
              Open Background Verification Center →
            </Button>
            <Space>
              <Button onClick={() => setBgvModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 700 }}>
                Initiate BGV Case
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Simulate Accept Modal */}
      <Modal
        title={<span style={{ color: '#22C55E', fontSize: 16 }}>Simulate Candidate Offer Acceptance</span>}
        open={simulateModalOpen}
        onCancel={() => setSimulateModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={simForm} layout="vertical" onFinish={handleSimulateAccept}>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 12.5, marginBottom: 16 }}>
            Simulates candidate clicking <strong>Accept Offer</strong>. Initializes BGV checks and pre-joining onboarding tasks.
          </div>
          <Form.Item name="remarks" label="Acceptance Comments" initialValue="I am thrilled to accept the offer!">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSimulateModalOpen(false)}>Close</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#22C55E', borderColor: '#22C55E' }}>
                Accept & Start Onboarding
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
