import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Card, Table, Tag, Button, Space, Select, Drawer, Form, Input, DatePicker,
  InputNumber, Switch, Descriptions, Divider, Popconfirm, Tooltip, Row, Col,
  Statistic, Typography, message, Alert, Badge, List, Modal, Upload, AutoComplete, Spin
} from 'antd'
import {
  PlusOutlined, EditOutlined, EyeOutlined, StopOutlined, DeleteOutlined,
  SendOutlined, GlobalOutlined, InfoCircleOutlined, CalendarOutlined,
  TeamOutlined, FileTextOutlined, GiftOutlined, EnvironmentOutlined, LinkOutlined,
  UserAddOutlined, CheckCircleOutlined, UploadOutlined, UserOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { recruitmentService } from '../../services/recruitmentService'
import { organizationService } from '../../services/organizationService'
import { employeeService } from '../../services/employeeService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS, ROLES } from '../../constants/permissions'
import useUIStore from '../../store/uiStore'
import { useAuth } from '../../hooks/useAuth'

const { Option } = Select
const { Text, Paragraph, Title } = Typography

const JOB_CATEGORIES = [
  'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Customer Success', 'Legal', 'Product', 'Design', 'Other'
]

const EMPLOYMENT_TYPES = [
  { value: 'FullTime', label: 'Full Time' },
  { value: 'PartTime', label: 'Part Time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Internship', label: 'Internship' },
  { value: 'Temporary', label: 'Temporary' }
]

const PUBLISHING_CHANNELS = [
  'Careers Portal', 'Employee Referral', 'LinkedIn', 'Naukri', 'Indeed', 'Internal Job Posting'
]

const PERKS_BENEFITS = [
  'Flexible Hours', 'Remote Work', 'Health Insurance', 'Free Gym', 'Free Meals', 'Stock Options', 'Childcare', 'Work From Home', 'Performance Bonus'
]

// Status to Tag helper
const getStatusTag = (status) => {
  switch (status) {
    case 'Draft': return <Tag color="default">Draft</Tag>
    case 'Published': return <Tag color="success">Published</Tag>
    case 'Paused': return <Tag color="warning">Paused</Tag>
    case 'Closed': return <Tag color="error">Closed</Tag>
    case 'Archived': return <Tag color="purple">Archived</Tag>
    // Backward compatibility fallbacks
    case 'Active': return <Tag color="success">Published</Tag>
    case 'Expired': return <Tag color="error">Closed</Tag>
    default: return <Tag>{status}</Tag>
  }
}

export default function JobOpeningsPage() {
  const queryClient = useQueryClient()
  const { isDarkMode } = useUIStore()
  const { can } = usePermission()
  const { hasRole, user } = useAuth()
  const navigate = useNavigate()

  // RBAC: Only SUPER_ADMIN and HR_ADMIN can create, edit, delete or publish jobs
  const canPublish = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.HR_ADMIN)

  const [filters, setFilters] = useState({ status: undefined, departmentId: undefined, hiringManagerId: undefined })
  const [detailDrawer, setDetailDrawer] = useState({ open: false, record: null })
  const [formDrawer, setFormDrawer] = useState({ open: false, record: null, reqRecord: null })

  // ── Add Candidate Modal state ──────────────────────────────────────────────────
  const [addCandidateModal, setAddCandidateModal] = useState({ open: false, posting: null })
  const [addForm] = Form.useForm()
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [candidateSearch, setCandidateSearch] = useState('')
  const [lookupResults, setLookupResults] = useState([])
  const [lookupLoading, setLookupLoading] = useState(false)
  const [existingCandidate, setExistingCandidate] = useState(null) // filled when found
  const [resumeFile, setResumeFile] = useState(null)
  const lookupTimer = useRef(null)

  const openAddCandidateModal = (posting) => {
    setAddCandidateModal({ open: true, posting })
    setExistingCandidate(null)
    setCandidateSearch('')
    setLookupResults([])
    setResumeFile(null)
    addForm.resetFields()
  }

  const closeAddCandidateModal = () => {
    setAddCandidateModal({ open: false, posting: null })
    setExistingCandidate(null)
    setCandidateSearch('')
    setLookupResults([])
    setResumeFile(null)
    addForm.resetFields()
  }

  // Debounced candidate lookup
  const handleSearchChange = (val) => {
    setCandidateSearch(val)
    setExistingCandidate(null)
    if (lookupTimer.current) clearTimeout(lookupTimer.current)
    if (!val || val.trim().length < 2) {
      setLookupResults([])
      return
    }
    lookupTimer.current = setTimeout(async () => {
      setLookupLoading(true)
      try {
        const res = await recruitmentService.lookupCandidate(val.trim())
        setLookupResults(res?.data || [])
      } catch { setLookupResults([]) }
      finally { setLookupLoading(false) }
    }, 400)
  }

  const handleSelectExisting = (candidateId) => {
    const found = lookupResults.find(c => c.candidateId === candidateId)
    if (!found) return
    setExistingCandidate(found)
    setCandidateSearch(found.fullName)
    setLookupResults([])
    // Pre-fill professional fields (editable); identity fields are locked via disabled prop
    addForm.setFieldsValue({
      firstName: found.fullName.split(' ')[0] || '',
      lastName: found.fullName.split(' ').slice(1).join(' ') || '',
      email: found.email,
      phone: found.phone || '',
      currentCompany: found.currentCompany || '',
      currentDesignation: found.currentDesignation || '',
      currentCTC: found.currentCTC,
      expectedCTC: found.expectedCTC,
      noticePeriodDays: found.noticePeriodDays,
      totalExperience: found.totalExperience,
      source: found.source || undefined
    })
  }

  const handleAddCandidate = async () => {
    try {
      await addForm.validateFields()
    } catch { return }

    const values = addForm.getFieldsValue()
    const formData = new FormData()

    if (existingCandidate) {
      formData.append('existingCandidateId', existingCandidate.candidateId)
    }
    formData.append('email', existingCandidate ? existingCandidate.email : (values.email || ''))
    formData.append('phone', existingCandidate ? (existingCandidate.phone || '') : (values.phone || ''))
    if (!existingCandidate) {
      formData.append('firstName', values.firstName || '')
      formData.append('lastName', values.lastName || '')
    }
    if (values.currentCompany) formData.append('currentCompany', values.currentCompany)
    if (values.currentDesignation) formData.append('currentDesignation', values.currentDesignation)
    if (values.currentCTC != null) formData.append('currentCTC', values.currentCTC)
    if (values.expectedCTC != null) formData.append('expectedCTC', values.expectedCTC)
    if (values.noticePeriodDays != null) formData.append('noticePeriodDays', values.noticePeriodDays)
    if (values.totalExperience != null) formData.append('totalExperience', values.totalExperience)
    formData.append('source', 'ManualHR')
    if (resumeFile) formData.append('resumeFile', resumeFile)

    setAddSubmitting(true)
    try {
      const res = await recruitmentService.addCandidateToJob(addCandidateModal.posting.jobId, formData)
      if (res.success) {
        message.success(res.message || 'Candidate added successfully!')
        closeAddCandidateModal()
        queryClient.invalidateQueries({ queryKey: ['postings'] })
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.title
      if (err.response?.status === 409) {
        message.warning(msg || 'This candidate has already applied for this job.')
      } else {
        message.error(msg || 'Failed to add candidate.')
      }
    } finally {
      setAddSubmitting(false)
    }
  }

  // Queries
  const { data: postingsData, isLoading } = useQuery({
    queryKey: ['postings', filters],
    queryFn: () => recruitmentService.getAdminPostings(filters)
  })

  // Load Department and Employee lists for filters
  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => organizationService.getDepartments(),
    select: (r) => r?.data || []
  })

  const { data: employeesData } = useQuery({
    queryKey: ['active-employees'],
    queryFn: () => employeeService.getEmployees({ status: 'Active' })
  })

  // Load ONLY Approved MRFs for selection (exclude already posted ones)
  const { data: approvedMrfsData } = useQuery({
    queryKey: ['approved-requisitions'],
    queryFn: () => recruitmentService.getRequisitions({ status: 'Approved', excludePosted: true }),
    enabled: canPublish
  })

  const postings = postingsData?.data || []
  const approvedMrfs = approvedMrfsData?.data || []
  const departments = deptsData || []
  const employees = employeesData?.data || []

  // Mutations
  const publishMutation = useMutation({
    mutationFn: recruitmentService.publishPosting,
    onSuccess: (res) => {
      if (res.success) {
        message.success('Job posting is now Published and live.')
        queryClient.invalidateQueries({ queryKey: ['postings'] })
      }
    }
  })

  const unpublishMutation = useMutation({
    mutationFn: recruitmentService.unpublishPosting,
    onSuccess: (res) => {
      if (res.success) {
        message.success('Job posting has been moved back to Draft.')
        queryClient.invalidateQueries({ queryKey: ['postings'] })
      }
    }
  })

  const closeMutation = useMutation({
    mutationFn: recruitmentService.closePosting,
    onSuccess: (res) => {
      if (res.success) {
        message.success('Job posting is now Closed.')
        queryClient.invalidateQueries({ queryKey: ['postings'] })
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: recruitmentService.deletePosting,
    onSuccess: (res) => {
      if (res.success) {
        message.success('Job posting deleted successfully.')
        queryClient.invalidateQueries({ queryKey: ['postings'] })
      }
    }
  })

  // Table columns
  const columns = [
    {
      title: 'Job Title',
      key: 'jobTitle',
      minWidth: 180,
      render: (_, r) => (
        <span 
          style={{ fontWeight: 600, color: 'var(--color-primary-light)', cursor: 'pointer' }}
          onClick={() => setDetailDrawer({ open: true, record: r })}
        >
          {r.jobTitle}
        </span>
      )
    },
    {
      title: 'Created from MRF',
      dataIndex: 'mrfNumber',
      key: 'mrfNumber',
      minWidth: 130,
      render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{v || '-'}</span>
    },
    { title: 'Department', dataIndex: 'departmentName', key: 'departmentName', minWidth: 130 },
    { title: 'Designation', dataIndex: 'designationName', key: 'designationName', minWidth: 140 },
    { title: 'Hiring Manager', dataIndex: 'hiringManagerName', key: 'hiringManagerName', minWidth: 140 },
    { title: 'Vacancies', dataIndex: 'noOfPositions', key: 'noOfPositions', minWidth: 100, align: 'center' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      minWidth: 110,
      render: (v) => getStatusTag(v)
    },
    { 
      title: 'Published Date', 
      dataIndex: 'postedAt', 
      key: 'postedAt',
      minWidth: 130,
      render: (v, r) => r.status === 'Draft' ? '-' : (v ? dayjs(v).format('DD MMM YYYY') : '-')
    },
    { title: 'Published By', dataIndex: 'publishedByName', key: 'publishedByName', minWidth: 140 },
    {
      title: 'Applicants',
      dataIndex: 'applicantCount',
      key: 'applicantCount',
      minWidth: 100,
      align: 'center',
      render: (v, r) => (
        <Tooltip title="View applicants for this job">
          <Badge
            count={v || 0}
            showZero
            style={{ backgroundColor: (v > 0) ? '#8B5CF6' : '#ccc', cursor: 'pointer' }}
            onClick={() => navigate(`/recruitment/candidates?jobId=${r.jobId}`)}
          />
        </Tooltip>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      minWidth: 240,
      render: (_, r) => (
        <Space size="small">
          {canPublish && r.status === 'Draft' && (
            <Popconfirm title="Publish this job posting live?" onConfirm={() => publishMutation.mutate(r.jobId)}>
              <Button size="small" type="primary" ghost icon={<SendOutlined />}>Publish</Button>
            </Popconfirm>
          )}

          {canPublish && (r.status === 'Published' || r.status === 'Active') && (
            <Tooltip title="Add Candidate to this Job">
              <Button
                size="small"
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => openAddCandidateModal(r)}
                style={{ background: '#22C55E', borderColor: '#22C55E', color: '#fff', fontWeight: 600 }}
              >
                Add Candidate
              </Button>
            </Tooltip>
          )}

          {canPublish && (r.status === 'Published' || r.status === 'Active') && (
            <Popconfirm title="Unpublish this job posting to Draft?" onConfirm={() => unpublishMutation.mutate(r.jobId)}>
              <Button size="small" type="dashed" icon={<StopOutlined style={{ color: '#FAA71A' }} />}>Unpublish</Button>
            </Popconfirm>
          )}

          {canPublish && (r.status === 'Published' || r.status === 'Active') && (
            <Popconfirm title="Close this job posting?" onConfirm={() => closeMutation.mutate(r.jobId)}>
              <Button size="small" danger ghost icon={<StopOutlined />}>Close</Button>
            </Popconfirm>
          )}

          {canPublish && (
            <Tooltip title="Edit Posting Details">
              <Button size="small" type="text" icon={<EditOutlined style={{ color: '#FAA71A' }} />} onClick={() => setFormDrawer({ open: true, record: r, reqRecord: null })} />
            </Tooltip>
          )}

          {canPublish && (
            <Tooltip title="Delete Posting">
              <Popconfirm title="Delete this job posting permanently?" onConfirm={() => deleteMutation.mutate(r.jobId)} okButtonProps={{ danger: true }}>
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}

          <Tooltip title="View Posting Details">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setDetailDrawer({ open: true, record: r })} />
          </Tooltip>
        </Space>
      )
    }
  ]

  // Stats summaries
  const stats = {
    total: postings.length,
    published: postings.filter(p => p.status === 'Published' || p.status === 'Active').length,
    drafts: postings.filter(p => p.status === 'Draft').length,
    closed: postings.filter(p => p.status === 'Closed').length
  }

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Job Openings"
        subtitle="Create, publish, and manage external job postings from approved manpower requisitions (MRFs)."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment' }, { label: 'Job Openings' }]}
        extra={
          canPublish && (
            <Space>
              {approvedMrfs.length === 0 ? (
                <Tooltip title="No approved manpower requisitions available to create job postings.">
                  <Button type="primary" disabled icon={<PlusOutlined />} style={{ borderRadius: 8 }}>
                    Create Job Posting
                  </Button>
                </Tooltip>
              ) : (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setFormDrawer({ open: true, record: null, reqRecord: null })}
                  style={{
                    background: isDarkMode ? '#FAA71A' : '#11133F',
                    borderColor: isDarkMode ? '#FAA71A' : '#11133F',
                    color: isDarkMode ? '#11133F' : '#fff',
                    borderRadius: 8,
                    fontWeight: 600
                  }}
                >
                  Create Job Posting
                </Button>
              )}
            </Space>
          )
        }
      />

      {/* Warnings & Alerts */}
      {canPublish && approvedMrfs.length === 0 && (
        <Alert
          message="No Approved Requisitions Available"
          description="You cannot create new Job Postings because there are no Approved Manpower Requisitions (MRFs) in the database. Please raise and approve an MRF first."
          type="warning"
          showIcon
          style={{ marginBottom: 20, borderRadius: 8 }}
        />
      )}

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
            <Statistic title="Total Postings" value={stats.total} prefix={<GlobalOutlined style={{ color: '#3B82F6' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
            <Statistic title="Published Postings" value={stats.published} prefix={<SendOutlined style={{ color: '#22C55E' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
            <Statistic title="Draft Postings" value={stats.drafts} prefix={<EditOutlined style={{ color: '#6B7280' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
            <Statistic title="Closed Postings" value={stats.closed} prefix={<StopOutlined style={{ color: '#EF4444' }} />} />
          </Card>
        </Col>
      </Row>

      {/* Postings Table */}
      <Card
        style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 16 }}
        bodyStyle={{ padding: 20 }}
      >
        <div style={{ display: 'flex', gap: '12px', marginBottom: 16, flexWrap: 'wrap' }}>
          <Select 
            placeholder="Filter Status" 
            style={{ width: 180 }}
            allowClear
            onChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Published', label: 'Published' },
              { value: 'Paused', label: 'Paused' },
              { value: 'Closed', label: 'Closed' },
              { value: 'Archived', label: 'Archived' }
            ]}
          />
          <Select 
            placeholder="Filter Department" 
            style={{ width: 200 }}
            allowClear
            onChange={(v) => setFilters(prev => ({ ...prev, departmentId: v }))}
            options={departments.map(d => ({ value: d.deptId, label: d.deptName }))}
          />
          <Select 
            placeholder="Filter Hiring Manager" 
            style={{ width: 220 }}
            allowClear
            onChange={(v) => setFilters(prev => ({ ...prev, hiringManagerId: v }))}
            options={employees.map(e => ({ value: e.employeeId, label: `${e.firstName} ${e.lastName}` }))}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={postings}
            rowKey="jobId"
            loading={isLoading}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <EmptyState title="No job openings found" /> }}
          />
        </div>
      </Card>

      {/* Create/Edit Form Drawer */}
      <JobPostingFormDrawer
        open={formDrawer.open}
        record={formDrawer.record}
        reqRecord={formDrawer.reqRecord}
        approvedMrfs={approvedMrfs}
        onClose={() => setFormDrawer({ open: false, record: null, reqRecord: null })}
        onSuccess={() => {
          setFormDrawer({ open: false, record: null, reqRecord: null })
          queryClient.invalidateQueries({ queryKey: ['postings'] })
        }}
      />

      {/* Details Drawer */}
      <JobPostingDetailsDrawer
        open={detailDrawer.open}
        record={detailDrawer.record}
        onClose={() => setDetailDrawer({ open: false, record: null })}
      />

      {/* ── Smart Add Candidate Modal ──────────────────────────────────────────── */}
      <Modal
        open={addCandidateModal.open}
        onCancel={closeAddCandidateModal}
        title={
          <Space>
            <UserAddOutlined style={{ color: '#22C55E' }} />
            <span style={{ fontWeight: 700 }}>
              Add Candidate — {addCandidateModal.posting?.jobTitle}
            </span>
          </Space>
        }
        width={680}
        footer={[
          <Button key="cancel" onClick={closeAddCandidateModal}>Cancel</Button>,
          <Button
            key="submit"
            type="primary"
            loading={addSubmitting}
            onClick={handleAddCandidate}
            style={{ background: '#22C55E', borderColor: '#22C55E' }}
          >
            Add Candidate
          </Button>
        ]}
        destroyOnClose
      >
        {/* Search bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
            🔍 Search existing candidate by Name, Email, or Mobile
          </div>
          <AutoComplete
            style={{ width: '100%' }}
            value={candidateSearch}
            onChange={handleSearchChange}
            onSelect={(val, opt) => handleSelectExisting(opt.key)}
            options={lookupResults.map(c => ({
              key: c.candidateId,
              value: c.candidateId,
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{c.fullName}</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>{c.email} • {c.phone || '—'}</span>
                </div>
              )
            }))}
            notFoundContent={lookupLoading ? <Spin size="small" /> : null}
            placeholder="Type name, email, or mobile to search existing candidates..."
            allowClear
            onClear={() => { setExistingCandidate(null); addForm.resetFields() }}
          />
        </div>

        {/* Existing candidate badge */}
        {existingCandidate && (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 20, borderRadius: 8 }}
            message={
              <span>
                <strong>Existing Candidate Found</strong> — {existingCandidate.fullName}
              </span>
            }
            description={
              <span style={{ fontSize: 12 }}>
                {existingCandidate.email} • {existingCandidate.phone || '—'}<br />
                Identity is locked. You can update the professional details below before submitting.
              </span>
            }
          />
        )}

        <Form form={addForm} layout="vertical">
          {/* Identity fields — locked for existing candidates */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={!existingCandidate ? [{ required: true, message: 'Required' }] : []}
              >
                <Input
                  disabled={!!existingCandidate}
                  placeholder="First Name"
                  prefix={existingCandidate ? '🔒' : <UserOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name">
                <Input disabled={!!existingCandidate} placeholder="Last Name" prefix={existingCandidate ? '🔒' : null} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={!existingCandidate ? [{ required: true, type: 'email', message: 'Valid email required' }] : []}
              >
                <Input disabled={!!existingCandidate} placeholder="Email" prefix={existingCandidate ? '🔒' : null} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Mobile"
                rules={!existingCandidate ? [{ pattern: /^\d{10}$/, message: '10-digit number' }] : []}
              >
                <Input disabled={!!existingCandidate} placeholder="Mobile" prefix={existingCandidate ? '🔒' : null} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '8px 0 16px', borderColor: '#22C55E22' }}>
            <span style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>Professional Details — Always Editable</span>
          </Divider>

          {/* Professional fields — always editable */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="currentCompany" label="Current Company">
                <Input placeholder="e.g. Infosys" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currentDesignation" label="Current Designation">
                <Input placeholder="e.g. Senior Engineer" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="currentCTC" label="Current CTC (₹)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expectedCTC" label="Expected CTC (₹)">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="noticePeriodDays" label="Notice Period (Days)">
                <InputNumber style={{ width: '100%' }} min={0} max={180} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="totalExperience" label="Years of Experience">
                <InputNumber style={{ width: '100%' }} min={0} step={0.5} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          {/* Resume upload */}
          <Form.Item label="Resume (PDF / DOC)">
            <Upload
              beforeUpload={(file) => { setResumeFile(file); return false }}
              onRemove={() => setResumeFile(null)}
              maxCount={1}
              accept=".pdf,.doc,.docx"
              fileList={resumeFile ? [{ uid: '-1', name: resumeFile.name, status: 'done' }] : []}
            >
              <Button icon={<UploadOutlined />}>Upload Resume</Button>
            </Upload>
          </Form.Item>

          {/* Recruiter info — non-editable */}
          <div style={{
            background: isDarkMode ? '#1a1a2e' : '#f0fdf4',
            border: '1px solid #22C55E44',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: isDarkMode ? '#86efac' : '#166534'
          }}>
            👤 Recruiter will be assigned to: <strong>You ({user?.firstName} {user?.lastName})</strong>
          </div>
        </Form>
      </Modal>
    </div>
  )
}


// ─── Job Posting Form Drawer ────────────────────────────────────────────────
function JobPostingFormDrawer({ open, record, reqRecord, approvedMrfs, onClose, onSuccess }) {
  const [form] = Form.useForm()
  const { isDarkMode } = useUIStore()
  const [saving, setSaving] = useState(false)

  // Track currently selected Approved MRF
  const [selectedMrf, setSelectedMrf] = useState(null)

  useEffect(() => {
    if (open) {
      if (record) {
        // Edit Mode
        form.setFieldsValue({
          jobTitle: record.jobTitle,
          jobDescription: record.jobDescription,
          jobCategory: record.jobCategory,
          industry: record.industry,
          employmentType: record.employmentType,
          workMode: record.workMode || undefined,
          locationName: record.locationName || '',
          externalLink: record.externalLink || '',
          experienceMin: record.experienceMin,
          experienceMax: record.experienceMax,
          showSalaryRange: record.showSalaryRange,
          showCompanyName: record.showCompanyName,
          autoUnpublish: record.autoUnpublish,
          screeningEnabled: record.screeningEnabled,
          expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
          publishingChannels: record.publishingChannels || [],
          perksAndBenefits: record.perksAndBenefitsList || [],
          rolesAndResponsibilities: record.rolesAndResponsibilities || '',
          requirements: record.requirements || '',
          skillsRequired: record.skillsRequired || '',
          benefits: record.benefits || '',
          metadataJson: record.metadataJson || ''
        })
        setSelectedMrf({
          jobTitle: record.internalJobTitle,
          departmentName: record.departmentName,
          designationTitle: record.designationName,
          gradeName: record.gradeName,
          minSalary: record.minSalary,
          maxSalary: record.maxSalary
        })
      } else {
        // Create Mode
        form.resetFields()
        setSelectedMrf(null)
      }
    }
  }, [open, record, form])

  const handleMrfChange = (mrfId) => {
    const matched = approvedMrfs.find(m => m.reqId === mrfId)
    if (matched) {
      setSelectedMrf(matched)
      form.setFieldsValue({
        jobTitle: matched.jobTitle,
        jobDescription: matched.jobDescription,
        experienceMin: matched.minExperience,
        experienceMax: matched.maxExperience,
        skillsRequired: matched.skillsRequired
      })
    }
  }

  const handleFinish = async (values) => {
    setSaving(true)
    try {
      const payload = {
        jobTitle: values.jobTitle,
        jobDescription: values.jobDescription || '',
        jobCategory: values.jobCategory || null,
        industry: values.industry || null,
        employmentType: values.employmentType || null,
        workMode: values.workMode || null,
        locationName: values.locationName || null,
        externalLink: values.externalLink || null,
        experienceMin: values.experienceMin || null,
        experienceMax: values.experienceMax || null,
        showSalaryRange: !!values.showSalaryRange,
        showCompanyName: !!values.showCompanyName,
        autoUnpublish: !!values.autoUnpublish,
        screeningEnabled: !!values.screeningEnabled,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
        publishingChannels: values.publishingChannels || [],
        perksAndBenefits: values.perksAndBenefits || [],
        rolesAndResponsibilities: values.rolesAndResponsibilities || '',
        requirements: values.requirements || '',
        skillsRequired: values.skillsRequired || '',
        benefits: values.benefits || '',
        metadataJson: values.metadataJson || null
      }

      let res
      if (record) {
        res = await recruitmentService.updatePosting(record.jobId, payload)
      } else {
        res = await recruitmentService.createPosting({
          reqId: values.reqId,
          ...payload
        })
      }

      if (res.success) {
        message.success(record ? 'Job posting updated successfully.' : 'Job posting created successfully.')
        onSuccess()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save job posting.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      title={<span style={{ fontWeight: 700 }}>{record ? 'Edit Job Posting Advertisement' : 'Create Job Posting Advertisement'}</span>}
      placement="right"
      width={650}
      open={open}
      onClose={onClose}
      footer={
        <div style={{ textAlign: 'right', padding: '10px 0' }}>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={saving}
              style={{ background: isDarkMode ? '#FAA71A' : '#11133F', borderColor: isDarkMode ? '#FAA71A' : '#11133F', color: isDarkMode ? '#11133F' : '#fff', fontWeight: 600 }}
            >
              Save Posting
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {/* Approved MRF Select (Only editable on Create) */}
        {!record && (
          <Form.Item name="reqId" label="Link Approved Manpower Requisition (MRF)" rules={[{ required: true, message: 'Selecting an Approved MRF is required' }]}>
            <Select placeholder="Select Approved MRF..." onChange={handleMrfChange} dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
              {approvedMrfs.map(m => (
                <Option key={m.reqId} value={m.reqId}>
                  {m.jobTitle} ({m.mrfNumber})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* Read-only reference metadata prefilled */}
        {selectedMrf && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, borderLeft: '3px solid #8B5CF6' }}>
            <Descriptions title="Internal Requisition Details (Read-Only)" size="small" column={1}>
              <Descriptions.Item label="Internal Job Title">{selectedMrf.jobTitle || '-'}</Descriptions.Item>
              <Descriptions.Item label="Department">{selectedMrf.departmentName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Designation">{selectedMrf.designationTitle || '-'}</Descriptions.Item>
              <Descriptions.Item label="Grade">{selectedMrf.gradeName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Salary Budget Range">
                {selectedMrf.minSalary ? `₹ ${selectedMrf.minSalary.toLocaleString()}` : '-'} to {selectedMrf.maxSalary ? `₹ ${selectedMrf.maxSalary.toLocaleString()}` : '-'} per annum
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}

        <Form.Item name="jobTitle" label="Public Job Title (Advertised)" rules={[{ required: true, message: 'Public title is required' }]}>
          <Input placeholder="e.g. Senior Backend Engineer (C# / .NET)" style={{ borderRadius: 6 }} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="jobCategory" label="Job Category" rules={[{ required: true, message: 'Category is required' }]}>
              <Select placeholder="Select Category" dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
                {JOB_CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true, message: 'Employment type is required' }]}>
              <Select placeholder="Select Employment Type" options={EMPLOYMENT_TYPES} dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Career Portal Settings</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="workMode" label="Work Mode">
              <Select placeholder="Select Work Mode" dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
                <Option value="OnSite">Onsite</Option>
                <Option value="Remote">Remote</Option>
                <Option value="Hybrid">Hybrid</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="locationName" label="Location Name">
              <Input placeholder="e.g. Bengaluru, India" style={{ borderRadius: 6 }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="externalLink" label="External Apply Link">
          <Input placeholder="e.g. https://careers.company.com/job-apply/123" style={{ borderRadius: 6 }} />
        </Form.Item>

        <Form.Item name="metadataJson" label="Custom Portal Metadata (JSON format)">
          <Input.TextArea rows={2} placeholder='e.g. { "hiring_urgency": "High", "featured": true }' style={{ borderRadius: 6 }} />
        </Form.Item>

        <Form.Item name="industry" label="Industry Sector" rules={[{ required: true, message: 'Industry sector is required' }]}>
          <Input placeholder="e.g. Information Technology / FinTech" style={{ borderRadius: 6 }} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="experienceMin" label="Min Experience Required (Years)">
              <InputNumber min={0} max={40} style={{ width: '100%', borderRadius: 6 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="experienceMax" label="Max Experience Required (Years)">
              <InputNumber min={0} max={40} style={{ width: '100%', borderRadius: 6 }} />
            </Form.Item>
          </Col>
        </Row>

        {/* Display Toggles */}
        <Divider orientation="left" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Display Toggles</Divider>
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col span={6}>
            <Form.Item name="showSalaryRange" label="Show Salary?" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="showCompanyName" label="Show Company?" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="autoUnpublish" label="Auto Unpublish?" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="screeningEnabled" label="Pre-Screening?" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="expiryDate" label="Posting Expiry Date">
          <DatePicker style={{ width: '100%', borderRadius: 6 }} disabledDate={c => c && c < dayjs().startOf('day')} />
        </Form.Item>

        <Form.Item name="publishingChannels" label="Publishing Channels" rules={[{ required: true, message: 'Please select at least one channel' }]}>
          <Select mode="tags" placeholder="Select or type custom channels" style={{ width: '100%' }}>
            {PUBLISHING_CHANNELS.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
        </Form.Item>

        <Form.Item name="perksAndBenefits" label="Perks & Benefits Offered">
          <Select mode="tags" placeholder="Select or type custom perks" style={{ width: '100%' }}>
            {PERKS_BENEFITS.map(p => <Option key={p} value={p}>{p}</Option>)}
          </Select>
        </Form.Item>

        <Divider orientation="left" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Advertisement Details</Divider>
        <Form.Item name="jobDescription" label="Job Description Summary" rules={[{ required: true, message: 'Description is required' }]}>
          <Input.TextArea rows={4} placeholder="Describe the role details..." style={{ borderRadius: 6 }} />
        </Form.Item>

        <Form.Item name="rolesAndResponsibilities" label="Roles & Responsibilities">
          <Input.TextArea rows={3} placeholder="Detail day-to-day duties..." style={{ borderRadius: 6 }} />
        </Form.Item>

        <Form.Item name="requirements" label="Job Requirements / Qualifications">
          <Input.TextArea rows={3} placeholder="Requirements like degree, technical certifications..." style={{ borderRadius: 6 }} />
        </Form.Item>

        <Form.Item name="skillsRequired" label="Required Skills (Comma separated)">
          <Input placeholder="e.g. React, Node.js, C#, SQL Server" style={{ borderRadius: 6 }} />
        </Form.Item>

        <Form.Item name="benefits" label="Additional Compensation & Benefits Details">
          <Input.TextArea rows={2} placeholder="Detail bonus plans, wellness policies, work-from-home options..." style={{ borderRadius: 6 }} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

// ─── Job Posting Details Drawer (Displaying Stage Stats) ───────────────────
function JobPostingDetailsDrawer({ open, record, onClose }) {
  const { data: appsData, isLoading } = useQuery({
    queryKey: ['job-applications', record?.reqId],
    queryFn: () => recruitmentService.getApplications({ reqId: record?.reqId }),
    enabled: !!record
  })

  if (!record) return null

  const applications = appsData?.data || []

  // Compute live stage metrics counts (exact 5 ATS stages: Applied, Screening, Interview, Offer, Hired)
  const stageStats = {
    applied: applications.filter(a => ['Applied', 'New', 'Submitted'].includes(a.currentStage) || !a.currentStage).length,
    screening: applications.filter(a => ['Screening', 'Shortlisted'].includes(a.currentStage)).length,
    interview: applications.filter(a => ['Interview', 'InterviewL1', 'InterviewL2', 'HRInterview'].includes(a.currentStage)).length,
    offer: applications.filter(a => ['Offer', 'OfferExtended', 'OfferAccepted'].includes(a.currentStage)).length,
    hired: applications.filter(a => ['Hired', 'Joined'].includes(a.currentStage)).length
  }

  return (
    <Drawer
      title={<span style={{ fontWeight: 700 }}>Job Posting Details</span>}
      placement="right"
      width={600}
      open={open}
      onClose={onClose}
    >
      {/* Live Stage Counts */}
      <h5 style={{ fontWeight: 700, marginBottom: 12 }}><TeamOutlined /> ATS Recruitment Funnel</h5>
      <Row gutter={[8, 8]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center', padding: '4px 0' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Applied</span>} value={stageStats.applied} valueStyle={{ fontSize: 18, fontWeight: 700 }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center', padding: '4px 0' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Screening</span>} value={stageStats.screening} valueStyle={{ fontSize: 18, fontWeight: 700 }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center', padding: '4px 0' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Interview</span>} value={stageStats.interview} valueStyle={{ fontSize: 18, fontWeight: 700 }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center', padding: '4px 0' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Offer</span>} value={stageStats.offer} valueStyle={{ fontSize: 18, fontWeight: 700 }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center', padding: '4px 0' }}>
            <Statistic title={<span style={{ fontSize: 11 }}>Hired</span>} value={stageStats.hired} valueStyle={{ fontSize: 18, fontWeight: 700, color: '#22C55E' }} />
          </Card>
        </Col>
      </Row>

      <Descriptions title="Job Advertisement Overview" bordered column={1} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Public Job Title">{record.jobTitle}</Descriptions.Item>
        <Descriptions.Item label="Internal MRF Title">{record.internalJobTitle || '-'}</Descriptions.Item>
        <Descriptions.Item label="Department">{record.departmentName || '-'}</Descriptions.Item>
        <Descriptions.Item label="Designation">{record.designationName || '-'}</Descriptions.Item>
        <Descriptions.Item label="Hiring Manager">{record.hiringManagerName || '-'}</Descriptions.Item>
        <Descriptions.Item label="Grade">{record.gradeName || '-'}</Descriptions.Item>
        <Descriptions.Item label="Status">{getStatusTag(record.status)}</Descriptions.Item>
        <Descriptions.Item label="Employment Type">{record.employmentType || '-'}</Descriptions.Item>
        <Descriptions.Item label="Job Category">{record.jobCategory || '-'}</Descriptions.Item>
        <Descriptions.Item label="Work Mode">
          <Tag color="cyan"><EnvironmentOutlined /> {record.workMode || 'Not Specified'}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Location Name">{record.locationName || '-'}</Descriptions.Item>
        <Descriptions.Item label="External Apply Link">
          {record.externalLink ? (
            <a href={record.externalLink} target="_blank" rel="noreferrer">
              <LinkOutlined /> Visit External Link
            </a>
          ) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Show Salary Range">{record.showSalaryRange ? 'Yes' : 'No'}</Descriptions.Item>
        <Descriptions.Item label="Show Company Name">{record.showCompanyName ? 'Yes' : 'No'}</Descriptions.Item>
        <Descriptions.Item label="Posted At">{dayjs(record.postedAt).format('DD MMM YYYY HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="Expiry Date">{record.expiryDate ? dayjs(record.expiryDate).format('DD MMM YYYY') : '-'}</Descriptions.Item>
        <Descriptions.Item label="Published By">{record.publishedByName || '-'}</Descriptions.Item>
      </Descriptions>

      {record.perksAndBenefitsList?.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 6 }}>PERKS & BENEFITS</Text>
          {record.perksAndBenefitsList.map(p => (
            <Tag color="green" key={p} style={{ borderRadius: 6, fontSize: 11, padding: '3px 8px' }}>
              <GiftOutlined style={{ marginRight: 4 }} /> {p}
            </Tag>
          ))}
        </div>
      )}

      <Divider />
      <h5 style={{ fontWeight: 700 }}>Job Description</h5>
      <Paragraph style={{ background: 'var(--color-bg-elevated)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
        {record.jobDescription || 'No description provided.'}
      </Paragraph>

      {record.rolesAndResponsibilities && (
        <>
          <h5 style={{ fontWeight: 700 }}>Roles & Responsibilities</h5>
          <Paragraph style={{ background: 'var(--color-bg-elevated)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
            {record.rolesAndResponsibilities}
          </Paragraph>
        </>
      )}

      {record.requirements && (
        <>
          <h5 style={{ fontWeight: 700 }}>Qualifications & Requirements</h5>
          <Paragraph style={{ background: 'var(--color-bg-elevated)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
            {record.requirements}
          </Paragraph>
        </>
      )}

      {record.benefits && (
        <>
          <h5 style={{ fontWeight: 700 }}>Compensation Benefits Details</h5>
          <Paragraph style={{ background: 'var(--color-bg-elevated)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
            {record.benefits}
          </Paragraph>
        </>
      )}

      {/* Applied Candidates List */}
      <Divider />
      <h5 style={{ fontWeight: 700, marginBottom: 12 }}><TeamOutlined /> Applied Candidates List</h5>
      {isLoading ? (
        <Badge status="processing" text="Loading candidates..." />
      ) : applications.length === 0 ? (
        <EmptyState title="No candidates have applied to this posting yet" />
      ) : (
        <List
          size="small"
          dataSource={applications}
          renderItem={app => (
            <List.Item key={app.appId}>
              <List.Item.Meta
                title={<span style={{ fontWeight: 600 }}>{app.candidate?.firstName} {app.candidate?.lastName}</span>}
                description={
                  <Space size="middle" style={{ fontSize: 11, opacity: 0.5 }}>
                    <span>Email: {app.candidate?.email}</span>
                    <span>Applied: {dayjs(app.applicationDate).format('DD MMM YYYY')}</span>
                  </Space>
                }
              />
              <Tag color="purple">{app.currentStage}</Tag>
            </List.Item>
          )}
        />
      )}
    </Drawer>
  )
}
