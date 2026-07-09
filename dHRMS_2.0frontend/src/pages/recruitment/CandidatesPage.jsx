import React, { useEffect, useState, useCallback } from 'react'
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form, message,
  Badge, Row, Col, Drawer, Divider, Typography, List, Empty, Tooltip,
  DatePicker, InputNumber, Avatar, Upload, Descriptions, Popconfirm, Steps, Timeline
} from 'antd'
import {
  SearchOutlined, UserAddOutlined, FilePdfOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined,
  UploadOutlined, InboxOutlined, LinkOutlined, UserOutlined, CalendarOutlined,
  DollarOutlined, HomeOutlined, SafetyCertificateOutlined, InboxOutlined as ZipOutlined,
  GlobalOutlined, BookOutlined, FileTextOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import { recruitmentService } from '../../services/recruitmentService'
import { employeeService } from '../../services/employeeService'
import { PERMISSIONS, ROLES } from '../../constants/permissions'
import PermissionGate from '../../components/common/PermissionGate'
import useUIStore from '../../store/uiStore'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'

const { Option } = Select
const { Text, Title, Paragraph } = Typography
const { Dragger } = Upload

const CANDIDATE_STATUS_COLORS = {
  Active: 'blue',
  InProcess: 'orange',
  Hired: 'green',
  Rejected: 'red',
  Withdrawn: 'default',
  Blacklisted: 'volcano',
  Archived: 'purple'
}

const SOURCES = [
  'CareerPortal', 'EmployeeReferral', 'LinkedIn', 'Naukri',
  'Indeed', 'Campus', 'Consultancy', 'WalkIn', 'InternalTransfer', 'Other'
]

const STATUSES = [
  'Active', 'InProcess', 'Hired', 'Rejected', 'Withdrawn', 'Blacklisted', 'Archived'
]

export default function CandidatesPage() {
  const { isDarkMode } = useUIStore()
  const { hasRole } = useAuth()
  const { can } = usePermission()

  // RBAC check: visible only to HR, Recruiter, Admin. Hidden for Employee / Hiring Manager
  const isAuthorizedToCreate = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.HR_ADMIN) || hasRole(ROLES.HR_MANAGER) || hasRole(ROLES.RECRUITMENT_MANAGER)

  const [candidates, setCandidates] = useState([])
  const [employees, setEmployees] = useState([])
  const [publishedJobs, setPublishedJobs] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Filters state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [sourceFilter, setSourceFilter] = useState(undefined)
  const [sortBy, setSortBy] = useState(undefined)
  const [sortOrder, setSortOrder] = useState(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Candidate multi-step drawer (Create/Edit)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState([])
  const [saving, setSaving] = useState(false)

  // Details drawer
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Bulk Import modal
  const [importOpen, setImportOpen] = useState(false)
  const [importFileList, setImportFileList] = useState([])
  const [importing, setImporting] = useState(false)

  // Apply to Job Modal
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyCandidate, setApplyCandidate] = useState(null)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [applying, setApplying] = useState(false)

  // Load candidates list
  const loadCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        search: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        sortBy,
        sortOrder,
        page,
        pageSize
      }
      const res = await recruitmentService.getCandidates(params)
      if (res.success) {
        setCandidates(res.data || [])
        setTotalCount(res.totalCount || res.data?.length || 0)
      }
    } catch (err) {
      message.error('Failed to load candidate records.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sourceFilter, sortBy, sortOrder, page, pageSize])

  // Load active employee profiles & published jobs
  const loadLookups = async () => {
    try {
      const empRes = await employeeService.getEmployees({ pageSize: 1000, activeStatus: 'active' })
      if (empRes.success) setEmployees(empRes.data || [])

      const jobRes = await recruitmentService.getAdminPostings({ status: 'Active' })
      if (jobRes.success) setPublishedJobs(jobRes.data || [])
    } catch (err) {
      console.error('Failed to load metadata lookups.')
    }
  }

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  useEffect(() => {
    loadLookups()
  }, [])

  // Clear filters
  const clearFilters = () => {
    setSearch('')
    setStatusFilter(undefined)
    setSourceFilter(undefined)
    setSortBy(undefined)
    setSortOrder(undefined)
    setPage(1)
  }

  // Export CSV
  const handleExportCSV = () => {
    if (!candidates.length) {
      message.warning('No candidate records available to export.')
      return
    }

    const headers = [
      'Candidate Name', 'Email', 'Mobile', 'Gender', 'DOB', 'LinkedIn', 'Portfolio',
      'Current Company', 'Current Designation', 'Experience (Yrs)', 'Relevant Exp (Yrs)',
      'Highest Qualification', 'Current Location', 'Preferred Location', 'Willing to Relocate',
      'Current CTC', 'Expected CTC', 'Notice Period (Days)', 'Skills', 'Languages', 'Source', 'Status', 'Tags', 'Last Applied'
    ]

    const rows = candidates.map(c => [
      `"${c.firstName} ${c.lastName || ''}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.gender || ''}"`,
      `"${c.dateOfBirth || ''}"`,
      `"${c.linkedIn || ''}"`,
      `"${c.portfolio || ''}"`,
      `"${c.currentCompany || ''}"`,
      `"${c.currentDesignation || ''}"`,
      c.totalExperience ?? 0,
      c.relevantExperience ?? 0,
      `"${c.highestQualification || ''}"`,
      `"${c.currentLocation || ''}"`,
      `"${c.preferredLocation || ''}"`,
      `"${c.willingToRelocate || ''}"`,
      c.currentCTC ?? 0,
      c.expectedCTC ?? 0,
      c.noticePeriodDays ?? 0,
      `"${c.skills || ''}"`,
      `"${c.languages || ''}"`,
      `"${c.source || ''}"`,
      `"${c.candidateStatus || ''}"`,
      `"${c.candidateTags || ''}"`,
      c.lastApplicationDate || ''
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `candidates_export_${dayjs().format('YYYYMMDD_HHmmss')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('Candidate database CSV exported successfully.')
  }

  // Multi-step form save
  const handleSaveCandidate = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const tagsString = values.tags ? values.tags.join(',') : ''
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone,
        gender: values.gender || null,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
        linkedIn: values.linkedIn || null,
        portfolio: values.portfolio || null,
        currentCompany: values.currentCompany || null,
        currentDesignation: values.currentDesignation || null,
        totalExperience: values.totalExperience || 0,
        relevantExperience: values.relevantExperience || 0,
        highestQualification: values.highestQualification || null,
        currentLocation: values.currentLocation || null,
        preferredLocation: values.preferredLocation || null,
        willingToRelocate: values.willingToRelocate || 'No',
        currentCTC: values.currentCTC || 0,
        expectedCTC: values.expectedCTC || 0,
        noticePeriodDays: values.noticePeriodDays || 0,
        skills: values.skills || null,
        languages: values.languages || null,
        source: values.source || null,
        referralEmployeeId: values.referralEmployeeId || null,
        candidateTags: tagsString,
        candidateStatus: editingCandidate ? values.candidateStatus : 'Active'
      }

      let res
      if (editingCandidate) {
        res = await recruitmentService.updateCandidate(editingCandidate.candidateId, payload)
      } else {
        res = await recruitmentService.createCandidate(payload)
      }

      if (res.success) {
        const savedCand = res.data
        if (fileList.length > 0 && fileList[0].originFileObj) {
          const uploadRes = await recruitmentService.uploadResume(savedCand.candidateId, fileList[0].originFileObj)
          if (!uploadRes.success) {
            message.warning('Candidate profile saved, but resume upload failed.')
          }
        }
        message.success(editingCandidate ? 'Candidate profile updated successfully.' : 'Candidate registered successfully.')
        setFormOpen(false)
        setEditingCandidate(null)
        form.resetFields()
        setFileList([])
        setCurrentStep(0)
        loadCandidates()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save candidate record. Verify constraints.')
    } finally {
      setSaving(false)
    }
  }

  // Delete candidate
  const handleDeleteCandidate = async (id) => {
    try {
      const res = await recruitmentService.deleteCandidate(id)
      if (res.success) {
        message.success('Candidate record deleted successfully.')
        loadCandidates()
      }
    } catch (err) {
      message.error('Failed to delete candidate record.')
    }
  }

  // File preview helper
  const getFileUrl = (path) => {
    if (!path) return '#'
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `/uploads/${path}`
  }

  // Open multi-step form drawer
  const openForm = (candidate = null) => {
    setEditingCandidate(candidate)
    setFormOpen(true)
    setFileList([])
    setCurrentStep(0)
    if (candidate) {
      const tagsArray = candidate.candidateTags ? candidate.candidateTags.split(',').filter(Boolean) : []
      form.setFieldsValue({
        ...candidate,
        dateOfBirth: candidate.dateOfBirth ? dayjs(candidate.dateOfBirth) : null,
        tags: tagsArray
      })
      if (candidate.resumeFilePath) {
        setFileList([{
          uid: '-1',
          name: candidate.resumeFilePath.split('/').pop(),
          status: 'done',
          url: getFileUrl(candidate.resumeFilePath)
        }])
      }
    } else {
      form.resetFields()
    }
  }

  // Open Details Drawer
  const openDetails = async (candidate) => {
    setDetailsOpen(true)
    setDetailsLoading(true)
    setSelectedCandidate(candidate)
    try {
      const res = await recruitmentService.getCandidate(candidate.candidateId)
      if (res.success) {
        setSelectedCandidate(res.data)
      }
    } catch {
      message.error('Failed to load candidate profile details.')
    } finally {
      setDetailsLoading(false)
    }
  }

  // Replace resume inline inside details drawer
  const handleReplaceResume = async (file) => {
    try {
      const res = await recruitmentService.uploadResume(selectedCandidate.candidateId, file)
      if (res.success) {
        message.success('Candidate resume updated successfully.')
        openDetails(selectedCandidate) // reload details
        loadCandidates() // reload table
      }
    } catch (err) {
      message.error('Resume replacement upload failed.')
    }
    return false // prevent default upload action
  }

  // Move candidate to ATS Job Application
  const handleApplyToJob = async () => {
    if (!selectedJobId) {
      message.warning('Please select a job opening.')
      return
    }
    setApplying(true)
    try {
      const res = await recruitmentService.createApplication({
        reqId: selectedJobId,
        candidateId: applyCandidate.candidateId
      })
      if (res.success) {
        message.success('Candidate successfully mapped to Job Opening! Current Stage: Applied.')
        setApplyOpen(false)
        setSelectedJobId(null)
        setApplyCandidate(null)
        loadCandidates()
        if (detailsOpen && selectedCandidate?.candidateId === applyCandidate.candidateId) {
          openDetails(applyCandidate) // reload details drawer applications list
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to apply candidate to job.')
    } finally {
      setApplying(false)
    }
  }

  // Bulk Import handler
  const handleBulkImport = async () => {
    if (importFileList.length === 0) {
      message.warning('Select a CSV, Excel, or ZIP file to import.')
      return
    }
    setImporting(true)
    try {
      const res = await recruitmentService.importCandidates(importFileList[0])
      if (res.success) {
        message.success(res.data || 'Import processed successfully.')
        setImportOpen(false)
        setImportFileList([])
        loadCandidates()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Bulk import processing failed.')
    } finally {
      setImporting(false)
    }
  }

  // Table columns definition
  const columns = [
    {
      title: 'Candidate',
      key: 'name',
      sorter: true,
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#11133F' : '#fff', fontWeight: 700 }}>
            {r.firstName?.[0]}{r.lastName?.[0] || ''}
          </Avatar>
          <div>
            <span 
              style={{ fontWeight: 600, color: 'var(--color-primary-light)', cursor: 'pointer' }}
              onClick={() => openDetails(r)}
            >
              {r.firstName} {r.lastName || ''}
            </span>
            {r.currentDesignation && <div style={{ fontSize: 11, opacity: 0.45 }}>{r.currentDesignation}</div>}
          </div>
        </Space>
      )
    },
    { title: 'Current Company', dataIndex: 'currentCompany', key: 'company', sorter: true },
    { title: 'Designation', dataIndex: 'currentDesignation', key: 'designation' },
    { 
      title: 'Experience', 
      dataIndex: 'totalExperience', 
      key: 'experience',
      render: (v) => v != null ? `${v} yrs` : '-'
    },
    { 
      title: 'Current CTC', 
      dataIndex: 'currentCTC', 
      key: 'currentctc',
      render: (v) => v != null ? `₹ ${v.toLocaleString()}` : '-'
    },
    { 
      title: 'Expected CTC', 
      dataIndex: 'expectedCTC', 
      key: 'expectedctc',
      render: (v) => v != null ? `₹ ${v.toLocaleString()}` : '-'
    },
    { title: 'Source', dataIndex: 'source', key: 'source', render: (v) => v ? <Tag color="blue">{v}</Tag> : '-' },
    { title: 'Status', dataIndex: 'candidateStatus', key: 'status', render: (v) => <Tag color={CANDIDATE_STATUS_COLORS[v] || 'blue'}>{v || 'Active'}</Tag> },
    { 
      title: 'Last Applied', 
      dataIndex: 'lastApplicationDate', 
      key: 'lastapplied',
      render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '-'
    },
    {
      title: 'Resume',
      key: 'resume',
      render: (_, r) => r.resumeFilePath ? (
        <Tooltip title="Download Resume">
          <Button type="text" size="small" icon={<DownloadOutlined />} href={getFileUrl(r.resumeFilePath)} target="_blank" style={{ color: '#22C55E' }} />
        </Tooltip>
      ) : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={() => { setApplyCandidate(r); setApplyOpen(true) }}
            style={{ borderRadius: 6, fontSize: 11.5 }}
          >
            Apply to Job
          </Button>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined style={{ color: '#FAA71A' }} />} onClick={() => openForm(r)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm title="Delete this candidate permanently?" onConfirm={() => handleDeleteCandidate(r.candidateId)} okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  // Form Steps items
  const stepsItems = [
    { title: 'Personal' },
    { title: 'Professional' },
    { title: 'Recruitment' },
    { title: 'Resume' }
  ]

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Candidate Database"
        subtitle="Manage profiles, upload CVs, link candidates to jobs, and verify bulk resumes."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment', path: '/recruitment' }, { label: 'Candidates' }]}
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>Export CSV</Button>
            <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>Bulk Import</Button>
            {isAuthorizedToCreate && (
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => openForm(null)}
                style={{
                  background: isDarkMode ? '#FAA71A' : '#11133F',
                  borderColor: isDarkMode ? '#FAA71A' : '#11133F',
                  color: isDarkMode ? '#11133F' : '#fff',
                  borderRadius: 8,
                  fontWeight: 600
                }}
              >
                Add Candidate
              </Button>
            )}
          </Space>
        }
      />

      {/* Main Candidates Card */}
      <Card
        style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 16 }}
        bodyStyle={{ padding: 20 }}
      >
        {/* Sourcing Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }} align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Space wrap size="middle">
              <Input
                placeholder="Search by name, email, phone, company..."
                prefix={<SearchOutlined style={{ opacity: 0.3 }} />}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                style={{ width: 280, borderRadius: 8 }}
              />
              <Select
                placeholder="Source"
                allowClear
                value={sourceFilter}
                onChange={(v) => { setSourceFilter(v); setPage(1) }}
                style={{ width: 150 }}
              >
                {SOURCES.map(s => <Option key={s} value={s}>{s}</Option>)}
              </Select>
              <Select
                placeholder="Status"
                allowClear
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1) }}
                style={{ width: 150 }}
              >
                {STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
              </Select>
              <Button onClick={clearFilters} type="text" danger style={{ fontWeight: 500 }}>
                Clear Filters
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <Badge count={totalCount} overflowCount={9999} style={{ backgroundColor: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#111' : '#fff' }} />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={candidates}
          rowKey="candidateId"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: true
          }}
          className="hrms-table"
        />
      </Card>

      {/* Multi-Step Candidate Registration Drawer */}
      <Drawer
        title={<span style={{ fontWeight: 700 }}>{editingCandidate ? 'Edit Candidate Details' : 'Register New Candidate Profile'}</span>}
        placement="right"
        width={680}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <Button disabled={currentStep === 0} onClick={() => setCurrentStep(prev => prev - 1)}>
              Previous
            </Button>
            <Space>
              <Button onClick={() => setFormOpen(false)}>Cancel</Button>
              {currentStep < 3 ? (
                <Button type="primary" onClick={async () => {
                  try {
                    // Validate fields in the active step
                    let fieldsToValidate = []
                    if (currentStep === 0) fieldsToValidate = ['firstName', 'email', 'phone']
                    if (currentStep === 1) fieldsToValidate = ['totalExperience', 'relevantExperience']
                    await form.validateFields(fieldsToValidate)
                    setCurrentStep(prev => prev + 1)
                  } catch (err) {
                    message.error('Please correct verification errors on this step.')
                  }
                }}>
                  Next
                </Button>
              ) : (
                <Button type="primary" onClick={handleSaveCandidate} loading={saving}>
                  Save Candidate Profile
                </Button>
              )}
            </Space>
          </div>
        }
      >
        <Steps current={currentStep} items={stepsItems} style={{ marginBottom: 24 }} size="small" />

        <Form form={form} layout="vertical">
          {/* Step 1: Personal Details */}
          {currentStep === 0 && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'First Name is required' }]}>
                    <Input placeholder="John" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="lastName" label="Last Name">
                    <Input placeholder="Doe" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
                    <Input placeholder="john.doe@email.com" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phone" label="Mobile Number" rules={[{ required: true, pattern: /^\d{10}$/, message: 'Enter a valid 10-digit number' }]}>
                    <Input placeholder="9876543210" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="gender" label="Gender">
                    <Select placeholder="Select Gender" dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
                      <Option value="Male">Male</Option>
                      <Option value="Female">Female</Option>
                      <Option value="Other">Other</Option>
                      <Option value="Transgender">Transgender</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="dateOfBirth" label="Date of Birth">
                    <DatePicker style={{ width: '100%', borderRadius: 6 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="currentLocation" label="Current City">
                    <Input placeholder="Mumbai" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="preferredLocation" label="Preferred Sourcing Location">
                    <Input placeholder="Bangalore" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="linkedIn" label="LinkedIn URL">
                <Input placeholder="https://linkedin.com/in/username" prefix={<LinkOutlined />} style={{ borderRadius: 6 }} />
              </Form.Item>
              <Form.Item name="portfolio" label="Portfolio / Website URL">
                <Input placeholder="https://github.com/username" prefix={<LinkOutlined />} style={{ borderRadius: 6 }} />
              </Form.Item>
            </div>
          )}

          {/* Step 2: Professional Profile */}
          {currentStep === 1 && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="currentCompany" label="Current Employer">
                    <Input placeholder="e.g. Google" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="currentDesignation" label="Current Designation">
                    <Input placeholder="e.g. Tech Lead" style={{ borderRadius: 6 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="totalExperience" label="Total Experience (Years)" rules={[{ type: 'number', min: 0, message: 'Must be positive' }]}>
                    <InputNumber min={0} step={0.5} style={{ width: '100%', borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    name="relevantExperience" 
                    label="Relevant Experience (Years)" 
                    rules={[
                      { type: 'number', min: 0, message: 'Must be positive' },
                      ({ getFieldValue }) => ({
                        validator(_, val) {
                          const total = getFieldValue('totalExperience') || 0
                          if (val != null && val > total) {
                            return Promise.reject(new Error('Relevant experience cannot exceed total experience'))
                          }
                          return Promise.resolve()
                        }
                      })
                    ]}
                  >
                    <InputNumber min={0} step={0.5} style={{ width: '100%', borderRadius: 6 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="highestQualification" label="Highest Educational Qualification">
                <Input placeholder="e.g. Master of Technology (MTech)" style={{ borderRadius: 6 }} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="currentCTC" label="Current CTC (Per Annum)">
                    <InputNumber style={{ width: '100%', borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="expectedCTC" label="Expected CTC (Per Annum)">
                    <InputNumber style={{ width: '100%', borderRadius: 6 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="noticePeriodDays" label="Notice Period (Days)">
                    <InputNumber min={0} max={180} style={{ width: '100%', borderRadius: 6 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="skills" label="Key Technical Skills (Comma Separated)">
                <Input placeholder="e.g. React, Docker, Kubernetes" style={{ borderRadius: 6 }} />
              </Form.Item>
              <Form.Item name="languages" label="Languages Spoken (Comma Separated)">
                <Input placeholder="e.g. English, Hindi, German" style={{ borderRadius: 6 }} />
              </Form.Item>
            </div>
          )}

          {/* Step 3: Sourcing & Recruitment */}
          {currentStep === 2 && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="source" label="Source Channel">
                    <Select placeholder="Select Channel" dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
                      {SOURCES.map(s => <Option key={s} value={s}>{s}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="referralEmployeeId" label="Referred By (Employee)">
                    <Select
                      showSearch
                      allowClear
                      placeholder="Search employee..."
                      optionFilterProp="children"
                      filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                      options={employees.map(e => ({ value: e.employeeId, label: `${e.firstName} ${e.lastName || ''} (${e.employeeCode})` }))}
                      dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="willingToRelocate" label="Willing to Relocate?">
                    <Select placeholder="Select Option" dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
                      <Option value="Yes">Yes</Option>
                      <Option value="No">No</Option>
                      <Option value="Conditional">Conditional</Option>
                    </Select>
                  </Form.Item>
                </Col>
                {editingCandidate && (
                  <Col span={12}>
                    <Form.Item name="candidateStatus" label="ATS status">
                      <Select placeholder="Select status" dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
                        {STATUSES.map(s => <Option key={s} value={s}>{s}</Option>)}
                      </Select>
                    </Form.Item>
                  </Col>
                )}
              </Row>
              <Form.Item name="tags" label="Candidate Sourcing Tags">
                <Select mode="tags" placeholder="Add custom sourcing tags (e.g. GoldMedalist, ImmediateJoiner)">
                  <Option value="Immediate Joiner">Immediate Joiner</Option>
                  <Option value="Premium College">Premium College</Option>
                  <Option value="Diverse Candidate">Diverse Candidate</Option>
                </Select>
              </Form.Item>
            </div>
          )}

          {/* Step 4: Resume Upload */}
          {currentStep === 3 && (
            <div>
              <Form.Item label="Upload Resume Attachment (PDF, DOC, DOCX up to 10MB)">
                <Dragger
                  onRemove={() => setFileList([])}
                  beforeUpload={(file) => {
                    const isLt10M = file.size / 1024 / 1024 < 10
                    if (!isLt10M) {
                      message.error('Resume must be smaller than 10MB!')
                      return Upload.LIST_IGNORE
                    }
                    const allowed = ['.pdf', '.doc', '.docx']
                    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
                    if (!allowed.includes(extension)) {
                      message.error('Invalid format. PDF or Word only!')
                      return Upload.LIST_IGNORE
                    }
                    setFileList([file])
                    return false
                  }}
                  fileList={fileList}
                  style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10 }}
                >
                  <p className="ant-upload-drag-icon"><InboxOutlined style={{ color: isDarkMode ? '#FAA71A' : '#7C3AED' }} /></p>
                  <p className="ant-upload-text" style={{ color: 'rgba(255,255,255,0.85)' }}>Drag & Drop CV file here</p>
                  <p className="ant-upload-hint" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5 }}>
                    Accepting PDF, DOC, or DOCX formats only. Max size limit 10MB.
                  </p>
                </Dragger>
              </Form.Item>
            </div>
          )}
        </Form>
      </Drawer>

      {/* Profile Details Drawer with Inline Resume Preview & Timeline */}
      <Drawer
        title={<span style={{ fontWeight: 700 }}>Candidate Profile Overview</span>}
        placement="right"
        width={720}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      >
        {detailsLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><Badge status="processing" text="Loading details..." /></div>
        ) : selectedCandidate ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar size={64} style={{ background: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#111' : '#fff', fontWeight: 700, fontSize: 24 }}>
                {selectedCandidate.firstName?.[0]}{selectedCandidate.lastName?.[0] || ''}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0 }}>{selectedCandidate.firstName} {selectedCandidate.lastName || ''}</Title>
                <Space style={{ marginTop: 4 }}>
                  <Tag color={CANDIDATE_STATUS_COLORS[selectedCandidate.candidateStatus] || 'blue'}>{selectedCandidate.candidateStatus}</Tag>
                  {selectedCandidate.source && <Tag color="cyan">Source: {selectedCandidate.source}</Tag>}
                </Space>
              </div>
            </div>

            {/* Sourcing Tags */}
            {selectedCandidate.candidateTags && (
              <div style={{ marginBottom: 20 }}>
                {selectedCandidate.candidateTags.split(',').map(t => <Tag color="purple" style={{ borderRadius: 6 }} key={t}>{t}</Tag>)}
              </div>
            )}

            {/* Active Recruitment Timeline Activities */}
            <Divider orientation="left" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Activity Sourcing Timeline</Divider>
            <Timeline
              style={{ padding: '8px 16px' }}
              items={[
                { color: 'green', children: `Candidate record created on ${dayjs(selectedCandidate.createdAt).format('DD MMM YYYY HH:mm')}` },
                { color: selectedCandidate.resumeFilePath ? 'green' : 'gray', children: selectedCandidate.resumeFilePath ? 'Resume CV document uploaded successfully' : 'No Resume uploaded yet' },
                { 
                  color: selectedCandidate.jobApplications?.length > 0 ? 'purple' : 'gray', 
                  children: selectedCandidate.jobApplications?.length > 0 
                    ? `Applied to ${selectedCandidate.jobApplications.length} job opening(s)`
                    : 'Candidate has not applied to any job openings yet'
                },
                ...selectedCandidate.jobApplications?.map(app => ({
                  color: app.currentStage === 'Joined' ? 'blue' : app.currentStage === 'Rejected' ? 'red' : 'purple',
                  children: `Application stage transitioned to "${app.currentStage}" for role: "${app.requisition?.jobTitle || 'Role'}"`
                })) || []
              ]}
            />

            <Divider />

            {/* Personal Details */}
            <Descriptions title="Personal Information" bordered column={1} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
              <Descriptions.Item label="Mobile Phone">{selectedCandidate.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Gender">{selectedCandidate.gender || '-'}</Descriptions.Item>
              <Descriptions.Item label="Date of Birth">{selectedCandidate.dateOfBirth ? dayjs(selectedCandidate.dateOfBirth).format('DD MMM YYYY') : '-'}</Descriptions.Item>
              <Descriptions.Item label="Current City">{selectedCandidate.currentLocation || '-'}</Descriptions.Item>
              <Descriptions.Item label="Preferred City">{selectedCandidate.preferredLocation || '-'}</Descriptions.Item>
              <Descriptions.Item label="LinkedIn">
                {selectedCandidate.linkedIn ? <a href={selectedCandidate.linkedIn} target="_blank" rel="noreferrer">{selectedCandidate.linkedIn}</a> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Portfolio / Website">
                {selectedCandidate.portfolio ? <a href={selectedCandidate.portfolio} target="_blank" rel="noreferrer">{selectedCandidate.portfolio}</a> : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Professional Profiles */}
            <Descriptions title="Professional Details" bordered column={1} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Current Company">{selectedCandidate.currentCompany || '-'}</Descriptions.Item>
              <Descriptions.Item label="Current Designation">{selectedCandidate.currentDesignation || '-'}</Descriptions.Item>
              <Descriptions.Item label="Total Experience">{selectedCandidate.totalExperience != null ? `${selectedCandidate.totalExperience} yrs` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Relevant Experience">{selectedCandidate.relevantExperience != null ? `${selectedCandidate.relevantExperience} yrs` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Highest Qualification">{selectedCandidate.highestQualification || '-'}</Descriptions.Item>
              <Descriptions.Item label="Current CTC">{selectedCandidate.currentCTC != null ? `₹ ${selectedCandidate.currentCTC.toLocaleString()}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Expected CTC">{selectedCandidate.expectedCTC != null ? `₹ ${selectedCandidate.expectedCTC.toLocaleString()}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Notice Period">{selectedCandidate.noticePeriodDays != null ? `${selectedCandidate.noticePeriodDays} Days` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Technical Skills">{selectedCandidate.skills || '-'}</Descriptions.Item>
              <Descriptions.Item label="Languages Spoken">{selectedCandidate.languages || '-'}</Descriptions.Item>
            </Descriptions>

            {selectedCandidate.referralEmployeeName && (
              <Descriptions title="Referral Employee" bordered column={1} size="small" style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Referred By">{selectedCandidate.referralEmployeeName}</Descriptions.Item>
              </Descriptions>
            )}

            {/* Resume viewer / attachments inline */}
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>Resume Attachment</Title>
              {selectedCandidate.resumeFilePath ? (
                <div>
                  <Card size="small" style={{ background: 'rgba(255,255,255,0.01)', border: 'var(--border-glass)', borderRadius: 10, marginBottom: 12 }}>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          <FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                          <div>
                            <Text strong style={{ fontSize: 13 }}>Candidate Resume File</Text>
                            <div style={{ fontSize: 11, opacity: 0.45 }}>Format: PDF/Word document</div>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        <Space>
                          <Button size="small" type="primary" ghost href={getFileUrl(selectedCandidate.resumeFilePath)} target="_blank" icon={<DownloadOutlined />}>
                            Download
                          </Button>
                          <Upload
                            beforeUpload={handleReplaceResume}
                            showUploadList={false}
                            accept=".pdf,.doc,.docx"
                          >
                            <Button size="small" type="dashed" icon={<UploadOutlined />}>Replace Resume</Button>
                          </Upload>
                        </Space>
                      </Col>
                    </Row>
                  </Card>

                  {/* PDF Browser Inline Preview */}
                  {selectedCandidate.resumeFilePath.toLowerCase().endsWith('.pdf') && (
                    <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', height: 400, marginTop: 12 }}>
                      <iframe 
                        title="Resume Preview" 
                        src={getFileUrl(selectedCandidate.resumeFilePath)} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none' }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>No resume has been uploaded yet.</Text>
                  <Upload
                    beforeUpload={handleReplaceResume}
                    showUploadList={false}
                    accept=".pdf,.doc,.docx"
                  >
                    <Button type="dashed" icon={<UploadOutlined />}>Upload Resume File</Button>
                  </Upload>
                </div>
              )}
            </div>

            {/* Applications List */}
            <div>
              <Title level={5}>Job Applications ({selectedCandidate.jobApplications?.length || 0})</Title>
              {selectedCandidate.jobApplications?.length > 0 ? (
                <List
                  dataSource={selectedCandidate.jobApplications}
                  renderItem={app => (
                    <List.Item>
                      <List.Item.Meta
                        title={<Text strong style={{ fontSize: 13.5 }}>{app.requisition?.jobTitle || 'Job Role'}</Text>}
                        description={`Applied Date: ${dayjs(app.applicationDate).format('DD MMM YYYY')} · Current Stage: ${app.currentStage}`}
                      />
                      <Tag color="purple">{app.currentStage}</Tag>
                    </List.Item>
                  )}
                />
              ) : (
                <Paragraph type="secondary">This candidate has not applied to any job openings yet.</Paragraph>
              )}
            </div>
          </div>
        ) : (
          <Empty />
        )}
      </Drawer>

      {/* Apply to Job Modal */}
      <Modal
        title="Apply Candidate to Job Opening (Move to ATS)"
        open={applyOpen}
        onCancel={() => { setApplyOpen(false); setSelectedJobId(null); setApplyCandidate(null) }}
        onOk={handleApplyToJob}
        confirmLoading={applying}
        okText="Apply Candidate"
      >
        <div style={{ marginTop: 16 }}>
          <Paragraph>
            Select a Published Job Opening to link <Text strong>{applyCandidate?.firstName} {applyCandidate?.lastName}</Text> to. An application record will be generated in stage <Tag color="blue">Applied</Tag>.
          </Paragraph>
          <Form.Item label="Select Published Job Posting" required>
            <Select
              placeholder="Select active posting..."
              value={selectedJobId}
              onChange={v => setSelectedJobId(v)}
              style={{ width: '100%' }}
              dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}
            >
              {publishedJobs.map(job => (
                <Option key={job.jobId} value={job.reqId}>
                  {job.jobTitle} ({job.mrfNumber || 'MRF'})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        title="Bulk Import Candidate Profiles"
        open={importOpen}
        onCancel={() => { setImportOpen(false); setImportFileList([]) }}
        onOk={handleBulkImport}
        confirmLoading={importing}
        okText="Process Import"
      >
        <div style={{ marginTop: 16 }}>
          <Paragraph>
            Upload a CSV, Excel (.xlsx), or ZIP archive of resumes. Validations will run on the server to prevent duplicate email or mobile number conflicts.
          </Paragraph>
          <Form.Item label="Select Import File">
            <Upload
              onRemove={() => setImportFileList([])}
              beforeUpload={(file) => {
                setImportFileList([file])
                return false
              }}
              fileList={importFileList}
            >
              <Button icon={<UploadOutlined />}>Choose CSV/Excel/ZIP File</Button>
            </Upload>
          </Form.Item>
        </div>
      </Modal>
    </div>
  )
}
