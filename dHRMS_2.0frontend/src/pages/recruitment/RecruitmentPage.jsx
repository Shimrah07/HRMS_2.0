import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Tabs, Table, Button, Tag, Modal, Form, Input, Select, DatePicker,
  InputNumber, message, Space, Card, Row, Col, Statistic, Tooltip,
  Drawer, Descriptions, Divider, Popconfirm, notification, Switch, Alert, List, Avatar, Badge, Typography
} from 'antd'
import {
  PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined,
  SendOutlined, EyeOutlined, StopOutlined, FileTextOutlined,
  FieldTimeOutlined, TeamOutlined, UserSwitchOutlined, GlobalOutlined,
  DeleteOutlined, SmileOutlined, GiftOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
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
const { Text, Title } = Typography

// Dropdown Helper Data
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

// Helper for date formatting
const formatDate = (dateOnly) => {
  if (!dateOnly) return '-'
  return dayjs(dateOnly).format('DD MMM YYYY')
}

// ─── Job Posting Form Drawer Component (Create / Edit) ────────────────────────
function JobPostingFormDrawer({ open, record, reqRecord, onClose, onSuccess }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const { isDarkMode } = useUIStore()

  useEffect(() => {
    if (open) {
      if (record) {
        // Edit flow
        form.setFieldsValue({
          jobTitle: record.jobTitle,
          jobDescription: record.jobDescription,
          jobCategory: record.jobCategory,
          industry: record.industry,
          employmentType: record.employmentType,
          experienceMin: record.experienceMin,
          experienceMax: record.experienceMax,
          showSalaryRange: record.showSalaryRange,
          showSalary: record.showSalary,
          showCompanyName: record.showCompanyName,
          autoUnpublish: record.autoUnpublish,
          expiryDate: record.expiryDate ? dayjs(record.expiryDate) : null,
          publishingChannels: record.publishingChannels || [],
          perksAndBenefits: record.perksAndBenefitsList || []
        })
      } else if (reqRecord) {
        // Create flow
        form.setFieldsValue({
          jobTitle: reqRecord.jobTitle,
          jobDescription: reqRecord.jobDescription,
          jobCategory: undefined,
          industry: undefined,
          employmentType: undefined,
          experienceMin: reqRecord.minExperience,
          experienceMax: reqRecord.maxExperience,
          showSalaryRange: true,
          showSalary: true,
          showCompanyName: true,
          autoUnpublish: false,
          expiryDate: null,
          publishingChannels: ['Careers Portal'],
          perksAndBenefits: []
        })
      }
    } else {
      form.resetFields()
    }
  }, [open, record, reqRecord, form])

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
        showSalary: !!values.showSalary,
        showCompanyName: !!values.showCompanyName,
        autoUnpublish: !!values.autoUnpublish,
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
        publishingChannels: values.publishingChannels || [],
        perksAndBenefits: values.perksAndBenefits || []
      }

      if (record) {
        const res = await recruitmentService.updatePosting(record.jobId, payload)
        if (res.success) {
          message.success('Job posting details updated successfully.')
          onSuccess()
        }
      } else if (reqRecord) {
        const res = await recruitmentService.createPosting({
          reqId: reqRecord.reqId,
          ...payload
        })
        if (res.success) {
          message.success('Job posting created successfully (Draft).')
          onSuccess()
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save job posting.')
    } finally {
      setSaving(false)
    }
  }

  // Read-only metadata
  const internalTitle = record ? record.internalJobTitle : reqRecord?.jobTitle
  const departmentName = record ? record.departmentName : reqRecord?.departmentName
  const designationName = record ? record.designationName : reqRecord?.designationTitle
  const gradeName = record ? record.gradeName : reqRecord?.gradeName
  const minSalaryBudget = record ? record.minSalary : reqRecord?.minSalary
  const maxSalaryBudget = record ? record.maxSalary : reqRecord?.maxSalary

  return (
    <Drawer
      title={<span style={{ fontWeight: 700, fontSize: 16 }}>{record ? 'Edit Job Posting Advertisement' : 'Create Job Posting Advertisement'}</span>}
      placement="right"
      width={600}
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
        {/* Requisition Reference Info */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, borderLeft: '3px solid #8B5CF6' }}>
          <Descriptions title="Internal MRF Reference" size="small" column={1}>
            <Descriptions.Item label="Internal Job Title">{internalTitle || '-'}</Descriptions.Item>
            <Descriptions.Item label="Department / Designation">{departmentName || '-'} / {designationName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Salary Budget Range">
              {minSalaryBudget ? `₹ ${minSalaryBudget.toLocaleString()}` : '-'} to {maxSalaryBudget ? `₹ ${maxSalaryBudget.toLocaleString()}` : '-'} per annum
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Basic Sourcing Information */}
        <Form.Item name="jobTitle" label="Public Job Title (Advertised Title)" rules={[{ required: true, message: 'Public job title is required' }]}>
          <Input placeholder="e.g. Senior Full-Stack Engineer (.NET & React)" style={{ borderRadius: 6 }} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="jobCategory" label="Job Category" rules={[{ required: true, message: 'Category is required' }]}>
              <Select placeholder="Select category" dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
                {JOB_CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true, message: 'Employment type is required' }]}>
              <Select placeholder="Select type" options={EMPLOYMENT_TYPES} dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="industry" label="Industry Sector" rules={[{ required: true, message: 'Industry is required' }]}>
          <Input placeholder="e.g. Information Technology, Financial Services" style={{ borderRadius: 6 }} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="experienceMin" label="Min Experience Required (Yrs)">
              <InputNumber min={0} max={40} style={{ width: '100%', borderRadius: 6 }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="experienceMax" label="Max Experience Required (Yrs)">
              <InputNumber min={0} max={40} style={{ width: '100%', borderRadius: 6 }} />
            </Form.Item>
          </Col>
        </Row>

        {/* Display Toggles */}
        <Divider orientation="left" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Display Toggles</Divider>
        <Row gutter={16} style={{ marginBottom: 12 }}>
          <Col span={8}>
            <Form.Item name="showSalaryRange" label="Show Salary Range?" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="showCompanyName" label="Show Company Name?" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="autoUnpublish" label="Auto Unpublish on Expiry?" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="showSalary" label="Show Salary details?" valuePropName="checked" style={{ display: 'none' }}>
          <Switch />
        </Form.Item>

        {/* Expiry */}
        <Form.Item name="expiryDate" label="Posting Expiration Date">
          <DatePicker style={{ width: '100%', borderRadius: 6 }} disabledDate={current => current && current < dayjs().startOf('day')} />
        </Form.Item>

        {/* Perks & Publishing Channels */}
        <Form.Item name="publishingChannels" label="Publishing Channels" rules={[{ required: true, message: 'Select at least one channel' }]}>
          <Select mode="tags" placeholder="Select or type channels" style={{ width: '100%' }}>
            {PUBLISHING_CHANNELS.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
        </Form.Item>

        <Form.Item name="perksAndBenefits" label="Perks & Benefits Offered">
          <Select mode="tags" placeholder="Select or type perks (e.g. Free Lunch, WFH)" style={{ width: '100%' }}>
            {PERKS_BENEFITS.map(p => <Option key={p} value={p}>{p}</Option>)}
          </Select>
        </Form.Item>

        {/* Public Description */}
        <Form.Item name="jobDescription" label="Job Description (JD Details)" rules={[{ required: true, message: 'Job description text is required' }]}>
          <Input.TextArea rows={6} placeholder="Provide details about role responsibilities, skill qualifications, etc." style={{ borderRadius: 6 }} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}

// ─── Requisitions Tab Component ──────────────────────────────────────────────
function RequisitionsTab() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isDarkMode } = useUIStore()
  const { can } = usePermission()
  const { hasRole } = useAuth()

  // Role-based view control
  const isMRFCreator = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.HR_ADMIN) || hasRole(ROLES.HR_MANAGER) || hasRole(ROLES.DEPARTMENT_MANAGER)
  const isRecruitmentOnly = hasRole(ROLES.RECRUITMENT_MANAGER) && !isMRFCreator
  
  const [mrfFilters, setMrfFilters] = useState({ deptId: undefined, designationId: undefined, status: isRecruitmentOnly ? 'Approved' : undefined })
  const [detailDrawer, setDetailDrawer] = useState({ open: false, record: null })
  const [approveModal, setApproveModal] = useState({ open: false, record: null, approved: true })
  
  const [approveForm] = Form.useForm()

  // Sourcing Posting Form Drawer State
  const [postingDrawer, setPostingDrawer] = useState({ open: false, reqRecord: null })

  // Queries
  const { data: requisitionsData, isLoading } = useQuery({
    queryKey: ['requisitions', mrfFilters],
    queryFn: () => recruitmentService.getRequisitions(mrfFilters)
  })

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: organizationService.getDepartments,
    select: (r) => r?.data || []
  })

  const { data: desigsData } = useQuery({
    queryKey: ['designations'],
    queryFn: organizationService.getDesignations,
    select: (r) => r?.data || []
  })

  const requisitions = requisitionsData?.data || []

  // Mutations
  const submitMutation = useMutation({
    mutationFn: recruitmentService.submitRequisition,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'MRF Submitted', description: 'Requisition sent for reviews.' })
        queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      } else {
        message.error(res.message || 'Failed to submit requisition.')
      }
    }
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, payload }) => recruitmentService.approveRequisition(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        const action = approveModal.approved ? 'Approved' : 'Rejected'
        notification.success({ message: `MRF ${action}`, description: `Requisition has been successfully processed.` })
        setApproveModal({ open: false, record: null, approved: true })
        approveForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      } else {
        message.error(res.message || 'Action failed.')
      }
    }
  })

  const returnMutation = useMutation({
    mutationFn: ({ id, payload }) => recruitmentService.returnRequisition(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'MRF Returned', description: 'Requisition returned to creator.' })
        setApproveModal({ open: false, record: null, approved: true })
        approveForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      } else {
        message.error(res.message || 'Action failed.')
      }
    }
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => recruitmentService.cancelRequisition(id),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'MRF Cancelled', description: 'Requisition cancelled successfully.' })
        queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      } else {
        message.error(res.message || 'Action failed.')
      }
    }
  })

  const handleApproveReject = (values) => {
    if (approveModal.action === 'Return') {
      returnMutation.mutate({
        id: approveModal.record.reqId,
        payload: { comment: values.comment }
      })
    } else {
      approveMutation.mutate({
        id: approveModal.record.reqId,
        payload: { approved: approveModal.approved, comment: values.comment }
      })
    }
  }

  // Status mapping to Tag colours
  const getStatusTag = (status) => {
    switch (status) {
      case 'Draft': return <Tag color="default">Draft</Tag>
      case 'PendingApproval': return <Tag color="processing">Pending Approval</Tag>
      case 'PendingHOD': return <Tag color="orange">Pending HOD</Tag>
      case 'PendingHR': return <Tag color="cyan">Pending HR</Tag>
      case 'PendingFinance': return <Tag color="gold">Pending Finance</Tag>
      case 'PendingCOO': return <Tag color="purple">Pending COO</Tag>
      case 'Approved': return <Tag color="success">Approved</Tag>
      case 'Rejected': return <Tag color="error">Rejected</Tag>
      case 'ReturnedForCorrection': return <Tag color="warning">Returned for Correction</Tag>
      case 'Cancelled': return <Tag color="red">Cancelled</Tag>
      case 'InternalReview': return <Tag color="magenta">Internal Review</Tag>
      case 'Open': return <Tag color="blue">Open</Tag>
      case 'Closed': return <Tag color="default">Closed</Tag>
      default: return <Tag>{status}</Tag>
    }
  }

  const columns = [
    {
      title: 'MRF Code',
      dataIndex: 'mrfNumber',
      key: 'mrfNumber',
      render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v || '-'}</span>
    },
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
    { title: 'Department', dataIndex: 'departmentName', key: 'dept' },
    { title: 'Designation', dataIndex: 'designationTitle', key: 'designation' },
    { title: 'Positions', dataIndex: 'noOfPositions', key: 'positions', align: 'center' },
    { 
      title: 'Target Date', 
      dataIndex: 'targetDate', 
      key: 'targetDate',
      render: (v) => formatDate(v)
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (v) => getStatusTag(v)
    },
    {
      title: 'Raised By',
      dataIndex: 'raisedByUserName',
      key: 'raisedBy'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space size="middle">
          {(r.status === 'Draft' || r.status === 'ReturnedForCorrection') && (
            <>
              {can(PERMISSIONS.RECRUITMENT.EDIT) && (
                <Tooltip title="Edit">
                  <Button size="small" type="text" icon={<EditOutlined />} onClick={() => {
                    navigate(`/recruitment/mrf/${r.reqId}/edit`)
                  }} />
                </Tooltip>
              )}
              {can(PERMISSIONS.RECRUITMENT.EDIT) && (
                <Tooltip title="Submit for Approval">
                  <Popconfirm title="Submit this requisition?" onConfirm={() => submitMutation.mutate(r.reqId)}>
                    <Button size="small" type="text" icon={<SendOutlined style={{ color: '#8B5CF6' }} />} />
                  </Popconfirm>
                </Tooltip>
              )}
              {can(PERMISSIONS.RECRUITMENT.EDIT) && (
                <Tooltip title="Cancel Requisition">
                  <Popconfirm title="Cancel this requisition?" onConfirm={() => cancelMutation.mutate(r.reqId)}>
                    <Button size="small" type="text" danger icon={<CloseOutlined />} />
                  </Popconfirm>
                </Tooltip>
              )}
            </>
          )}

          {['PendingHOD', 'PendingHR', 'PendingFinance', 'PendingCOO', 'PendingApproval'].includes(r.status) && can(PERMISSIONS.RECRUITMENT.APPROVE) && (
            <Space>
              <Tooltip title="Approve">
                <Button size="small" type="primary" shape="circle" icon={<CheckOutlined />} 
                  style={{ background: '#22C55E', borderColor: '#22C55E' }}
                  onClick={() => setApproveModal({ open: true, record: r, approved: true, action: 'Approve' })} />
              </Tooltip>
              <Tooltip title="Reject">
                <Button size="small" type="primary" danger shape="circle" icon={<CloseOutlined />} 
                  onClick={() => setApproveModal({ open: true, record: r, approved: false, action: 'Reject' })} />
              </Tooltip>
              <Tooltip title="Return for Correction">
                <Button size="small" shape="circle" icon={<CloseOutlined style={{ color: '#FAA71A', transform: 'rotate(180deg)' }} />} 
                  onClick={() => setApproveModal({ open: true, record: r, approved: false, action: 'Return' })} />
              </Tooltip>
            </Space>
          )}

          {r.status === 'Approved' && can(PERMISSIONS.RECRUITMENT.CREATE) && (
            <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => {
              setPostingDrawer({ open: true, reqRecord: r })
            }}>
              Post Job
            </Button>
          )}

          <Tooltip title="View Details">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setDetailDrawer({ open: true, record: r })} />
          </Tooltip>
        </Space>
      )
    }
  ]

  const stats = {
    total: requisitions.length,
    pending: requisitions.filter(r => ['PendingApproval', 'PendingHOD', 'PendingHR', 'PendingFinance', 'PendingCOO', 'InternalReview'].includes(r.status)).length,
    approved: requisitions.filter(r => r.status === 'Approved').length,
    drafts: requisitions.filter(r => r.status === 'Draft').length
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)' }}>
            <Statistic title="Total MRFs" value={stats.total} prefix={<FileTextOutlined style={{ color: '#3B82F6' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)' }}>
            <Statistic title="Pending Approvals" value={stats.pending} prefix={<FieldTimeOutlined style={{ color: '#FAA71A' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)' }}>
            <Statistic title="Approved MRFs" value={stats.approved} prefix={<CheckOutlined style={{ color: '#22C55E' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)' }}>
            <Statistic title="Draft MRFs" value={stats.drafts} prefix={<EditOutlined style={{ color: '#6B7280' }} />} />
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <Space>
          <Select 
            placeholder="Filter Department" 
            style={{ width: 180 }}
            allowClear
            onChange={(v) => setMrfFilters(prev => ({ ...prev, deptId: v }))}
            options={(deptsData || []).map(d => ({ value: d.deptId, label: d.deptName }))}
          />
          <Select 
            placeholder="Filter Designation" 
            style={{ width: 180 }}
            allowClear
            onChange={(v) => setMrfFilters(prev => ({ ...prev, designationId: v }))}
            options={(desigsData || []).map(d => ({ value: d.designationId, label: d.title }))}
          />
          <Select 
            placeholder="Filter Status" 
            style={{ width: 160 }}
            allowClear
            onChange={(v) => setMrfFilters(prev => ({ ...prev, status: v }))}
            options={[
              { value: 'Draft', label: 'Draft' },
              { value: 'PendingApproval', label: 'Pending Approval' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Rejected', label: 'Rejected' }
            ]}
          />
        </Space>

        {isMRFCreator && can(PERMISSIONS.RECRUITMENT.CREATE) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => {
              navigate('/recruitment/mrf/create')
            }}
            style={{ background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', borderRadius: 8, fontWeight: 600 }}
          >
            Raise Requisition (MRF)
          </Button>
        )}
        {isRecruitmentOnly && (
          <Tag color="blue" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
            <TeamOutlined /> You can see Approved MRFs and post jobs
          </Tag>
        )}
      </div>

      <div style={{ background: 'var(--color-card-bg)', borderRadius: 12, border: 'var(--border-glass)', overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={requisitions}
          rowKey="reqId"
          loading={isLoading}
          locale={{ emptyText: <EmptyState title="No requisitions found" /> }}
        />
      </div>

      {/* Approval Remarks Modal */}
      <Modal
        title={<span style={{ fontWeight: 700 }}>{approveModal.approved ? 'Approve Requisition' : 'Reject Requisition'}</span>}
        open={approveModal.open}
        onCancel={() => setApproveModal({ open: false, record: null, approved: true })}
        onOk={() => approveForm.validateFields().then(handleApproveReject)}
        confirmLoading={approveMutation.isPending}
        okButtonProps={{ style: { background: approveModal.approved ? '#22C55E' : '#E94043', border: 'none' } }}
      >
        <Form form={approveForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="comment" label="Comments / Remarks" rules={[{ required: !approveModal.approved, message: 'Rejection comments are mandatory' }]}>
            <Input.TextArea rows={3} placeholder={approveModal.approved ? 'Add optional approval remarks...' : 'Specify reasons for rejection...'} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Drawer with Workforce availability */}
      <Drawer
        title={<span style={{ fontWeight: 700 }}>Requisition Details</span>}
        placement="right"
        width={600}
        onClose={() => setDetailDrawer({ open: false, record: null })}
        open={detailDrawer.open}
      >
        {detailDrawer.record && (
          <div>
            <Descriptions title="Overview" bordered column={1} size="small">
              <Descriptions.Item label="Job Title">{detailDrawer.record.jobTitle}</Descriptions.Item>
              <Descriptions.Item label="Positions">{detailDrawer.record.noOfPositions}</Descriptions.Item>
              <Descriptions.Item label="Department">{detailDrawer.record.departmentName}</Descriptions.Item>
              <Descriptions.Item label="Designation">{detailDrawer.record.designationTitle}</Descriptions.Item>
              <Descriptions.Item label="Experience Range">
                {detailDrawer.record.minExperience ?? 0} - {detailDrawer.record.maxExperience ?? 'Any'} Years
              </Descriptions.Item>
              <Descriptions.Item label="Salary Budget Range">
                {detailDrawer.record.minSalary ? `₹ ${detailDrawer.record.minSalary.toLocaleString()}` : '-'} to {detailDrawer.record.maxSalary ? `₹ ${detailDrawer.record.maxSalary.toLocaleString()}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Target Joining Date">{formatDate(detailDrawer.record.targetDate)}</Descriptions.Item>
              <Descriptions.Item label="Skills Required">{detailDrawer.record.skillsRequired || 'None specified'}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(detailDrawer.record.status)}</Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Job Description</h4>
            <div style={{ background: 'var(--color-bg-elevated)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
              {detailDrawer.record.jobDescription || 'No job description provided.'}
            </div>

            <Divider />
            
            <Descriptions title="Metadata" column={1} size="small">
              <Descriptions.Item label="Raised By">{detailDrawer.record.raisedByUserName}</Descriptions.Item>
              <Descriptions.Item label="Approved By">{detailDrawer.record.approvedByUserName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Raised Date">{formatDate(detailDrawer.record.requisitionDate)}</Descriptions.Item>
            </Descriptions>

            <Divider />
            <InternalWorkforcePanel reqId={detailDrawer.record.reqId} />
          </div>
        )}
      </Drawer>

      {/* Unified Job Posting Form Drawer (Creation Mode) */}
      <JobPostingFormDrawer
        open={postingDrawer.open}
        reqRecord={postingDrawer.reqRecord}
        onClose={() => setPostingDrawer({ open: false, reqRecord: null })}
        onSuccess={() => {
          setPostingDrawer({ open: false, reqRecord: null })
          queryClient.invalidateQueries({ queryKey: ['postings'] })
          queryClient.invalidateQueries({ queryKey: ['requisitions'] })
        }}
      />
    </div>
  )
}

// ─── Internal Workforce Check Subcomponent ───────────────────────────────────
function InternalWorkforcePanel({ reqId }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['internalCheck', reqId],
    queryFn: () => recruitmentService.getInternalCheck(reqId),
    enabled: !!reqId,
    select: (r) => r?.data || null
  })
  const { hasRole } = useAuth()
  const isHrAdmin = hasRole(ROLES.HR_ADMIN) || hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.HR_MANAGER)

  const [modalOpen, setModalOpen] = useState(false)
  const [actionType, setActionType] = useState('') // Assign, Continue, Cancel
  const [form] = Form.useForm()
  const [selectedReason, setSelectedReason] = useState('')

  const actionMutation = useMutation({
    mutationFn: (payload) => recruitmentService.processInternalAction(reqId, payload),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Action Processed', description: 'Requisition state has been updated successfully.' })
        setModalOpen(false)
        form.resetFields()
        queryClient.invalidateQueries({ queryKey: ['requisitions'] })
      } else {
        message.error(res.message || 'Workflow action failed.')
      }
    }
  })

  if (isLoading) return <div style={{ textAlign: 'center', padding: 16 }}>Checking internal workforce...</div>
  if (!data) return null

  const handleTriggerAction = (type) => {
    setActionType(type)
    setModalOpen(true)
    form.resetFields()
    setSelectedReason('')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <TeamOutlined style={{ color: '#8B5CF6', fontSize: 18 }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Internal Workforce Check</span>
        <Badge count={data.totalMatches} style={{ backgroundColor: data.totalMatches > 0 ? '#8B5CF6' : '#ccc' }} />
      </div>

      {data.totalMatches === 0 ? (
        <Alert
          type="info"
          showIcon
          message="No internal candidates found"
          description={`No active employees match the designation or department for "${data.requisitionTitle}".`}
          style={{ borderRadius: 8 }}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          icon={<UserSwitchOutlined />}
          message={`${data.totalMatches} Internal Candidate(s) Available`}
          description="Consider internal transfer, promotion, or redeployment before external hiring."
          style={{ borderRadius: 8, marginBottom: 12 }}
        />
      )}

      {data.candidates?.length > 0 && (
        <List
          size="small"
          dataSource={data.candidates}
          renderItem={(candidate) => (
            <List.Item key={candidate.employeeId} style={{ padding: '8px 0' }}>
              <List.Item.Meta
                avatar={<Avatar style={{ background: candidate.isExactMatch ? '#8B5CF6' : '#3B82F6' }}>{candidate.fullName?.[0]}</Avatar>}
                title={
                  <span>
                    {candidate.fullName} 
                    <Tag style={{ marginLeft: 8 }} color={candidate.isExactMatch ? 'purple' : 'blue'}>
                      {candidate.isExactMatch ? 'Exact Match' : 'Partial Match'}
                    </Tag>
                  </span>
                }
                description={`${candidate.designationName} · ${candidate.departmentName} · ${candidate.gradeName || 'No Grade'}`}
              />
              <Tag color="green" style={{ fontSize: 11 }}>{candidate.employeeCode}</Tag>
            </List.Item>
          )}
        />
      )}

      {isHrAdmin && (
        <div style={{ marginTop: 16 }}>
          <h5 style={{ fontWeight: 600, marginBottom: 12 }}>HR / HOD Actions</h5>
          <Space wrap>
            <Button size="small" onClick={() => handleTriggerAction('Assign')} type="dashed">Assign Internally</Button>
            <Button size="small" onClick={() => handleTriggerAction('Continue')} type="primary" style={{ background: '#8B5CF6', borderColor: '#8B5CF6' }}>Continue External Sourcing</Button>
            <Button size="small" onClick={() => handleTriggerAction('Cancel')} danger>Cancel Requisition</Button>
          </Space>
        </div>
      )}

      <Modal
        title={`${actionType} Workflow — ${data.requisitionTitle}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.validateFields().then(values => {
          actionMutation.mutate({
            action: actionType,
            employeeId: values.employeeId,
            justification: values.justification === 'Other' ? values.otherJustification : values.justification,
            remarks: values.remarks
          })
        })}
        confirmLoading={actionMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {actionType === 'Assign' && (
            <Form.Item name="employeeId" label="Select Internal Candidate to Assign" rules={[{ required: true, message: 'Candidate selection is mandatory' }]}>
              <Select placeholder="Select match">
                {data.candidates?.map(c => (
                  <Select.Option key={c.employeeId} value={c.employeeId}>
                    {c.fullName} ({c.employeeCode}) - {c.designationName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {actionType === 'Continue' && (
            <>
              <Form.Item name="justification" label="Business Justification Reason" rules={[{ required: true, message: 'Justification is mandatory' }]}>
                <Select placeholder="Select reason" onChange={(v) => setSelectedReason(v)}>
                  <Select.Option value="Business Expansion">Business Expansion</Select.Option>
                  <Select.Option value="Additional Headcount">Additional Headcount</Select.Option>
                  <Select.Option value="Internal Candidate Declined">Internal Candidate Declined</Select.Option>
                  <Select.Option value="Internal Candidate Not Available">Internal Candidate Not Available</Select.Option>
                  <Select.Option value="Skill Gap">Skill Gap</Select.Option>
                  <Select.Option value="Confidential Hiring">Confidential Hiring</Select.Option>
                  <Select.Option value="Succession Planning">Succession Planning</Select.Option>
                  <Select.Option value="Other">Other (Require remarks)</Select.Option>
                </Select>
              </Form.Item>
              
              {selectedReason === 'Other' && (
                <Form.Item name="otherJustification" label="Specify Justification Details" rules={[{ required: true, message: 'Details are mandatory for Other' }]}>
                  <Input.TextArea rows={2} placeholder="Explain justification details..." style={{ borderRadius: 8 }} />
                </Form.Item>
              )}
            </>
          )}

          <Form.Item name="remarks" label="Remarks / Comments" rules={[{ required: actionType === 'Cancel', message: 'Remarks are mandatory' }]}>
            <Input.TextArea rows={2} placeholder="Add comments..." style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

// ─── Postings Tab Component ──────────────────────────────────────────────────
function PostingsTab() {
  const queryClient = useQueryClient()
  const { isDarkMode } = useUIStore()
  const { can } = usePermission()

  const [postingFilters, setPostingFilters] = useState({ status: undefined })
  const [detailDrawer, setDetailDrawer] = useState({ open: false, record: null })

  // Posting form drawer (Edit Mode)
  const [postingDrawer, setPostingDrawer] = useState({ open: false, record: null })

  // Queries
  const { data: postingsData, isLoading } = useQuery({
    queryKey: ['postings', postingFilters],
    queryFn: () => recruitmentService.getAdminPostings(postingFilters)
  })

  const postings = postingsData?.data || []

  // Mutations
  const publishMutation = useMutation({
    mutationFn: recruitmentService.publishPosting,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Job Published', description: 'Job posting is now active and live.' })
        queryClient.invalidateQueries({ queryKey: ['postings'] })
      } else {
        message.error(res.message || 'Publishing failed.')
      }
    }
  })

  const unpublishMutation = useMutation({
    mutationFn: recruitmentService.unpublishPosting,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Job Unpublished', description: 'Job posting is now unpublished back to draft.' })
        queryClient.invalidateQueries({ queryKey: ['postings'] })
      } else {
        message.error(res.message || 'Unpublishing failed.')
      }
    }
  })

  const closeMutation = useMutation({
    mutationFn: recruitmentService.closePosting,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Job Closed', description: 'Job posting is now closed.' })
        queryClient.invalidateQueries({ queryKey: ['postings'] })
      } else {
        message.error(res.message || 'Closing failed.')
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: recruitmentService.deletePosting,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Job Posting Deleted', description: 'Job posting record removed successfully.' })
        queryClient.invalidateQueries({ queryKey: ['postings'] })
      } else {
        message.error(res.message || 'Deletion failed.')
      }
    }
  })

  const getStatusTag = (status) => {
    switch (status) {
      case 'Draft': return <Tag color="default">Draft</Tag>
      case 'Active': return <Tag color="success">Active</Tag>
      case 'Closed': return <Tag color="error">Closed</Tag>
      case 'Expired': return <Tag color="warning">Expired</Tag>
      default: return <Tag>{status}</Tag>
    }
  }

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
      title: 'Publish Channels', 
      dataIndex: 'publishingChannels', 
      key: 'channels',
      render: (v) => {
        if (!v || !v.length) return '-'
        return v.map(c => <Tag color="blue" style={{ borderRadius: 4 }} key={c}>{c}</Tag>)
      }
    },
    { 
      title: 'Posted At', 
      dataIndex: 'postedAt', 
      key: 'postedAt',
      render: (v) => dayjs(v).format('DD MMM YYYY HH:mm')
    },
    { 
      title: 'Expiry Date', 
      dataIndex: 'expiryDate', 
      key: 'expiryDate',
      render: (v) => formatDate(v)
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
            <Tooltip title="Publish Live">
              <Popconfirm title="Publish this job posting?" onConfirm={() => publishMutation.mutate(r.jobId)}>
                <Button size="small" type="primary" ghost icon={<SendOutlined />}>Publish</Button>
              </Popconfirm>
            </Tooltip>
          )}

          {r.status === 'Active' && can(PERMISSIONS.RECRUITMENT.EDIT) && (
            <Tooltip title="Unpublish to Draft">
              <Popconfirm title="Unpublish this job posting back to draft?" onConfirm={() => unpublishMutation.mutate(r.jobId)}>
                <Button size="small" type="dashed" icon={<CloseOutlined style={{ color: '#FAA71A' }} />}>Unpublish</Button>
              </Popconfirm>
            </Tooltip>
          )}

          {r.status === 'Active' && can(PERMISSIONS.RECRUITMENT.EDIT) && (
            <Tooltip title="Close Posting">
              <Popconfirm title="Close this job posting?" onConfirm={() => closeMutation.mutate(r.jobId)}>
                <Button size="small" danger ghost icon={<StopOutlined />}>Close</Button>
              </Popconfirm>
            </Tooltip>
          )}

          {can(PERMISSIONS.RECRUITMENT.EDIT) && (
            <Tooltip title="Edit Posting details">
              <Button size="small" type="text" icon={<EditOutlined style={{ color: '#FAA71A' }} />} onClick={() => setPostingDrawer({ open: true, record: r })} />
            </Tooltip>
          )}

          {can(PERMISSIONS.RECRUITMENT.EDIT) && (
            <Tooltip title="Delete Posting">
              <Popconfirm title="Delete this job posting permanently?" onConfirm={() => deleteMutation.mutate(r.jobId)} okButtonProps={{ danger: true }}>
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}

          <Tooltip title="View JD">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setDetailDrawer({ open: true, record: r })} />
          </Tooltip>
        </Space>
      )
    }
  ]

  const stats = {
    total: postings.length,
    active: postings.filter(p => p.status === 'Active').length,
    drafts: postings.filter(p => p.status === 'Draft').length,
    closed: postings.filter(p => p.status === 'Closed').length
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)' }}>
            <Statistic title="Total Postings" value={stats.total} prefix={<GlobalOutlined style={{ color: '#3B82F6' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)' }}>
            <Statistic title="Active Openings" value={stats.active} prefix={<SendOutlined style={{ color: '#22C55E' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)' }}>
            <Statistic title="Draft Postings" value={stats.drafts} prefix={<EditOutlined style={{ color: '#6B7280' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)' }}>
            <Statistic title="Closed Listings" value={stats.closed} prefix={<StopOutlined style={{ color: '#EF4444' }} />} />
          </Card>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
        <Select 
          placeholder="Filter Status" 
          style={{ width: 180 }}
          allowClear
          onChange={(v) => setPostingFilters({ status: v })}
          options={[
            { value: 'Draft', label: 'Draft' },
            { value: 'Active', label: 'Active' },
            { value: 'Closed', label: 'Closed' },
            { value: 'Expired', label: 'Expired' }
          ]}
        />
      </div>

      <div style={{ background: 'var(--color-card-bg)', borderRadius: 12, border: 'var(--border-glass)', overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={postings}
          rowKey="jobId"
          loading={isLoading}
          locale={{ emptyText: <EmptyState title="No postings found" /> }}
        />
      </div>

      {/* Details Drawer */}
      <Drawer
        title={<span style={{ fontWeight: 700 }}>Job Posting Details</span>}
        placement="right"
        width={500}
        onClose={() => setDetailDrawer({ open: false, record: null })}
        open={detailDrawer.open}
      >
        {detailDrawer.record && (
          <div>
            {/* Perks Tag chips */}
            {detailDrawer.record.perksAndBenefitsList?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <Text type="secondary" style={{ display: 'block', fontSize: 11, marginBottom: 6 }}>PERKS & BENEFITS</Text>
                {detailDrawer.record.perksAndBenefitsList.map(p => (
                  <Tag color="green" key={p} style={{ borderRadius: 6, fontSize: 11, padding: '3px 8px' }}>
                    <GiftOutlined style={{ marginRight: 4 }} /> {p}
                  </Tag>
                ))}
              </div>
            )}

            <Descriptions bordered column={1}>
              <Descriptions.Item label="Public Advertised Job Title">{detailDrawer.record.jobTitle}</Descriptions.Item>
              <Descriptions.Item label="Internal MRF Job Title">{detailDrawer.record.internalJobTitle || '-'}</Descriptions.Item>
              <Descriptions.Item label="Job Category">{detailDrawer.record.jobCategory || '-'}</Descriptions.Item>
              <Descriptions.Item label="Employment Type">{detailDrawer.record.employmentType || '-'}</Descriptions.Item>
              <Descriptions.Item label="Industry Sector">{detailDrawer.record.industry || '-'}</Descriptions.Item>
              <Descriptions.Item label="Department">{detailDrawer.record.departmentName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Designation">{detailDrawer.record.designationName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Experience Range">
                {detailDrawer.record.experienceMin ?? 0} - {detailDrawer.record.experienceMax ?? 'Any'} Years
              </Descriptions.Item>
              <Descriptions.Item label="Show Salary Details">{detailDrawer.record.showSalaryRange ? 'Yes (Range)' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Show Company Name">{detailDrawer.record.showCompanyName ? 'Yes' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Status">{getStatusTag(detailDrawer.record.status)}</Descriptions.Item>
              <Descriptions.Item label="Channels">
                {detailDrawer.record.publishingChannels ? detailDrawer.record.publishingChannels.join(', ') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Posted At">{dayjs(detailDrawer.record.postedAt).format('DD MMM YYYY HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="Expiry Date">{formatDate(detailDrawer.record.expiryDate)}</Descriptions.Item>
            </Descriptions>

            <Divider />
            
            <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Job Description (Public advertisement text)</h4>
            <div style={{ background: 'var(--color-bg-elevated)', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
              {detailDrawer.record.jobDescription || 'No job description provided.'}
            </div>
          </div>
        )}
      </Drawer>

      {/* Unified Job Posting Form Drawer (Edit Mode) */}
      <JobPostingFormDrawer
        open={postingDrawer.open}
        record={postingDrawer.record}
        onClose={() => setPostingDrawer({ open: false, record: null })}
        onSuccess={() => {
          setPostingDrawer({ open: false, record: null })
          queryClient.invalidateQueries({ queryKey: ['postings'] })
        }}
      />
    </div>
  )
}

// ─── Main Recruitment Hub View ───────────────────────────────────────────────
export default function RecruitmentPage() {
  const { hasRole } = useAuth()
  const isHR = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.HR_ADMIN) || hasRole(ROLES.HR_MANAGER) || hasRole(ROLES.RECRUITMENT_MANAGER)

  const tabs = [
    { key: 'requisitions', label: 'Manpower Requisitions (MRF)', children: <RequisitionsTab /> }
  ]

  if (isHR) {
    tabs.push({ key: 'postings', label: 'Job Openings & Board', children: <PostingsTab /> })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Recruitment & Job Openings"
        subtitle="Manage end-to-end manpower requisitions and job postings"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment & Onboarding' }]}
      />
      <Tabs 
        items={tabs} 
        style={{ 
          background: 'var(--color-card-bg)', 
          backdropFilter: 'blur(16px)', 
          WebkitBackdropFilter: 'blur(16px)', 
          borderRadius: 16, 
          padding: '20px 20px 0', 
          border: 'var(--border-glass)', 
          boxShadow: 'var(--shadow-subtle)' 
        }} 
      />
    </motion.div>
  )
}
