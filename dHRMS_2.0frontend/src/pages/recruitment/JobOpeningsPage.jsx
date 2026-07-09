import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Table, Tag, Button, Space, Select, Drawer, Form, Input, DatePicker,
  InputNumber, Switch, Descriptions, Divider, Popconfirm, Tooltip, Row, Col,
  Statistic, Typography, message, Alert, Badge, List
} from 'antd'
import {
  PlusOutlined, EditOutlined, EyeOutlined, StopOutlined, DeleteOutlined,
  SendOutlined, GlobalOutlined, InfoCircleOutlined, CalendarOutlined,
  TeamOutlined, FileTextOutlined, GiftOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { recruitmentService } from '../../services/recruitmentService'
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
    case 'Active': return <Tag color="success">Active</Tag>
    case 'Closed': return <Tag color="error">Closed</Tag>
    case 'Expired': return <Tag color="warning">Expired</Tag>
    default: return <Tag>{status}</Tag>
  }
}

export default function JobOpeningsPage() {
  const queryClient = useQueryClient()
  const { isDarkMode } = useUIStore()
  const { can } = usePermission()
  const { hasRole } = useAuth()

  // RBAC Controls
  const isHRorAdmin = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.HR_ADMIN) || hasRole(ROLES.HR_MANAGER) || hasRole(ROLES.RECRUITMENT_MANAGER)

  const [filters, setFilters] = useState({ status: undefined })
  const [detailDrawer, setDetailDrawer] = useState({ open: false, record: null })
  const [formDrawer, setFormDrawer] = useState({ open: false, record: null, reqRecord: null })

  // Queries
  const { data: postingsData, isLoading } = useQuery({
    queryKey: ['postings', filters],
    queryFn: () => recruitmentService.getAdminPostings(filters)
  })

  // Load ONLY Approved MRFs for selection
  const { data: approvedMrfsData } = useQuery({
    queryKey: ['approved-requisitions'],
    queryFn: () => recruitmentService.getRequisitions({ status: 'Approved' }),
    enabled: isHRorAdmin
  })

  const postings = postingsData?.data || []
  const approvedMrfs = approvedMrfsData?.data || []

  // Mutations
  const publishMutation = useMutation({
    mutationFn: recruitmentService.publishPosting,
    onSuccess: (res) => {
      if (res.success) {
        message.success('Job posting is now active and live.')
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
        message.success('Job posting is now closed.')
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
      title: 'MRF Code',
      dataIndex: 'mrfNumber',
      key: 'mrfNumber',
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v || '-'}</span>
    },
    { title: 'Department', dataIndex: 'departmentName', key: 'departmentName' },
    { title: 'Designation', dataIndex: 'designationName', key: 'designationName' },
    { 
      title: 'Posted Date', 
      dataIndex: 'postedAt', 
      key: 'postedAt',
      render: (v) => dayjs(v).format('DD MMM YYYY')
    },
    { 
      title: 'Expiry Date', 
      dataIndex: 'expiryDate', 
      key: 'expiryDate',
      render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '-'
    },
    {
      title: 'Published Channels',
      dataIndex: 'publishingChannels',
      key: 'channels',
      render: (v) => {
        if (!v || !v.length) return '-'
        return (
          <Space size={[4, 4]} wrap>
            {v.map(c => <Tag color="blue" style={{ margin: 0 }} key={c}>{c}</Tag>)}
          </Space>
        )
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => getStatusTag(v)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space size="middle">
          {r.status === 'Draft' && can(PERMISSIONS.RECRUITMENT.EDIT) && (
            <Popconfirm title="Publish this job posting live?" onConfirm={() => publishMutation.mutate(r.jobId)}>
              <Button size="small" type="primary" ghost icon={<SendOutlined />}>Publish</Button>
            </Popconfirm>
          )}

          {r.status === 'Active' && can(PERMISSIONS.RECRUITMENT.EDIT) && (
            <Popconfirm title="Unpublish this job posting to Draft?" onConfirm={() => unpublishMutation.mutate(r.jobId)}>
              <Button size="small" type="dashed" icon={<StopOutlined style={{ color: '#FAA71A' }} />}>Unpublish</Button>
            </Popconfirm>
          )}

          {r.status === 'Active' && can(PERMISSIONS.RECRUITMENT.EDIT) && (
            <Popconfirm title="Close this job posting?" onConfirm={() => closeMutation.mutate(r.jobId)}>
              <Button size="small" danger ghost icon={<StopOutlined />}>Close</Button>
            </Popconfirm>
          )}

          {can(PERMISSIONS.RECRUITMENT.EDIT) && (
            <Tooltip title="Edit Posting Details">
              <Button size="small" type="text" icon={<EditOutlined style={{ color: '#FAA71A' }} />} onClick={() => setFormDrawer({ open: true, record: r, reqRecord: null })} />
            </Tooltip>
          )}

          {can(PERMISSIONS.RECRUITMENT.EDIT) && (
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
    active: postings.filter(p => p.status === 'Active').length,
    drafts: postings.filter(p => p.status === 'Draft').length,
    closed: postings.filter(p => p.status === 'Closed').length
  }

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Job Openings Management"
        subtitle="Create public job opening postings from approved manpower requisitions."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment Hub', path: '/recruitment' }, { label: 'Job Openings' }]}
        extra={
          isHRorAdmin && (
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
      {isHRorAdmin && approvedMrfs.length === 0 && (
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
            <Statistic title="Active Postings" value={stats.active} prefix={<SendOutlined style={{ color: '#22C55E' }} />} />
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
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
          <Select 
            placeholder="Filter Status" 
            style={{ width: 180 }}
            allowClear
            onChange={(v) => setFilters({ status: v })}
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'Active', label: 'Active' },
              { value: 'Closed', label: 'Closed' },
              { value: 'Expired', label: 'Expired' }
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={postings}
          rowKey="jobId"
          loading={isLoading}
          locale={{ emptyText: <EmptyState title="No job openings found" /> }}
        />
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
          benefits: record.benefits || ''
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
        benefits: values.benefits || ''
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

  // Compute live stage metrics counts
  const stageStats = {
    total: applications.length,
    screening: applications.filter(a => a.currentStage === 'Screening').length,
    shortlisted: applications.filter(a => a.currentStage === 'Shortlisted').length,
    interview: applications.filter(a => ['InterviewL1', 'InterviewL2', 'HRInterview'].includes(a.currentStage)).length,
    offer: applications.filter(a => a.currentStage === 'Offer').length,
    joined: applications.filter(a => a.currentStage === 'Joined').length,
    rejected: applications.filter(a => a.currentStage === 'Rejected').length
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
      <h5 style={{ fontWeight: 700, marginBottom: 12 }}><TeamOutlined /> Sourcing Stage Metrics</h5>
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center' }}>
            <Statistic title="Total Applied" value={stageStats.total} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center' }}>
            <Statistic title="Screening" value={stageStats.screening} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center' }}>
            <Statistic title="Shortlisted" value={stageStats.shortlisted} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center' }}>
            <Statistic title="Interviews" value={stageStats.interview} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center' }}>
            <Statistic title="Offers" value={stageStats.offer} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', textAlign: 'center' }}>
            <Statistic title="Joined" value={stageStats.joined} />
          </Card>
        </Col>
      </Row>

      <Descriptions title="Job Advertisement Overview" bordered column={1} size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Public Job Title">{record.jobTitle}</Descriptions.Item>
        <Descriptions.Item label="Internal MRF Title">{record.internalJobTitle || '-'}</Descriptions.Item>
        <Descriptions.Item label="Department">{record.departmentName || '-'}</Descriptions.Item>
        <Descriptions.Item label="Designation">{record.designationName || '-'}</Descriptions.Item>
        <Descriptions.Item label="Grade">{record.gradeName || '-'}</Descriptions.Item>
        <Descriptions.Item label="Status">{getStatusTag(record.status)}</Descriptions.Item>
        <Descriptions.Item label="Employment Type">{record.employmentType || '-'}</Descriptions.Item>
        <Descriptions.Item label="Job Category">{record.jobCategory || '-'}</Descriptions.Item>
        <Descriptions.Item label="Show Salary Range">{record.showSalaryRange ? 'Yes' : 'No'}</Descriptions.Item>
        <Descriptions.Item label="Show Company Name">{record.showCompanyName ? 'Yes' : 'No'}</Descriptions.Item>
        <Descriptions.Item label="Posted At">{dayjs(record.postedAt).format('DD MMM YYYY HH:mm')}</Descriptions.Item>
        <Descriptions.Item label="Expiry Date">{record.expiryDate ? dayjs(record.expiryDate).format('DD MMM YYYY') : '-'}</Descriptions.Item>
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
