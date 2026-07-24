import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card, Table, Tag, Row, Col, Space, Button, Input, Select, Modal, Form,
  Drawer, Progress, Steps, Badge, Avatar, Typography, Alert, Divider, Tooltip,
  Timeline, List, Checkbox
} from 'antd'
import {
  SafetyCertificateOutlined, CheckCircleOutlined, SyncOutlined, AlertOutlined,
  EyeOutlined, EditOutlined, FileTextOutlined, HistoryOutlined, CheckOutlined,
  ExclamationCircleOutlined, UserOutlined, ClockCircleOutlined, FolderOpenOutlined,
  SearchOutlined, DownloadOutlined, ToolOutlined, PlusOutlined, DownOutlined,
  FilterOutlined, ThunderboltOutlined, RiseOutlined, ArrowRightOutlined, CloseOutlined,
  WarningOutlined, UndoOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { recruitmentService } from '../../services/recruitmentService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import useUIStore from '../../store/uiStore'
import {
  BGV_PACKAGE_TEMPLATES,
  ALL_VERIFICATION_SCOPES,
  BGV_AGENCIES,
  BGV_OUTCOMES,
  getCaseHealth,
  getVerificationConfidence
} from '../../data/bgvPackages'

const { Option } = Select
const { Text, Title } = Typography

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

// Enterprise Horizontal Step Progress Tracker
function BgvProgressTracker({ status }) {
  const stepMap = {
    Initiated: 0,
    Documents: 1,
    AgencyReview: 2,
    Running: 3,
    HRReview: 4,
    Completed: 5
  }
  const current = stepMap[status] ?? 3

  return (
    <Steps
      current={current}
      size="small"
      style={{ minWidth: 260 }}
      items={[
        { title: 'Initiated' },
        { title: 'Docs' },
        { title: 'Agency' },
        { title: 'Running' },
        { title: 'Review' },
        { title: 'Completed' }
      ]}
    />
  )
}

// Risk Level Tag
function RiskLevelBadge({ level }) {
  switch (level) {
    case 'Critical':
      return <Tag color="error" style={{ fontWeight: 800, borderRadius: 4 }}>🔴 CRITICAL</Tag>
    case 'High':
      return <Tag color="warning" style={{ fontWeight: 800, borderRadius: 4 }}>🟠 HIGH</Tag>
    case 'Medium':
      return <Tag color="gold" style={{ fontWeight: 800, borderRadius: 4 }}>🟡 MEDIUM</Tag>
    default:
      return <Tag color="success" style={{ fontWeight: 800, borderRadius: 4 }}>🟢 LOW</Tag>
  }
}

export default function BgvPage() {
  const { isDarkMode } = useUIStore()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [riskFilter, setRiskFilter] = useState('ALL')

  // Drawer & Modal States
  const [caseDrawerOpen, setCaseDrawerOpen] = useState(false)
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false)
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [reopenModalOpen, setReopenModalOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [reopenedCaseIds, setReopenedCaseIds] = useState(['bgv_001'])
  const [reopenForm] = Form.useForm()

  const { data: bgvData, isLoading, refetch } = useQuery({
    queryKey: ['bgv-records'],
    queryFn: () => recruitmentService.getBGVRecords()
  })

  const rawRecords = bgvData?.data || []

  // Enhanced Demo BGV Cases Population if backend records are minimal
  const records = useMemo(() => {
    if (rawRecords.length >= 4) return rawRecords

    return [
      {
        bgvId: 'bgv_001',
        candidateName: 'Sneha Iyer',
        jobTitle: 'Senior React Developer',
        agencyName: 'AuthBridge Solutions',
        bgvType: 'Executive Package',
        initiatedAt: '2026-07-20T10:00:00Z',
        expectedCompletion: '2026-08-03T10:00:00Z',
        status: 'In Progress',
        outcome: 'ClearedWithObservations',
        riskLevel: 'Medium',
        priority: 'High',
        progress: 82,
        assignedHr: 'Rahul Sharma',
        scope: ['Identity', 'Employment', 'Education', 'Address', 'Criminal', 'Reference'],
        verifiedCategories: ['Identity', 'Education', 'Address'],
        discrepancies: [
          { category: 'Employment Dates', issue: 'Previous employer end date mismatch by 14 days.', severity: 'Medium' }
        ]
      },
      {
        bgvId: 'bgv_002',
        candidateName: 'Neha Kapoor',
        jobTitle: 'QA Automation Engineer',
        agencyName: 'First Advantage India',
        bgvType: 'Standard Package',
        initiatedAt: '2026-07-18T14:30:00Z',
        expectedCompletion: '2026-08-01T14:30:00Z',
        status: 'Cleared',
        outcome: 'Cleared',
        riskLevel: 'Low',
        priority: 'Normal',
        progress: 100,
        assignedHr: 'Anjali Mehta',
        scope: ['Identity', 'Employment', 'Education', 'Address'],
        verifiedCategories: ['Identity', 'Employment', 'Education', 'Address'],
        discrepancies: []
      },
      {
        bgvId: 'bgv_003',
        candidateName: 'Rohan Verma',
        jobTitle: 'DevOps Engineer',
        agencyName: 'Matrix Verification Services',
        bgvType: 'Executive Package',
        initiatedAt: '2026-07-15T09:15:00Z',
        expectedCompletion: '2026-07-22T09:15:00Z',
        status: 'Discrepancy',
        outcome: 'ManualReviewRequired',
        riskLevel: 'High',
        priority: 'High',
        progress: 65,
        assignedHr: 'Vivek Gupta',
        scope: ['Identity', 'Employment', 'Education', 'Criminal', 'Credit Check'],
        verifiedCategories: ['Identity', 'Education'],
        discrepancies: [
          { category: 'Degree Certificate', issue: 'University stamp unverifiable with registrar.', severity: 'High' }
        ]
      },
      {
        bgvId: 'bgv_004',
        candidateName: 'Aarav Sharma',
        jobTitle: 'Software Engineer II',
        agencyName: 'AuthBridge Solutions',
        bgvType: 'Basic Package',
        initiatedAt: '2026-07-21T11:00:00Z',
        expectedCompletion: '2026-07-28T11:00:00Z',
        status: 'Pending Candidate',
        outcome: 'ManualReviewRequired',
        riskLevel: 'Low',
        priority: 'Normal',
        progress: 35,
        assignedHr: 'Rahul Sharma',
        scope: ['Identity', 'Address'],
        verifiedCategories: ['Identity'],
        discrepancies: []
      }
    ]
  }, [rawRecords])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !searchText || (
        r.candidateName?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.jobTitle?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.agencyName?.toLowerCase().includes(searchText.toLowerCase())
      )
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
      const matchRisk = riskFilter === 'ALL' || r.riskLevel === riskFilter
      return matchSearch && matchStatus && matchRisk
    })
  }, [records, searchText, statusFilter, riskFilter])

  // 11 Dashboard KPI Calculations
  const stats = useMemo(() => {
    const total = records.length
    const newly = records.filter(r => r.status === 'Initiated' || r.status === 'Pending Candidate').length
    const inProgress = records.filter(r => r.status === 'In Progress' || r.status === 'Running').length
    const pendingCandidate = records.filter(r => r.status === 'Pending Candidate').length
    const pendingAgency = records.filter(r => r.status === 'In Progress').length
    const cleared = records.filter(r => r.status === 'Cleared' || r.outcome === 'Cleared').length
    const discrepancies = records.filter(r => r.status === 'Discrepancy' || (r.discrepancies && r.discrepancies.length > 0)).length
    const slaBreached = records.filter(r => r.status === 'SLA Breached' || dayjs(r.expectedCompletion).isBefore(dayjs())).length
    const avgTime = '11.4 Days'
    const avgProgress = '84%'
    const avgRisk = 'LOW'

    return { total, newly, inProgress, pendingCandidate, pendingAgency, cleared, discrepancies, slaBreached, avgTime, avgProgress, avgRisk }
  }, [records])

  // Needs Attention Items
  const attentionItems = useMemo(() => {
    return records.filter(r => r.status === 'Discrepancy' || r.riskLevel === 'High' || r.riskLevel === 'Critical' || (r.discrepancies && r.discrepancies.length > 0))
  }, [records])

  // Main Table Columns
  const columns = [
    {
      title: 'Candidate & Position',
      key: 'candidate',
      width: 230,
      render: (_, r) => (
        <Space align="center" size={10}>
          <Avatar size={36} icon={<UserOutlined />} style={{ background: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#111' : '#fff', fontWeight: 700 }}>
            {(r.candidateName || 'C')[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#3B82F6' }}>{r.candidateName}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.jobTitle || 'Position'}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Agency & Package',
      key: 'agency',
      width: 200,
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12 }}>{r.agencyName}</div>
          <Tag color="purple" style={{ fontWeight: 700, fontSize: 10, borderRadius: 4, marginTop: 2 }}>{r.bgvType}</Tag>
        </div>
      )
    },
    {
      title: 'Verification Scope Chips',
      key: 'scope',
      width: 220,
      render: (_, r) => {
        const scopeList = r.scope || ['Identity', 'Employment', 'Education', 'Address']
        const verifiedSet = new Set(r.verifiedCategories || [])

        return (
          <Space wrap size={[4, 4]}>
            {scopeList.map(s => {
              const isVerified = verifiedSet.has(s)
              const isIssue = r.discrepancies?.some(d => d.category?.toLowerCase().includes(s.toLowerCase()))

              let color = 'default'
              if (isIssue) color = 'error'
              else if (isVerified) color = 'success'
              else color = 'processing'

              return (
                <Tag
                  key={s}
                  color={color}
                  onClick={() => { setSelectedCase(r); setCaseDrawerOpen(true) }}
                  style={{ cursor: 'pointer', fontWeight: 600, fontSize: 10, borderRadius: 4 }}
                >
                  {isVerified ? '✔ ' : isIssue ? '⚠ ' : '⏳ '}{s}
                </Tag>
              )
            })}
          </Space>
        )
      }
    },
    {
      title: 'Lifecycle Progress Tracker',
      key: 'progress',
      width: 220,
      render: (_, r) => (
        <div>
          <BgvProgressTracker status={r.status === 'Cleared' ? 'Completed' : r.status === 'Discrepancy' ? 'HRReview' : 'Running'} />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', marginTop: 4 }}>{r.progress || 75}% Complete</div>
        </div>
      )
    },
    {
      title: 'Risk Level',
      key: 'risk',
      width: 120,
      render: (_, r) => <RiskLevelBadge level={r.riskLevel || 'Low'} />
    },
    {
      title: 'Overall Status',
      key: 'status',
      width: 170,
      render: (_, r) => {
        const isReopened = reopenedCaseIds.includes(r.bgvId) || r.isReopened
        if (isReopened) {
          return (
            <Tag color="orange" style={{ fontWeight: 800, borderRadius: 4, width: 155, textAlign: 'center', height: 26, lineHeight: '26px' }}>
              🟠 REOPENED (Cycle 2)
            </Tag>
          )
        }
        const health = getCaseHealth(r)
        return (
          <Tag color={health.tagColor} style={{ fontWeight: 700, borderRadius: 4, width: 130, textAlign: 'center', height: 26, lineHeight: '26px' }}>
            {r.status?.toUpperCase() || 'IN PROGRESS'}
          </Tag>
        )
      }
    },
    {
      title: 'Quick Actions',
      key: 'actions',
      width: 240,
      align: 'right',
      render: (_, r) => {
        const isCleared = r.status === 'Cleared' || r.outcome === 'Cleared'
        return (
          <Space size={4} align="center">
            <Tooltip title="View Case Detail Drawer">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined style={{ color: '#3B82F6' }} />}
                onClick={() => { setSelectedCase(r); setCaseDrawerOpen(true) }}
                style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Tooltip>

            <Tooltip title="Candidate Documents Center">
              <Button
                size="small"
                type="text"
                icon={<FolderOpenOutlined style={{ color: '#06B6D4' }} />}
                onClick={() => { setSelectedCase(r); setDocumentsDrawerOpen(true) }}
                style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Tooltip>

            <Tooltip title="Audit Log Timeline">
              <Button
                size="small"
                type="text"
                icon={<HistoryOutlined style={{ color: '#FAA71A' }} />}
                onClick={() => { setSelectedCase(r); setTimelineDrawerOpen(true) }}
                style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Tooltip>

            <Tooltip title="Resolve Issues">
              <Button
                size="small"
                type="text"
                icon={<ToolOutlined style={{ color: '#F97316' }} />}
                onClick={() => { setSelectedCase(r); setResolveModalOpen(true) }}
                style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}
              />
            </Tooltip>

            {isCleared ? (
              <Tooltip title="Reopen Case Verification Cycle 2">
                <Button
                  size="small"
                  type="default"
                  danger
                  style={{ borderRadius: 6, fontWeight: 700, height: 30, fontSize: 11 }}
                  icon={<UndoOutlined />}
                  onClick={() => { setSelectedCase(r); setReopenModalOpen(true) }}
                >
                  Reopen
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Mark Case Cleared">
                <Button
                  size="small"
                  type="primary"
                  style={{ background: '#22C55E', borderColor: '#22C55E', borderRadius: 6, fontWeight: 600, height: 30, fontSize: 11 }}
                  icon={<CheckOutlined />}
                >
                  Clear
                </Button>
              </Tooltip>
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Background Verification Operations Center"
        subtitle="Master enterprise workspace for candidate background checks, agency management, risk assessment, and document verification."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment', path: '/recruitment' }, { label: 'Background Verification' }]}
      />

      {/* 11 Enterprise KPI Header Cards Grid */}
      <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="Total Cases" value={stats.total} icon={<SafetyCertificateOutlined />} color="#3B82F6" badgeText="TOTAL" badgeColor="blue" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="Newly Initiated" value={stats.newly} icon={<PlusOutlined />} color="#06B6D4" badgeText="NEW" badgeColor="cyan" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="In Progress" value={stats.inProgress} icon={<SyncOutlined spin={stats.inProgress > 0} />} color="#F59E0B" badgeText="RUNNING" badgeColor="warning" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="Pending Candidate" value={stats.pendingCandidate} icon={<ClockCircleOutlined />} color="#8B5CF6" badgeText="DOCS" badgeColor="purple" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="Cleared Cases" value={stats.cleared} icon={<CheckCircleOutlined />} color="#10B981" badgeText="PASSED" badgeColor="success" />
        </Col>

        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="Discrepancies" value={stats.discrepancies} icon={<AlertOutlined />} color="#EF4444" badgeText="ISSUE" badgeColor="error" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="SLA Breached" value={stats.slaBreached} icon={<ThunderboltOutlined />} color="#EF4444" badgeText="OVERDUE" badgeColor="error" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="Avg Completion" value={stats.avgTime} icon={<ClockCircleOutlined />} color="#F59E0B" badgeText="SLA" badgeColor="warning" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="Avg Progress" value={stats.avgProgress} icon={<RiseOutlined />} color="#10B981" badgeText="KPI" badgeColor="success" />
        </Col>
        <Col xs={12} sm={8} md={4} lg={2.18}>
          <StandardKpiCard title="Avg Risk Level" value={stats.avgRisk} icon={<WarningOutlined />} color="#10B981" badgeText="HEALTHY" badgeColor="emerald" />
        </Col>
      </Row>

      {/* 2. ⚠ Needs Attention Queue Panel */}
      {attentionItems.length > 0 && (
        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: '#EF4444', fontSize: 16 }} />
              <span style={{ fontWeight: 800, fontSize: 14, color: '#EF4444' }}>⚠ Needs Attention Queue ({attentionItems.length} Cases Requiring Action)</span>
            </Space>
          }
          style={{
            background: 'var(--color-bg-container)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            marginBottom: 16
          }}
          styles={{ body: { padding: 12 } }}
        >
          <Row gutter={[12, 12]}>
            {attentionItems.map(item => (
              <Col span={12} key={item.bgvId}>
                <Card bordered style={{ borderRadius: 8, background: 'rgba(239, 68, 68, 0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: '#3B82F6' }}>{item.candidateName}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 8 }}>({item.jobTitle})</span>
                    </div>
                    <RiskLevelBadge level={item.riskLevel} />
                  </div>
                  <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, marginTop: 4 }}>
                    Issue: {item.discrepancies?.[0]?.issue || 'Verification discrepancy reported by agency.'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>Assigned HR: {item.assignedHr}</span>
                    <Button
                      size="small"
                      type="primary"
                      danger
                      onClick={() => { setSelectedCase(item); setCaseDrawerOpen(true) }}
                      style={{ borderRadius: 4, height: 26, fontSize: 11, fontWeight: 700 }}
                    >
                      Resolve Case Issue →
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Smart Search & Filters Bar */}
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
              placeholder="Search candidate, position, or agency..."
              prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={8} md={5}>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: '100%' }}>
              <Option value="ALL">All Verification Statuses</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Cleared">Cleared</Option>
              <Option value="Discrepancy">Discrepancy</Option>
              <Option value="Pending Candidate">Pending Candidate</Option>
            </Select>
          </Col>
          <Col xs={12} sm={8} md={5}>
            <Select value={riskFilter} onChange={setRiskFilter} style={{ width: '100%' }}>
              <Option value="ALL">All Risk Levels</Option>
              <Option value="Low">🟢 Low Risk</Option>
              <Option value="Medium">🟡 Medium Risk</Option>
              <Option value="High">🟠 High Risk</Option>
              <Option value="Critical">🔴 Critical Risk</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6} style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Showing {filteredRecords.length} of {records.length} verification cases
            </span>
          </Col>
        </Row>
      </Card>

      {/* Main Verification Table */}
      <Card
        style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 16 }}
        styles={{ body: { padding: 16 } }}
      >
        {records.length === 0 && !isLoading ? (
          <EmptyState title="No BGV cases initiated yet" description="Initiate background check verification from accepted candidate offer letters." />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredRecords}
            rowKey="bgvId"
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      {/* 3. BGV Case Detail Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 16 }}>BGV Case: {selectedCase?.candidateName}</span>
              <div style={{ fontSize: 11, opacity: 0.65 }}>{selectedCase?.jobTitle} • {selectedCase?.bgvType}</div>
            </div>
            <Space>
              {(reopenedCaseIds.includes(selectedCase?.bgvId) || selectedCase?.isReopened) && (
                <Tag color="orange" style={{ fontWeight: 800, borderRadius: 4, height: 26, lineHeight: '26px' }}>
                  🟠 REOPENED • CYCLE 2 ACTIVE
                </Tag>
              )}
              <Tag color="red" style={{ fontWeight: 800, borderRadius: 4, height: 26, lineHeight: '26px' }}>
                🔥 {selectedCase?.priority?.toUpperCase() || 'HIGH'} PRIORITY • SLA 14 DAYS
              </Tag>
            </Space>
          </div>
        }
        open={caseDrawerOpen}
        onClose={() => setCaseDrawerOpen(false)}
        width={720}
      >
        {selectedCase && (
          <div>
            {/* Onboarding Readiness Handoff Banner */}
            {selectedCase.status === 'Cleared' && (
              <Alert
                message="🟢 Background Verification Cleared — Ready for Onboarding"
                description="All background checks passed! Candidate is verified and ready for employee onboarding."
                type="success"
                showIcon
                action={
                  <Button type="primary" size="small" style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }} href="/recruitment/onboarding">
                    Start Onboarding →
                  </Button>
                }
                style={{ marginBottom: 16, borderRadius: 8 }}
              />
            )}

            {/* Candidate & Agency Summary Cards */}
            <Row gutter={12} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card title={<span style={{ fontWeight: 700, fontSize: 12 }}>👤 Candidate & Position</span>} size="small">
                  <div>Candidate: <strong>{selectedCase.candidateName}</strong></div>
                  <div>Position: <strong>{selectedCase.jobTitle}</strong></div>
                  <div>Assigned HR: <strong>{selectedCase.assignedHr}</strong></div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title={<span style={{ fontWeight: 700, fontSize: 12 }}>🏢 Verification Agency</span>} size="small">
                  <div>Agency: <strong>{selectedCase.agencyName}</strong></div>
                  <div>Officer: <strong>Rahul Verma (+91 98200 11223)</strong></div>
                  <div>Status: <strong>{selectedCase.status}</strong></div>
                </Card>
              </Col>
            </Row>

            {/* Verification Confidence Bar */}
            <Card style={{ marginBottom: 16, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }} styles={{ body: { padding: 12 } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>Verification Confidence Score:</span>
                <span style={{ fontWeight: 800, fontSize: 15, color: getVerificationConfidence(selectedCase).color }}>
                  {getVerificationConfidence(selectedCase).score}%
                </span>
              </div>
              <Progress percent={getVerificationConfidence(selectedCase).score} strokeColor={getVerificationConfidence(selectedCase).color} showInfo={false} />
            </Card>

            {/* 5. Discrepancy Summary Card */}
            {selectedCase.discrepancies && selectedCase.discrepancies.length > 0 && (
              <Card title={<span style={{ fontWeight: 700, fontSize: 13, color: '#EF4444' }}>⚠ Discrepancy Summary</span>} style={{ marginBottom: 16, border: '1px solid rgba(239,68,68,0.3)' }}>
                {selectedCase.discrepancies.map((d, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <Tag color="error">{d.category}</Tag>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{d.issue}</span>
                  </div>
                ))}
              </Card>
            )}

            {/* Dynamic Verification Category Cards */}
            <Title level={5}>Dynamic Scope Categories ({selectedCase.scope?.length || 4})</Title>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
              {(selectedCase.scope || ['Identity', 'Employment', 'Education', 'Address']).map(cat => {
                const isVerified = selectedCase.verifiedCategories?.includes(cat)
                return (
                  <Col span={12} key={cat}>
                    <Card size="small" bordered style={{ borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>{cat}</span>
                        <Tag color={isVerified ? 'success' : 'processing'}>{isVerified ? 'Verified' : 'Running'}</Tag>
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>Verified By: {selectedCase.agencyName}</div>
                    </Card>
                  </Col>
                )
              })}
            </Row>

            {/* Verification Report Placeholder Section */}
            <Card
              title={<span style={{ fontWeight: 700, fontSize: 13 }}>📄 Comprehensive BGV Verification Report</span>}
              style={{ marginBottom: 16, borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}
              styles={{ body: { padding: 14 } }}
            >
              <Alert
                message="Comprehensive BGV Report — Available in Phase 4.2"
                description="Detailed multi-page PDF verification compilation containing official agency stamp, candidate document attachments, and verification audit breakdown will be available in Phase 4.2."
                type="info"
                showIcon
                style={{ marginBottom: 12, borderRadius: 8 }}
              />
              <Tooltip title="Enterprise Verification Report generation will be available in Phase 4.2.">
                <Button disabled type="primary" icon={<DownloadOutlined />} style={{ borderRadius: 6, fontWeight: 700 }}>
                  Download Report (Phase 4.2)
                </Button>
              </Tooltip>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Candidate Document Center Drawer */}
      <Drawer
        title="Candidate Document Center"
        open={documentsDrawerOpen}
        onClose={() => setDocumentsDrawerOpen(false)}
        width={500}
      >
        {selectedCase && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Document Checklist for {selectedCase.candidateName}</div>
            <List
              size="small"
              dataSource={[
                { name: 'Aadhaar Card', status: 'Uploaded', type: 'Identity' },
                { name: 'PAN Card', status: 'Uploaded', type: 'Identity' },
                { name: 'Degree Certificate', status: 'Needs Re-upload', type: 'Education' },
                { name: 'Past 3 Months Salary Slips', status: 'Uploaded', type: 'Employment' },
                { name: 'Relieving & Experience Letter', status: 'Pending', type: 'Employment' },
                { name: 'Police Verification Report', status: 'Pending', type: 'Criminal' }
              ]}
              renderItem={doc => (
                <List.Item
                  extra={
                    <Space>
                      <Button size="small" type="text" icon={<EyeOutlined />} />
                      <Button size="small" type="text" icon={<DownloadOutlined />} />
                    </Space>
                  }
                >
                  <List.Item.Meta
                    title={doc.name}
                    description={<Tag color={doc.status === 'Uploaded' ? 'success' : doc.status === 'Needs Re-upload' ? 'warning' : 'default'}>{doc.status}</Tag>}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>

      {/* Rich Activity Log Drawer */}
      <Drawer
        title="Azure DevOps Style Rich BGV Audit Log"
        open={timelineDrawerOpen}
        onClose={() => setTimelineDrawerOpen(false)}
        width={450}
      >
        {selectedCase && (
          <Timeline
            items={[
              { children: <div><strong>10:05 AM</strong> — Candidate uploaded PAN & Aadhaar</div>, color: 'green' },
              { children: <div><strong>10:32 AM</strong> — AuthBridge Solutions accepted verification case</div>, color: 'blue' },
              { children: <div><strong>11:15 AM</strong> — Employment verification initiated with previous employer</div>, color: 'blue' },
              { children: <div><strong>02:10 PM</strong> — Education degree stamp mismatch detected</div>, color: 'red' },
              { children: <div><strong>03:20 PM</strong> — HR requested clarification from candidate</div>, color: 'orange' },
              { children: <div><strong>05:00 PM</strong> — Candidate uploaded revised university degree transcript</div>, color: 'green' }
            ]}
          />
        )}
      </Drawer>

      {/* Reopen Background Verification Modal */}
      <Modal
        title={<span style={{ color: '#F97316', fontWeight: 800 }}>🟠 Reopen Background Verification (Cycle 2)</span>}
        open={reopenModalOpen}
        onCancel={() => { setReopenModalOpen(false); reopenForm.resetFields() }}
        footer={null}
        width={550}
        destroyOnClose
      >
        <Alert
          message="Re-opening Case Verification Cycle 2"
          description={`Original verification history (Cycle 1) will be preserved as immutable read-only. A new investigation cycle will be initialized.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
        />

        <Form
          form={reopenForm}
          layout="vertical"
          initialValues={{ category: 'Employment' }}
          onFinish={values => {
            if (selectedCase) {
              setReopenedCaseIds(prev => [...prev, selectedCase.bgvId])
            }
            message.success('BGV Verification case reopened! Cycle 2 investigation active.')
            setReopenModalOpen(false)
            reopenForm.resetFields()
          }}
        >
          <Form.Item name="reason" label="Reopening Reason (Required)" rules={[{ required: true, message: 'Please enter reason for reopening' }]}>
            <Input.TextArea rows={3} placeholder="e.g. Previous employer discrepancy reported post-joining..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Verification Category" rules={[{ required: true }]}>
                <Select>
                  <Option value="Employment">Employment Verification</Option>
                  <Option value="Education">Education Verification</Option>
                  <Option value="Address">Address Verification</Option>
                  <Option value="Criminal">Criminal Record Check</Option>
                  <Option value="Identity">Identity Verification</Option>
                  <Option value="Other">Other Issues</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Reopened By">
                <Input defaultValue="Rahul Sharma (HR Admin)" disabled />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Internal HR Notes (Optional)">
            <Input.TextArea rows={2} placeholder="Internal investigation notes..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setReopenModalOpen(false)}>Cancel</Button>
            <Button type="primary" danger htmlType="submit" style={{ fontWeight: 700 }}>
              Confirm & Reopen BGV Case
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
