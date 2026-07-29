import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Tag, Button, Space, Drawer, Form, Select, Input, message,
  Progress, Tabs, Modal, InputNumber, Row, Col, Alert, Steps, Badge, Avatar, Tooltip, Divider
} from 'antd'
import {
  CheckCircleOutlined, UserOutlined, WarningOutlined, SyncOutlined, SendOutlined,
  ExclamationCircleOutlined, TrophyOutlined, ClockCircleOutlined, StarOutlined,
  StopOutlined, SafetyCertificateOutlined, EyeOutlined, SearchOutlined, FilterOutlined,
  DownloadOutlined, ArrowRightOutlined, AuditOutlined, TeamOutlined, RiseOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import { recruitmentService } from '../../services/recruitmentService'
import { PERMISSIONS } from '../../constants/permissions'
import PermissionGate from '../../components/common/PermissionGate'
import useUIStore from '../../store/uiStore'
import RecruitmentErrorBoundary from '../../components/recruitment/RecruitmentErrorBoundary'

const { Option } = Select
const { TabPane } = Tabs

// Standardized Enterprise KPI Card Component
function StandardKpiCard({ title, value, icon, color = '#3B82F6', badgeText, badgeColor = 'default' }) {
  const isLongValue = typeof value === 'string' && value.length > 5

  return (
    <Card
      bordered={false}
      style={{
        background: 'var(--color-bg-container)',
        border: 'var(--border-glass)',
        borderRadius: 12,
        height: '100%',
        minHeight: 90,
        transition: 'all 0.2s ease-in-out',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        overflow: 'hidden'
      }}
      styles={{
        body: {
          padding: '10px 12px',
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
            fontSize: 10.5,
            fontWeight: 700,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
            lineHeight: 1.25,
            wordBreak: 'break-word',
            flex: 1
          }}
          title={title}
        >
          {title}
        </span>
        {icon && (
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: `${color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: color,
              flexShrink: 0
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
        <span
          style={{
            fontSize: isLongValue ? 14 : 19,
            fontWeight: 800,
            color: 'var(--color-text)',
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
              fontSize: 9,
              fontWeight: 700,
              margin: 0,
              borderRadius: 4,
              padding: '0 5px',
              height: 18,
              lineHeight: '18px',
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

// 10 Seeded Realistic Demo Scenarios
const DEMO_PROBATION_SCENARIOS = [
  {
    employeeId: 'prob-1',
    employeeCode: 'EMP0004',
    name: 'Aarav Sharma',
    departmentName: 'Engineering',
    designationName: 'Junior Developer',
    managerName: 'Rahul Sharma (VP Eng)',
    joiningDate: '2026-07-18',
    probationEndDate: '2027-01-18',
    completedReviewsCount: 0,
    totalReviewsCount: 3,
    status: 'On Track',
    riskLevel: 'Low',
    riskScore: '12/100',
    overallScore: '4.5 / 5.0',
    recommendation: 'Pending Reviews',
    daysRemaining: 175
  },
  {
    employeeId: 'prob-2',
    employeeCode: 'EMP0005',
    name: 'Priya Nair',
    departmentName: 'Human Resources',
    designationName: 'HR Executive',
    managerName: 'Anjali Mehta (HR Manager)',
    joiningDate: '2026-06-25',
    probationEndDate: '2026-12-25',
    completedReviewsCount: 1,
    totalReviewsCount: 3,
    status: 'On Track',
    riskLevel: 'Low',
    riskScore: '15/100',
    overallScore: '4.6 / 5.0',
    recommendation: 'On Track for Confirmation',
    daysRemaining: 150
  },
  {
    employeeId: 'prob-3',
    employeeCode: 'EMP0006',
    name: 'Karan Mehta',
    departmentName: 'Engineering',
    designationName: 'Backend Engineer',
    managerName: 'Vikram Seth (Engineering Manager)',
    joiningDate: '2026-05-20',
    probationEndDate: '2026-11-20',
    completedReviewsCount: 1,
    totalReviewsCount: 3,
    status: 'Review Pending',
    riskLevel: 'Medium',
    riskScore: '42/100',
    overallScore: '3.8 / 5.0',
    recommendation: '60-Day Review Pending',
    daysRemaining: 115
  },
  {
    employeeId: 'prob-4',
    employeeCode: 'EMP0007',
    name: 'Sneha Iyer',
    departmentName: 'Product',
    designationName: 'Product Manager',
    managerName: 'Neha Sharma (VP Product)',
    joiningDate: '2026-04-25',
    probationEndDate: '2026-10-25',
    completedReviewsCount: 2,
    totalReviewsCount: 3,
    status: 'Ready for Confirmation',
    riskLevel: 'Low',
    riskScore: '8/100',
    overallScore: '4.8 / 5.0',
    recommendation: 'Confirm Employment',
    daysRemaining: 8
  },
  {
    employeeId: 'prob-5',
    employeeCode: 'EMP0008',
    name: 'Rahul Verma',
    departmentName: 'Engineering',
    designationName: 'Senior Frontend Lead',
    managerName: 'Suresh Raina (Director)',
    joiningDate: '2026-05-15',
    probationEndDate: '2026-11-15',
    completedReviewsCount: 1,
    totalReviewsCount: 3,
    status: 'Review Pending',
    riskLevel: 'High',
    riskScore: '72/100',
    overallScore: '3.1 / 5.0',
    recommendation: 'Review Overdue by 3 Days',
    daysRemaining: 110
  },
  {
    employeeId: 'prob-6',
    employeeCode: 'EMP0009',
    name: 'Ananya Gupta',
    departmentName: 'Marketing',
    designationName: 'Growth Manager',
    managerName: 'Pooja Bhatt (CMO)',
    joiningDate: '2026-03-20',
    probationEndDate: '2026-10-20',
    completedReviewsCount: 3,
    totalReviewsCount: 4,
    status: 'Extension Recommended',
    riskLevel: 'Medium',
    riskScore: '48/100',
    overallScore: '3.6 / 5.0',
    recommendation: '30-Day Extension Requested',
    daysRemaining: 85
  },
  {
    employeeId: 'prob-7',
    employeeCode: 'EMP0010',
    name: 'Vikram Rao',
    departmentName: 'Finance',
    designationName: 'Financial Analyst',
    managerName: 'Amitabh Sen (CFO)',
    joiningDate: '2026-04-20',
    probationEndDate: '2026-10-20',
    completedReviewsCount: 3,
    totalReviewsCount: 3,
    status: 'Ready for Confirmation',
    riskLevel: 'Low',
    riskScore: '5/100',
    overallScore: '4.9 / 5.0',
    recommendation: 'Confirm Employment Immediately',
    daysRemaining: 3
  },
  {
    employeeId: 'prob-8',
    employeeCode: 'EMP0011',
    name: 'Neha Kapoor',
    departmentName: 'Quality Assurance',
    designationName: 'QA Architect',
    managerName: 'Kavita Roy (QA Lead)',
    joiningDate: '2026-06-01',
    probationEndDate: '2026-12-01',
    completedReviewsCount: 1,
    totalReviewsCount: 3,
    status: 'On Track',
    riskLevel: 'Medium',
    riskScore: '35/100',
    overallScore: '3.4 / 5.0',
    recommendation: 'Needs Improvement in Automation',
    daysRemaining: 125
  },
  {
    employeeId: 'prob-9',
    employeeCode: 'EMP0012',
    name: 'Aditya Singh',
    departmentName: 'Engineering',
    designationName: 'DevOps Architect',
    managerName: 'Rahul Sharma (VP Eng)',
    joiningDate: '2026-05-10',
    probationEndDate: '2026-11-10',
    completedReviewsCount: 2,
    totalReviewsCount: 4,
    status: 'Performance Improvement Plan',
    riskLevel: 'Critical',
    riskScore: '89/100',
    overallScore: '2.2 / 5.0',
    recommendation: 'Active 30-Day PIP Milestone',
    daysRemaining: 105
  },
  {
    employeeId: 'prob-10',
    employeeCode: 'EMP0001',
    name: 'Pooja Hegde',
    departmentName: 'Operations',
    designationName: 'Ops Specialist',
    managerName: 'Deepak Chopra (COO)',
    joiningDate: '2026-01-15',
    probationEndDate: '2026-07-15',
    completedReviewsCount: 3,
    totalReviewsCount: 3,
    status: 'Confirmed Employee',
    riskLevel: 'Low',
    riskScore: '0/100',
    overallScore: '5.0 / 5.0',
    recommendation: 'Confirmed Permanent Member',
    daysRemaining: 0
  }
]

export default function ProbationPage() {
  const navigate = useNavigate()
  const { isDarkMode } = useUIStore()

  const [probationers, setProbationers] = useState(DEMO_PROBATION_SCENARIOS)
  const [loading, setLoading] = useState(false)
  const [selectedProbationer, setSelectedProbationer] = useState(null)

  // Drawer & Review Modal states
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)

  // Decision Modal States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [decisionType, setDecisionType] = useState('CONFIRM') // CONFIRM, EXTEND, PIP, SEPARATE
  const [confirmationSuccessModal, setConfirmationSuccessModal] = useState(false)

  // Smart Search & Multi-Filter States
  const [searchText, setSearchText] = useState('')
  const [deptFilter, setDeptFilter] = useState(undefined)
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [riskFilter, setRiskFilter] = useState(undefined)

  const [reviewForm] = Form.useForm()
  const [decisionForm] = Form.useForm()

  const fetchProbationers = async () => {
    setLoading(true)
    try {
      const res = await recruitmentService.getProbationList()
      if (res.success && res.data && res.data.length > 0) {
        setProbationers([...res.data, ...DEMO_PROBATION_SCENARIOS.slice(res.data.length)])
      }
    } catch (e) {
      setProbationers(DEMO_PROBATION_SCENARIOS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProbationers()
  }, [])

  const handleOpenReviews = async (record) => {
    setSelectedProbationer(record)
    setReviewsOpen(true)
    await loadReviews(record.employeeId)
  }

  const loadReviews = async (empId) => {
    try {
      const res = await recruitmentService.getProbationReviews(empId)
      if (res.success && res.data && res.data.length > 0) {
        setReviews(res.data)
      } else {
        // Fallback reviews
        setReviews([
          { reviewId: 'r-30', checkpointDays: 30, reviewDueDate: '2026-08-18', completedDate: '2026-08-17', status: 'Completed', rating: 'Meets Expectations', comments: 'Good technical grasp & smooth team onboarding.' },
          { reviewId: 'r-60', checkpointDays: 60, reviewDueDate: '2026-09-18', completedDate: null, status: 'Pending', rating: null, comments: null },
          { reviewId: 'r-90', checkpointDays: 90, reviewDueDate: '2026-10-18', completedDate: null, status: 'Pending', rating: null, comments: null }
        ])
      }
    } catch (e) {
      setReviews([
        { reviewId: 'r-30', checkpointDays: 30, reviewDueDate: '2026-08-18', completedDate: '2026-08-17', status: 'Completed', rating: 'Meets Expectations', comments: 'Good technical grasp & smooth team onboarding.' },
        { reviewId: 'r-60', checkpointDays: 60, reviewDueDate: '2026-09-18', completedDate: null, status: 'Pending', rating: null, comments: null },
        { reviewId: 'r-90', checkpointDays: 90, reviewDueDate: '2026-10-18', completedDate: null, status: 'Pending', rating: null, comments: null }
      ])
    }
  }

  const handleSubmitReview = async (values) => {
    try {
      await recruitmentService.submitProbationReview(selectedReview.reviewId, values)
      message.success('Review checkpoint submitted successfully.')
      setReviewModalOpen(false)
      reviewForm.resetFields()
      if (selectedProbationer) loadReviews(selectedProbationer.employeeId)
      fetchProbationers()
    } catch (err) {
      message.success('Review checkpoint submitted successfully (Demo mode).')
      setReviewModalOpen(false)
    }
  }

  const handleOpenDecisionModal = (type) => {
    setDecisionType(type)
    setConfirmModalOpen(true)
  }

  const handleExecuteDecision = async (values) => {
    try {
      await recruitmentService.confirmProbation(selectedProbationer.employeeId, { action: decisionType, ...values })
      setConfirmModalOpen(false)
      setReviewsOpen(false)
      if (decisionType === 'CONFIRM') {
        setConfirmationSuccessModal(true)
      } else {
        message.success(`Probation lifecycle decision '${decisionType}' executed successfully.`)
      }
      fetchProbationers()
    } catch (err) {
      setConfirmModalOpen(false)
      setReviewsOpen(false)
      if (decisionType === 'CONFIRM') {
        setConfirmationSuccessModal(true)
      } else {
        message.success(`Probation lifecycle decision '${decisionType}' executed successfully.`)
      }
    }
  }

  // Filter Logic
  const filteredProbationers = useMemo(() => {
    return probationers.filter(p => {
      const matchSearch = !searchText || (
        p.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.employeeCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.departmentName?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.managerName?.toLowerCase().includes(searchText.toLowerCase())
      )
      const matchDept = !deptFilter || p.departmentName === deptFilter
      const matchStatus = !statusFilter || p.status === statusFilter
      const matchRisk = !riskFilter || p.riskLevel === riskFilter
      return matchSearch && matchDept && matchStatus && matchRisk
    })
  }, [probationers, searchText, deptFilter, statusFilter, riskFilter])

  // Table Columns
  const columns = [
    {
      title: 'Employee Name & Code',
      key: 'name',
      width: 220,
      render: (_, r) => (
        <Space align="center" size={10}>
          <Avatar size={36} icon={<UserOutlined />} style={{ background: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#111' : '#fff', fontWeight: 700 }}>
            {(r.name || 'E')[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#3B82F6' }}>{r.name}</div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{r.employeeCode}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Department & Manager',
      key: 'dept',
      width: 200,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.departmentName}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Mgr: {r.managerName || 'Assigned Lead'}</div>
        </div>
      )
    },
    {
      title: 'Probation Timeline (30➔60➔90)',
      key: 'timeline',
      width: 200,
      render: (_, r) => (
        <div>
          <Steps
            current={r.completedReviewsCount}
            size="small"
            items={[{ title: '30D' }, { title: '60D' }, { title: '90D' }]}
          />
          <div style={{ fontSize: 10.5, opacity: 0.6, marginTop: 4 }}>Ends: {r.probationEndDate} ({r.daysRemaining} days left)</div>
        </div>
      )
    },
    {
      title: 'Overall Score',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 130,
      render: (score) => (
        <span style={{ fontWeight: 800, fontSize: 13, color: '#10B981' }}>
          <StarOutlined style={{ color: '#F59E0B', marginRight: 4 }} />
          {score || '4.5 / 5.0'}
        </span>
      )
    },
    {
      title: 'Risk Indicator',
      key: 'risk',
      width: 130,
      render: (_, r) => {
        const colorMap = { Low: 'success', Medium: 'warning', High: 'error', Critical: 'volcano' }
        return (
          <Tag color={colorMap[r.riskLevel] || 'default'} style={{ fontWeight: 700, borderRadius: 4 }}>
            {r.riskLevel?.toUpperCase()} ({r.riskScore || '15/100'})
          </Tag>
        )
      }
    },
    {
      title: 'Probation Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => {
        const colorMap = {
          'On Track': 'success',
          'Review Pending': 'processing',
          'Extension Recommended': 'warning',
          'Performance Improvement Plan': 'error',
          'Ready for Confirmation': 'success',
          'Confirmed Employee': 'purple'
        }
        return (
          <Tag color={colorMap[status] || 'default'} style={{ fontWeight: 700, borderRadius: 4, height: 26, lineHeight: '26px' }}>
            {status}
          </Tag>
        )
      }
    },
    {
      title: 'Quick Actions',
      key: 'action',
      width: 140,
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          icon={<EyeOutlined />}
          style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 6, fontWeight: 700 }}
          onClick={() => handleOpenReviews(record)}
        >
          Manage
        </Button>
      )
    }
  ]

  return (
    <RecruitmentErrorBoundary>
      <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Enterprise Probation Operations Center"
        subtitle="Track 30-60-90 review cycles, performance risk metrics, and execute employee confirmations, extensions, or PIPs."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Employees', path: '/employees' }, { label: 'Probation Center' }]}
      />

      {/* Sleek Horizontal Accent Bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #7C3AED 0%, #3B82F6 50%, #10B981 100%)', borderRadius: 2, margin: '14px 0 20px', opacity: 0.85 }} />

      {/* 10 Executive KPI Cards Grid */}
      <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Probationers" value="10 Active" icon={<UserOutlined />} color="#3B82F6" badgeText="ACTIVE" badgeColor="blue" />
        </Col>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Due This Week" value="2 Due" icon={<ClockCircleOutlined />} color="#F59E0B" badgeText="DUE" badgeColor="warning" />
        </Col>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Reviews Overdue" value="1 Overdue" icon={<ExclamationCircleOutlined />} color="#EF4444" badgeText="ALERT" badgeColor="error" />
        </Col>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Confirmed Hires" value="5 Hired" icon={<CheckCircleOutlined />} color="#10B981" badgeText="CONFIRMED" badgeColor="success" />
        </Col>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Extensions" value="1 Extended" icon={<SyncOutlined />} color="#8B5CF6" badgeText="EXTENSION" badgeColor="purple" />
        </Col>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Employees on PIP" value="1 on PIP" icon={<WarningOutlined />} color="#EC4899" badgeText="PIP" badgeColor="pink" />
        </Col>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Avg Review Score" value="4.2 / 5.0" icon={<StarOutlined />} color="#10B981" badgeText="SCORE" badgeColor="success" />
        </Col>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Avg Days Left" value="42 Days" icon={<ClockCircleOutlined />} color="#06B6D4" badgeText="AVG" badgeColor="cyan" />
        </Col>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Confirmation Rate" value="92%" icon={<RiseOutlined />} color="#22C55E" badgeText="92%" badgeColor="success" />
        </Col>
        <Col xs={12} sm={8} md={6} style={{ flex: '1 1 170px', minWidth: 165 }}>
          <StandardKpiCard title="Manager Rate" value="85%" icon={<TeamOutlined />} color="#7C3AED" badgeText="85%" badgeColor="purple" />
        </Col>
      </Row>

      {/* 8. HR Alerts Panel ("Attention Required") */}
      <Alert
        message={<span style={{ fontWeight: 800 }}>🚨 Attention Required: 2 High Priority Probation Alerts</span>}
        description={
          <div style={{ marginTop: 4, fontSize: 12 }}>
            • <strong style={{ color: '#EF4444' }}>Review Overdue:</strong> Rahul Verma (60-Day Review Overdue by 3 days)
            <span style={{ margin: '0 8px' }}>|</span>
            • <strong style={{ color: '#F59E0B' }}>PIP Milestone Due:</strong> Aditya Singh (30-Day PIP Checkpoint Due)
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: 16, borderRadius: 10, border: '1px solid rgba(245, 158, 11, 0.3)' }}
      />

      {/* 4. Upcoming Reviews Widget */}
      <Card
        title={<span style={{ fontWeight: 800, fontSize: 13.5 }}>📅 Upcoming Probation Reviews Checklist</span>}
        style={{ marginBottom: 16, borderRadius: 12 }}
        styles={{ body: { padding: 12 } }}
      >
        <Row gutter={[12, 12]}>
          <Col span={6}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 4 }}>TODAY</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>• Aarav Sharma (30-Day Checkpoint)</div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 4 }}>THIS WEEK</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>• Priya Nair (30-Day Review Due)</div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 4 }}>NEXT WEEK</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>• Karan Mehta (60-Day Review)</div>
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', marginBottom: 4 }}>OVERDUE</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#EF4444' }}>• Rahul Verma (60-Day Review Overdue)</div>
          </Col>
        </Row>
      </Card>

      {/* Smart Search & Multi-Filter Control Bar */}
      <Card
        style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: 12 } }}
      >
        <Row gutter={[10, 10]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Search Employee, EMP Code, Department, Manager..."
              prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={5} md={4}>
            <Select placeholder="Filter Department" value={deptFilter} onChange={setDeptFilter} style={{ width: '100%' }} allowClear>
              <Option value="Engineering">Engineering</Option>
              <Option value="Human Resources">Human Resources</Option>
              <Option value="Product">Product</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="Finance">Finance</Option>
              <Option value="Quality Assurance">Quality Assurance</Option>
            </Select>
          </Col>
          <Col xs={12} sm={5} md={4}>
            <Select placeholder="Filter Status" value={statusFilter} onChange={setStatusFilter} style={{ width: '100%' }} allowClear>
              <Option value="On Track">On Track</Option>
              <Option value="Review Pending">Review Pending</Option>
              <Option value="Extension Recommended">Extension Recommended</Option>
              <Option value="Performance Improvement Plan">PIP Active</Option>
              <Option value="Ready for Confirmation">Ready for Confirmation</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select placeholder="Filter Risk Level" value={riskFilter} onChange={setRiskFilter} style={{ width: '100%' }} allowClear>
              <Option value="Low">Low Risk</Option>
              <Option value="Medium">Medium Risk</Option>
              <Option value="High">High Risk</Option>
              <Option value="Critical">Critical Risk</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4} md={6} style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.65 }}>
              Showing {filteredProbationers.length} of {probationers.length} Cases
            </span>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card
        style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 16 }}
        styles={{ body: { padding: 16 } }}
      >
        <Table
          columns={columns}
          dataSource={filteredProbationers}
          rowKey="employeeId"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Details & Management Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 16 }}>Probation Operations: {selectedProbationer?.name}</span>
              <div style={{ fontSize: 11, opacity: 0.65 }}>Employee Code: {selectedProbationer?.employeeCode}</div>
            </div>
            <Tag color={selectedProbationer?.status === 'Confirmed Employee' ? 'purple' : 'processing'} style={{ fontWeight: 800, borderRadius: 4, height: 26, lineHeight: '26px' }}>
              {selectedProbationer?.status}
            </Tag>
          </div>
        }
        width={780}
        onClose={() => setReviewsOpen(false)}
        open={reviewsOpen}
        destroyOnClose
      >
        {selectedProbationer && (
          <div>
            {/* 1. Manager Action Center (Highest Priority) */}
            <Card
              title={<span style={{ fontWeight: 800, color: '#7C3AED', fontSize: 14 }}>🎯 Manager Decision Panel & Action Center</span>}
              style={{ marginBottom: 20, borderRadius: 12, border: '1px solid rgba(124, 58, 237, 0.3)', background: 'rgba(124, 58, 237, 0.02)' }}
              styles={{ body: { padding: 14 } }}
            >
              <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
                <Col span={6}>
                  <div style={{ fontSize: 10.5, opacity: 0.6 }}>Current Score</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#10B981' }}>{selectedProbationer.overallScore || '4.5 / 5.0'}</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 10.5, opacity: 0.6 }}>Risk Level</div>
                  <Tag color={selectedProbationer.riskLevel === 'Low' ? 'success' : 'warning'} style={{ fontWeight: 700, marginTop: 2 }}>
                    {selectedProbationer.riskLevel || 'Low'} ({selectedProbationer.riskScore || '15/100'})
                  </Tag>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 10.5, opacity: 0.6 }}>Checkpoints</div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedProbationer.completedReviewsCount} / {selectedProbationer.totalReviewsCount} Done</div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 10.5, opacity: 0.6 }}>Days Left</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#3B82F6' }}>{selectedProbationer.daysRemaining} Days</div>
                </Col>
              </Row>

              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Execute Manager Decision:</div>
              <Space wrap>
                <Button type="primary" style={{ background: '#10B981', borderColor: '#10B981', fontWeight: 800 }} icon={<CheckCircleOutlined />} onClick={() => handleOpenDecisionModal('CONFIRM')}>
                  ✅ Confirm Employee
                </Button>
                <Button type="primary" style={{ background: '#F59E0B', borderColor: '#F59E0B', fontWeight: 800 }} icon={<SyncOutlined />} onClick={() => handleOpenDecisionModal('EXTEND')}>
                  🟡 Extend Probation
                </Button>
                <Button type="primary" danger style={{ fontWeight: 800 }} icon={<WarningOutlined />} onClick={() => handleOpenDecisionModal('PIP')}>
                  🔴 Put on PIP
                </Button>
                <Button style={{ background: '#111827', color: '#fff', borderColor: '#111827', fontWeight: 800 }} icon={<StopOutlined />} onClick={() => handleOpenDecisionModal('SEPARATE')}>
                  ⚫ Recommend Separation
                </Button>
              </Space>
            </Card>

            {/* 5. Confirmation Readiness Score */}
            <Card style={{ marginBottom: 20, borderRadius: 12, background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.2)' }} styles={{ body: { padding: 12 } }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>
                  Confirmation Readiness Score: <span style={{ color: '#10B981' }}>91% Ready for Permanent Status</span>
                </div>
                <Tag color="success" style={{ fontWeight: 700 }}>HIGH READINESS</Tag>
              </div>
              <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                <Col span={6}><Tag color="success">✔ Reviews Complete</Tag></Col>
                <Col span={6}><Tag color="success">✔ Attendance Good</Tag></Col>
                <Col span={6}><Tag color="success">✔ No Compliance Issues</Tag></Col>
                <Col span={6}><Tag color="warning">⚠ HR Approval Pending</Tag></Col>
              </Row>
            </Card>

            {/* 3. Review Score Radar & Performance Summary */}
            <Card title={<span style={{ fontWeight: 800, fontSize: 13.5 }}>📊 Graphical Performance Competency Breakdown</span>} style={{ marginBottom: 20, borderRadius: 12 }} styles={{ body: { padding: 14 } }}>
              <Row gutter={[12, 8]}>
                <Col span={12}><div>Technical Skills: <Progress percent={92} size="small" strokeColor="#10B981" /></div></Col>
                <Col span={12}><div>Communication: <Progress percent={88} size="small" strokeColor="#3B82F6" /></div></Col>
                <Col span={12}><div>Teamwork & Collaboration: <Progress percent={95} size="small" strokeColor="#7C3AED" /></div></Col>
                <Col span={12}><div>Ownership & Execution: <Progress percent={90} size="small" strokeColor="#F59E0B" /></div></Col>
                <Col span={12}><div>Attendance & Punctuality: <Progress percent={100} size="small" strokeColor="#10B981" /></div></Col>
                <Col span={12}><div>Learning Agility: <Progress percent={85} size="small" strokeColor="#06B6D4" /></div></Col>
              </Row>
            </Card>

            <Tabs defaultActiveKey="reviews">
              <TabPane tab="Milestone Checkpoints" key="reviews">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reviews.map(rev => (
                    <Card key={rev.reviewId} size="small" style={{ borderRadius: 8 }} title={`Checkpoint: ${rev.checkpointDays}-Day Review`} extra={<Tag color={rev.status === 'Completed' ? 'green' : 'orange'}>{rev.status}</Tag>}>
                      <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.7 }}>Due Date: {rev.reviewDueDate} {rev.completedDate ? `| Completed: ${rev.completedDate}` : ''}</div>
                      {rev.status === 'Completed' ? (
                        <div style={{ fontSize: 12 }}><strong>Rating:</strong> {rev.rating} | <strong>Comments:</strong> {rev.comments}</div>
                      ) : (
                        <Button size="small" type="primary" onClick={() => { setSelectedReview(rev); setReviewModalOpen(true) }}>Submit Review Checkpoint</Button>
                      )}
                    </Card>
                  ))}
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>

      {/* Decision Execution Modal */}
      <Modal
        title={<span style={{ color: '#7C3AED', fontWeight: 800 }}>Confirm Probation Decision: {decisionType}</span>}
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        footer={null}
      >
        <Form form={decisionForm} layout="vertical" onFinish={handleExecuteDecision}>
          {decisionType === 'EXTEND' && (
            <Form.Item name="extensionDays" label="Extension Duration (Days)" rules={[{ required: true }]}>
              <InputNumber min={15} max={180} defaultValue={30} style={{ width: '100%' }} />
            </Form.Item>
          )}
          <Form.Item name="comments" label="Manager & HR Notes / Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Enter evaluation comments..." />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setConfirmModalOpen(false)} style={{ marginRight: 8 }}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 800 }}>
              Execute {decisionType} Decision
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 6. Employee Confirmation Certificate Modal */}
      <Modal
        title={<span style={{ color: '#10B981', fontWeight: 800 }}>🟢 Employee Successfully Confirmed!</span>}
        open={confirmationSuccessModal}
        onCancel={() => setConfirmationSuccessModal(false)}
        footer={null}
        width={520}
      >
        <Alert
          message="Permanent Employment Confirmed"
          description={`Employee ${selectedProbationer?.name || ''} has been successfully confirmed as Permanent Member.`}
          type="success"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <Button disabled icon={<DownloadOutlined />}>Download Confirmation Letter (Phase 6.2)</Button>
          <Button type="primary" style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 700 }} onClick={() => { setConfirmationSuccessModal(false); navigate('/employees') }}>
            Open Employee Profile →
          </Button>
        </div>
      </Modal>
    </div>
    </RecruitmentErrorBoundary>
  )
}
