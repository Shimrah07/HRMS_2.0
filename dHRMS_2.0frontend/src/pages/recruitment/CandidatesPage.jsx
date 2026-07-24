import React, { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form, message,
  Badge, Row, Col, Drawer, Divider, Typography, List, Empty, Tooltip,
  DatePicker, InputNumber, Avatar, Upload, Descriptions, Popconfirm, Steps, Timeline, Alert,
  Dropdown, Statistic
} from 'antd'
import {
  SearchOutlined, UserAddOutlined, FilePdfOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined,
  UploadOutlined, InboxOutlined, LinkOutlined, UserOutlined, CalendarOutlined,
  DollarOutlined, HomeOutlined, SafetyCertificateOutlined, InboxOutlined as ZipOutlined,
  GlobalOutlined, BookOutlined, FileTextOutlined, CheckCircleOutlined, SendOutlined, TeamOutlined,
  DownOutlined, CloudUploadOutlined, ClockCircleOutlined, RobotOutlined, RocketOutlined
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
  'ManualHR', 'CSVImport', 'EmployeeReferral', 'CareersPortal', 'ResumeParser'
]

const STATUSES = [
  'Active', 'InProcess', 'Hired', 'Rejected', 'Withdrawn', 'Blacklisted', 'Archived'
]

export default function CandidatesPage() {
  console.log("CANDIDATES PAGE LOADED")
  const { isDarkMode } = useUIStore()
  const { hasRole } = useAuth()
  const { can } = usePermission()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // RBAC check: visible only to HR, Recruiter, Admin. Hidden for Employee / Hiring Manager
  const isAuthorizedToCreate = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.HR_ADMIN) || hasRole(ROLES.HR_MANAGER) || hasRole(ROLES.RECRUITMENT_MANAGER)

  // jobId from URL (?jobId=xxx) — auto-filter when navigating from Applicant Count badge
  const jobIdFilter = searchParams.get('jobId') || undefined

  const [candidates, setCandidates] = useState([])
  const [employees, setEmployees] = useState([])
  const [publishedJobs, setPublishedJobs] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Filters state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || undefined)
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
  const [timelineFilter, setTimelineFilter] = useState('All')

  const getUnifiedTimeline = (candidate) => {
    if (!candidate) return []
    return [
      { category: 'Recruitment', title: 'Application Submitted', description: 'Applied for Job Opening.', time: '12 Jul 2026, 10:30 AM', actor: 'Candidate Self-Service', color: 'blue' },
      { category: 'Recruitment', title: 'Screening Completed', description: 'Resume screened and shortlisted for L1 Technical Interview.', time: '13 Jul 2026, 02:15 PM', actor: 'Rahul Sharma (HR Admin)', color: 'blue' },
      { category: 'Interviews', title: 'Technical L1 Interview Approved', description: 'Scored 92% on technical architecture & coding exercise.', time: '15 Jul 2026, 04:00 PM', actor: 'Tech Interviewer', color: 'green' },
      { category: 'Interviews', title: 'HR Interview Approved', description: 'Cultural fit and compensation expectations verified.', time: '17 Jul 2026, 11:30 AM', actor: 'Anjali Mehta (HR Manager)', color: 'green' },
      { category: 'Interviews', title: 'Managerial Round Approved', description: 'Final leadership discussion cleared with positive feedback.', time: '18 Jul 2026, 03:45 PM', actor: 'Engineering Manager', color: 'green' },
      { category: 'Offers', title: 'Offer Letter Generated', description: 'Draft Offer created for Offered CTC ₹ 14,50,000.', time: '19 Jul 2026, 09:30 AM', actor: 'Rahul Sharma (HR Admin)', color: 'purple' },
      { category: 'Offers', title: 'Offer Approved & Sent', description: 'Manager approved offer letter dispatched via portal.', time: '19 Jul 2026, 02:00 PM', actor: 'Hiring Manager', color: 'purple' },
      { category: 'Offers', title: 'Offer Accepted', description: 'Candidate signed digital offer letter.', time: '20 Jul 2026, 10:15 AM', actor: candidate.firstName ? `${candidate.firstName} ${candidate.lastName || ''}` : 'Candidate', color: 'green' },
      { category: 'Background Verification', title: 'Background Verification Initiated', description: 'AuthBridge BGV Case created (Executive Package).', time: '20 Jul 2026, 10:30 AM', actor: 'System Auto-Trigger', color: 'cyan' },
      { category: 'Background Verification', title: 'Candidate Documents Uploaded', description: 'Aadhaar, PAN, and Degree Certificate uploaded.', time: '21 Jul 2026, 11:00 AM', actor: 'Candidate', color: 'cyan' },
      { category: 'Background Verification', title: 'Background Verification Cleared', description: 'Identity, Employment & Education checks verified successfully.', time: '22 Jul 2026, 01:20 PM', actor: 'AuthBridge Agency Officer', color: 'green' },
      { category: 'Onboarding', title: 'Onboarding Initiated', description: 'Pre-joining tasks and IT hardware requests queued.', time: '22 Jul 2026, 02:00 PM', actor: 'Rahul Sharma (HR Admin)', color: 'gold' },
      { category: 'Onboarding', title: 'Employee Code Generated', description: 'EMP0004 generated with sequence lock.', time: '22 Jul 2026, 03:00 PM', actor: 'System Auto-Generator', color: 'green' },
      { category: 'Onboarding', title: 'Employee Master Record Created', description: 'Official employee profile created on Probation.', time: '22 Jul 2026, 03:00 PM', actor: 'Rahul Sharma (HR Admin)', color: 'green' },
      { category: 'Onboarding', title: 'User Account Created', description: 'Credentials & EMPLOYEE role provisioned.', time: '22 Jul 2026, 03:01 PM', actor: 'Identity Provider', color: 'green' },
      { category: 'Onboarding', title: 'Department & Manager Assigned', description: 'Assigned to Engineering Dept under VP Eng.', time: '22 Jul 2026, 03:01 PM', actor: 'HR Admin', color: 'green' },
      { category: 'Onboarding', title: 'Onboarding Completed & Recruitment Closed', description: 'Candidate archived as Converted to Employee.', time: '22 Jul 2026, 03:05 PM', actor: 'System Pipeline Archive', color: 'blue' }
    ]
  }

  // KPI Dashboard Stats
  const [stats, setStats] = useState({
    totalCandidates: 0,
    activeApplications: 0,
    pendingQueue: 0,
    todayIntake: 0
  })

  // Bulk Import modal state
  const [importOpen, setImportOpen] = useState(false)
  const [importJobId, setImportJobId] = useState(null)
  const [importFile, setImportFile] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewRows, setPreviewRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [resultModal, setResultModal] = useState(null)

  // Apply to Job Modal
  const [applyOpen, setApplyOpen] = useState(false)
  const [applyCandidate, setApplyCandidate] = useState(null)
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [applying, setApplying] = useState(false)

  // Referral Candidate Entry Drawer
  const [referralOpen, setReferralOpen] = useState(false)
  const [referralForm] = Form.useForm()
  const [referralEmployees, setReferralEmployees] = useState([])
  const [referralResume, setReferralResume] = useState(null)
  const [referralSubmitting, setReferralSubmitting] = useState(false)

  // AI Resume Parser Showcase Modal State
  const [parserModalOpen, setParserModalOpen] = useState(false)

  // Source Badge Helper
  const getSourceBadge = (source) => {
    if (!source) return '-'
    const clean = source.trim()
    if (clean === 'ManualHR' || clean === 'ManualHREntry') {
      return <Tag color="success" style={{ borderRadius: 6, fontWeight: 600 }}>🟢 Manual HR</Tag>
    }
    if (clean === 'CSVImport') {
      return <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600 }}>🔵 CSV Import</Tag>
    }
    if (clean === 'EmployeeReferral') {
      return <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>🟣 Employee Referral</Tag>
    }
    if (clean === 'CareerPortal' || clean === 'CareersPortal') {
      return <Tag color="orange" style={{ borderRadius: 6, fontWeight: 600 }}>🟠 Careers Portal</Tag>
    }
    if (clean === 'ResumeParser') {
      return <Tag color="gold" style={{ borderRadius: 6, fontWeight: 600 }}>🤖 Resume Parser</Tag>
    }
    return <Tag color="blue" style={{ borderRadius: 6 }}>{clean}</Tag>
  }

  // Load KPI stats
  const loadStats = useCallback(async () => {
    try {
      const [candRes, appRes, pendingRes] = await Promise.allSettled([
        recruitmentService.getCandidates({ pageSize: 1000 }),
        recruitmentService.getApplications(),
        recruitmentService.getPendingApplications({ status: 'Pending' })
      ])

      const allCands = candRes.status === 'fulfilled' && candRes.value?.success ? (candRes.value.data || []) : []
      const allApps = appRes.status === 'fulfilled' && appRes.value?.success ? (appRes.value.data || []) : []
      const allPending = pendingRes.status === 'fulfilled' && pendingRes.value?.success ? (pendingRes.value.data || []) : []

      const activeStages = ['Applied', 'Screening', 'Shortlisted', 'InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview', 'Offer', 'BackgroundCheck', 'Onboarding']
      const activeAppsCount = allApps.filter(a => activeStages.includes(a.currentStage)).length

      const today = dayjs().format('YYYY-MM-DD')
      const todayCount = allCands.filter(c => c.createdAt && dayjs(c.createdAt).format('YYYY-MM-DD') === today).length

      setStats({
        totalCandidates: candRes.status === 'fulfilled' && candRes.value?.totalCount ? candRes.value.totalCount : allCands.length,
        activeApplications: activeAppsCount,
        pendingQueue: allPending.length,
        todayIntake: todayCount
      })
    } catch (err) {
      console.error('Failed to load candidate stats.', err)
    }
  }, [])

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
        jobId: jobIdFilter || undefined,
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
  }, [search, statusFilter, sourceFilter, sortBy, sortOrder, jobIdFilter, page, pageSize])

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
    loadStats()
  }, [loadCandidates, loadStats])

  useEffect(() => {
    loadLookups()
  }, [])

  useEffect(() => {
    const src = searchParams.get('source')
    if (src) {
      setSourceFilter(src)
    }
  }, [searchParams])

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
        source: editingCandidate ? (editingCandidate.source || 'ManualHR') : 'ManualHR',
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

  // Referral candidate handlers
  const handleSearchReferralEmployees = async (val) => {
    if (!val || val.trim().length < 2) return
    try {
      const res = await employeeService.getEmployees({ search: val, activeStatus: 'active' })
      if (res.success) {
        setReferralEmployees(res.data || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleReferralSubmit = async (values) => {
    setReferralSubmitting(true)
    try {
      if (values.jobId) {
        // Job selected — apply directly to job posting via addCandidateToJob
        const formData = new FormData()
        formData.append('JobId', values.jobId)
        formData.append('FirstName', values.firstName)
        if (values.lastName) formData.append('LastName', values.lastName)
        formData.append('Email', values.email)
        if (values.phone) formData.append('Phone', values.phone)
        if (values.currentCompany) formData.append('CurrentCompany', values.currentCompany)
        if (values.currentDesignation) formData.append('CurrentDesignation', values.currentDesignation)
        if (values.currentCTC) formData.append('CurrentCTC', values.currentCTC)
        if (values.expectedCTC) formData.append('ExpectedCTC', values.expectedCTC)
        if (values.noticePeriodDays) formData.append('NoticePeriodDays', values.noticePeriodDays)
        if (values.totalExperience) formData.append('TotalExperience', values.totalExperience)
        formData.append('Source', 'EmployeeReferral')
        if (values.referralEmployeeId) formData.append('ReferralEmployeeId', values.referralEmployeeId)
        if (referralResume) {
          formData.append('resumeFile', referralResume)
        }
        const res = await recruitmentService.addCandidateToJob(values.jobId, formData)
        if (res.success) {
          message.success('Referral candidate linked to job successfully!')
          setReferralOpen(false)
          referralForm.resetFields()
          setReferralResume(null)
          loadCandidates()
          loadStats()
        } else {
          message.error(res.errors?.[0] || 'Failed to record referral candidate.')
        }
      } else {
        // No job selected — add directly to Candidate Database with source=EmployeeReferral
        const payload = {
          firstName: values.firstName,
          lastName: values.lastName || null,
          email: values.email,
          phone: values.phone || null,
          currentCompany: values.currentCompany || null,
          currentDesignation: values.currentDesignation || null,
          currentCTC: values.currentCTC || 0,
          expectedCTC: values.expectedCTC || 0,
          noticePeriodDays: values.noticePeriodDays || 0,
          totalExperience: values.totalExperience || 0,
          source: 'EmployeeReferral',
          referralEmployeeId: values.referralEmployeeId || null,
          candidateStatus: 'Active'
        }
        const res = await recruitmentService.createCandidate(payload)
        if (res.success) {
          // Upload resume if provided
          if (referralResume && res.data?.candidateId) {
            await recruitmentService.uploadResume(res.data.candidateId, referralResume).catch(() => {})
          }
          message.success('Referred candidate added to Candidate Database successfully!')
          setReferralOpen(false)
          referralForm.resetFields()
          setReferralResume(null)
          loadCandidates()
          loadStats()
        } else {
          message.error(res.errors?.[0] || 'Failed to add referred candidate.')
        }
      }
    } catch (err) {
      console.error(err)
      message.error(err.response?.data?.errors?.[0] || 'An error occurred while recording referral candidate.')
    } finally {
      setReferralSubmitting(false)
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
        const matchedJob = publishedJobs.find(job => job.reqId === selectedJobId) || publishedJobs.find(job => job.jobId === selectedJobId)
        const jobTitle = matchedJob ? matchedJob.jobTitle : 'the selected job opening'
        message.success(`Candidate successfully applied to ${jobTitle}`)
        setApplyOpen(false)
        setSelectedJobId(null)
        setApplyCandidate(null)
        loadCandidates()
        if (detailsOpen && selectedCandidate?.candidateId === applyCandidate.candidateId) {
          openDetails(applyCandidate) // reload details drawer applications list
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.errors?.[0] || err.response?.data?.detail || err.response?.data?.message || 'Failed to apply candidate to job.'
      message.error(errorMsg)
    } finally {
      setApplying(false)
    }
  }

  // Spreadsheet CSV/Excel Bulk Import handlers
  const handleImportFileChange = async (info) => {
    const selectedFile = info.file
    setImportFile(selectedFile)
    setPreviewRows([])

    if (!selectedFile) return

    setLoadingPreview(true)
    try {
      const res = await recruitmentService.previewImport(selectedFile)
      if (res.success) {
        setPreviewRows(res.data || [])
        message.success(`${res.data?.length || 0} candidate rows parsed successfully.`)
      } else {
        message.error(res.errors?.[0] || 'Failed to parse file preview.')
        setImportFile(null)
      }
    } catch (err) {
      console.error(err)
      message.error('An error occurred while uploading/parsing the spreadsheet.')
      setImportFile(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleConfirmImport = async () => {
    if (previewRows.length === 0 && !importFile) {
      message.warning('Please select a candidate spreadsheet file.')
      return
    }

    // Guard: jobId selected but preview not yet loaded — file may still be parsing
    if (importJobId && previewRows.length === 0) {
      message.warning('Please wait for the file preview to load before confirming import.')
      return
    }

    setImporting(true)
    try {
      let res
      if (previewRows.length > 0) {
        // Use the preview+apply pipeline (supports both job-linked and DB-only import)
        res = await recruitmentService.applyImport({
          jobId: importJobId || null,
          candidates: previewRows
        })
      } else {
        message.warning('No candidate rows to import. Please upload a valid CSV or Excel file first.')
        return
      }

      if (res && res.success) {
        setResultModal(res.data || { totalRows: previewRows.length, importedCount: previewRows.length, skippedCount: 0, failedCount: 0 })
        setImportOpen(false)
        setImportFile(null)
        setImportJobId(null)
        setPreviewRows([])
        loadCandidates()
        loadStats()
      } else {
        message.error(res?.errors?.[0] || res?.message || 'Import failed.')
      }
    } catch (err) {
      console.error(err)
      message.error('An error occurred during candidate import processing.')
    } finally {
      setImporting(false)
    }
  }

  // Table columns definition
  const columns = [
    {
      title: 'Candidate Details',
      key: 'name',
      sorter: true,
      width: 220,
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
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (v) => v || '-'
    },
    { title: 'Source', dataIndex: 'source', key: 'source', width: 160, render: (v) => getSourceBadge(v) },
    {
      title: 'Recruiter',
      dataIndex: 'assignedRecruiterName',
      key: 'recruiter',
      width: 150,
      render: (v) => v ? <Tag color="geekblue">{v}</Tag> : <span style={{ opacity: 0.4 }}>Unassigned</span>
    },
    {
      title: 'Applied Job',
      dataIndex: 'latestJobTitle',
      key: 'latestJobTitle',
      width: 180,
      render: (v) => v || '-'
    },
    {
      title: 'Current Stage',
      dataIndex: 'latestStage',
      key: 'lateststage',
      width: 120,
      render: (v) => v ? <Tag color="purple">{v}</Tag> : <Tag color="default">—</Tag>
    },
    {
      title: 'Applied Date',
      dataIndex: 'latestApplicationDate',
      key: 'latestApplicationDate',
      width: 130,
      render: (v) => v ? dayjs(v).format('DD MMM YYYY') : '-'
    },
    {
      title: 'Resume',
      key: 'resume',
      width: 90,
      render: (_, r) => r.resumeFilePath ? (
        <Tooltip title="Download Resume">
          <Button type="text" size="small" icon={<DownloadOutlined />} href={getFileUrl(r.resumeFilePath)} target="_blank" style={{ color: '#22C55E' }} />
        </Tooltip>
      ) : '-'
    },
    {
      title: 'Applications Count',
      dataIndex: 'applicationsCount',
      key: 'applicationsCount',
      width: 150,
      render: (v, r) => (
        <Button type="link" size="small" onClick={() => openDetails(r)} style={{ padding: 0 }}>
          {v || 0} Applications
        </Button>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      render: (_, r) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={() => { setApplyCandidate(r); setApplyOpen(true) }}
            style={{ borderRadius: 6, fontSize: 11 }}
          >
            Apply to Job
          </Button>
          <Button
            type="dashed"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => openDetails(r)}
            style={{ borderRadius: 6, fontSize: 11 }}
          >
            View Apps
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

  // More Intake dropdown menu items
  const intakeMenuItems = [
    {
      key: 'import_csv',
      icon: <UploadOutlined style={{ color: '#06B6D4' }} />,
      label: 'Import CSV / Excel',
      onClick: () => {
        setImportJobId(null)
        setImportFile(null)
        setPreviewRows([])
        setImportOpen(true)
      }
    },
    {
      key: 'add_referral',
      icon: <TeamOutlined style={{ color: '#A855F7' }} />,
      label: 'Add Referral',
      onClick: () => {
        referralForm.resetFields()
        setReferralResume(null)
        setReferralOpen(true)
      }
    },
    {
      type: 'divider'
    },
    {
      key: 'resume_parser',
      disabled: true,
      icon: <RobotOutlined style={{ color: '#94a3b8' }} />,
      label: (
        <Tooltip title="AI Resume Parsing will automatically extract candidate information from uploaded resumes. ✨ Coming in Phase 5" placement="right">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Resume Parser <Tag color="gold" style={{ margin: 0, fontSize: 10 }}>Coming Soon</Tag>
          </span>
        </Tooltip>
      )
    }
  ]

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Candidate Database"
        subtitle="Manage profiles, upload CVs, link candidates to jobs, and verify bulk resumes."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment', path: '/recruitment' }, { label: 'Candidates' }]}
        extra={
          <Space wrap size="middle">
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
                  fontWeight: 700,
                  height: 38,
                  padding: '0 18px'
                }}
              >
                + Add Candidate
              </Button>
            )}

            <Button
              icon={<UploadOutlined style={{ color: '#06B6D4' }} />}
              onClick={() => {
                setImportJobId(null)
                setImportFile(null)
                setPreviewRows([])
                setImportOpen(true)
              }}
              style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
            >
              Import CSV
            </Button>

            <Button
              icon={<TeamOutlined style={{ color: '#A855F7' }} />}
              onClick={() => {
                referralForm.resetFields()
                setReferralResume(null)
                setReferralOpen(true)
              }}
              style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
            >
              Refer Candidate
            </Button>

            <Button
              icon={<RobotOutlined style={{ color: '#F59E0B' }} />}
              onClick={() => setParserModalOpen(true)}
              style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
            >
              AI Resume Parser <Tag color="gold" style={{ marginLeft: 6, marginRight: 0, fontSize: 10, fontWeight: 700 }}>Coming Soon</Tag>
            </Button>

            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCSV}
              style={{ borderRadius: 8, fontWeight: 600, height: 38 }}
            >
              Export
            </Button>
          </Space>
        }
      />

      {/* ATS Dashboard KPI Stat Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6} lg={6}>
          <Card variant="borderless" style={{ borderRadius: 10, border: 'var(--border-glass)' }} styles={{ body: { padding: '14px 16px' } }}>
            <Statistic
              title="Total Candidates"
              value={stats.totalCandidates}
              prefix={<UserOutlined style={{ color: '#3B82F6' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card variant="borderless" style={{ borderRadius: 10, border: 'var(--border-glass)' }} styles={{ body: { padding: '14px 16px' } }}>
            <Statistic
              title="Active Applications"
              value={stats.activeApplications}
              prefix={<RocketOutlined style={{ color: '#EAB308' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card variant="borderless" style={{ borderRadius: 10, border: 'var(--border-glass)' }} styles={{ body: { padding: '14px 16px' } }}>
            <Statistic
              title="Pending Queue"
              value={stats.pendingQueue}
              prefix={<ClockCircleOutlined style={{ color: '#06B6D4' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card variant="borderless" style={{ borderRadius: 10, border: 'var(--border-glass)' }} styles={{ body: { padding: '14px 16px' } }}>
            <Statistic
              title="Today's Intake"
              value={stats.todayIntake}
              prefix={<CheckCircleOutlined style={{ color: '#22C55E' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Job filter banner — shown when navigated from Applicant Count badge */}
      {jobIdFilter && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 10 }}
          message={`Showing candidates filtered by Job Opening`}
          description={`Displaying only candidates who have applied for this specific job. Clear your browser URL params to see all candidates.`}
          closable
        />
      )}

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
          sticky={true}
          scroll={{ x: 2070 }}
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
                <Col span={12}>
                  <Form.Item name="willingToRelocate" label="Willing to Relocate?">
                    <Select placeholder="Select Option" dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
                      <Option value="Yes">Yes</Option>
                      <Option value="No">No</Option>
                      <Option value="Conditional">Conditional</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                {editingCandidate && (
                  <Col span={12}>
                    <Form.Item name="candidateStatus" label="ATS Status">
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

            {/* Candidate Interview Score Summary & Intelligent Hiring Confidence */}
            {(() => {
              const apps = selectedCandidate.jobApplications || []
              let techScore = null, hrScore = null, mgrScore = null
              let recommendations = []
              let historyRounds = []

              apps.forEach(app => {
                try {
                  const sd = JSON.parse(app.stageDataJson || '{}')
                  if (sd.technicalInterview) {
                    if (sd.technicalInterview.technicalRating) techScore = sd.technicalInterview.technicalRating
                    if (sd.technicalInterview.recommendation) recommendations.push(sd.technicalInterview.recommendation)
                    historyRounds.push({ type: 'Technical Interview', date: sd.technicalInterview.interviewDate, rating: sd.technicalInterview.technicalRating, status: sd.technicalInterview.approved ? 'Approved' : 'Completed', rec: sd.technicalInterview.recommendation, feedback: sd.technicalInterview.feedback })
                  }
                  if (sd.hrInterview) {
                    if (sd.hrInterview.hrRating) hrScore = sd.hrInterview.hrRating
                    if (sd.hrInterview.recommendation) recommendations.push(sd.hrInterview.recommendation)
                    historyRounds.push({ type: 'HR Interview', date: sd.hrInterview.interviewDate, rating: sd.hrInterview.hrRating, status: sd.hrInterview.approved ? 'Approved' : 'Completed', rec: sd.hrInterview.recommendation, feedback: sd.hrInterview.feedback })
                  }
                  if (sd.managerialInterview) {
                    if (sd.managerialInterview.managerialRating) mgrScore = sd.managerialInterview.managerialRating
                    if (sd.managerialInterview.recommendation) recommendations.push(sd.managerialInterview.recommendation)
                    historyRounds.push({ type: 'Managerial Interview', date: sd.managerialInterview.interviewDate, rating: sd.managerialInterview.managerialRating, status: sd.managerialInterview.approved ? 'Approved' : 'Completed', rec: sd.managerialInterview.recommendation, feedback: sd.managerialInterview.feedback })
                  }
                } catch {}
              })

              // Compute Hiring Confidence
              let totalConfidence = 0
              recommendations.forEach(r => {
                if (r === 'Strong Hire') totalConfidence += 100
                else if (r === 'Hire') totalConfidence += 80
                else if (r === 'Hold') totalConfidence += 50
                else totalConfidence += 0
              })
              const confidencePct = recommendations.length > 0 ? Math.round(totalConfidence / recommendations.length) : null

              return (
                <Card style={{ background: 'var(--color-bg-elevated)', border: 'var(--border-glass)', borderRadius: 12, marginBottom: 20 }}>
                  <Title level={5} style={{ marginBottom: 12 }}>🎯 Candidate Interview Score Summary</Title>
                  <Row gutter={12} style={{ marginBottom: 12 }}>
                    <Col span={6}>
                      <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>Technical</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{techScore ? `${techScore}/10` : '-'}</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>HR</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{hrScore ? `${hrScore}/10` : '-'}</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>Managerial</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{mgrScore ? `${mgrScore}/10` : '-'}</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div style={{ textAlign: 'center', padding: 8, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 8, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        <div style={{ fontSize: 11, color: '#22C55E' }}>Hiring Confidence</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#22C55E' }}>{confidencePct != null ? `${confidencePct}%` : 'N/A'}</div>
                      </div>
                    </Col>
                  </Row>

                  {/* Complete Interview History Timeline */}
                  {historyRounds.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, opacity: 0.8 }}>Chronological Interview History</div>
                      <List
                        size="small"
                        dataSource={historyRounds}
                        renderItem={r => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={<CheckCircleOutlined style={{ color: '#3B82F6' }} />}
                              title={<span style={{ fontWeight: 600 }}>{r.type} <Tag color={r.status === 'Approved' ? 'green' : 'blue'}>{r.status}</Tag></span>}
                              description={<span>{r.date ? dayjs(r.date).format('DD MMM YYYY') : 'Date N/A'} • Score: {r.rating || '-'}/10 • Rec: {r.rec || '-'}</span>}
                            />
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </Card>
              )
            })()}

            {/* Active Recruitment Timeline Activities */}
            <Divider orientation="left" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Activity Sourcing Timeline</Divider>
            <Timeline
              style={{ padding: '8px 16px' }}
              items={(() => {
                const appTimelineEvents = (selectedCandidate.jobApplications || []).flatMap(app => {
                  try {
                    const events = app.timelineEventsJson ? JSON.parse(app.timelineEventsJson) : [];
                    return events.map(e => ({
                      color: e.event === 'Rejected' || e.event === 'BGV Failed' ? 'red' : 
                             e.event === 'Hired' || e.event === 'Offer Accepted' || e.event === 'BGV Cleared' ? 'green' : 'purple',
                      children: (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{e.event}</span>
                          {e.remarks && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{e.remarks}</span>}
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{dayjs(e.timestamp).format('DD MMM YYYY HH:mm')}</span>
                        </div>
                      )
                    }));
                  } catch (err) {
                    return [];
                  }
                });

                if (appTimelineEvents.length > 0) {
                  return appTimelineEvents;
                }

                return [
                  { color: 'green', children: `Candidate record created on ${dayjs(selectedCandidate.createdAt).format('DD MMM YYYY HH:mm')}` },
                  { color: selectedCandidate.resumeFilePath ? 'green' : 'gray', children: selectedCandidate.resumeFilePath ? 'Resume CV document uploaded successfully' : 'No Resume uploaded yet' }
                ];
              })()}
            />

            <Divider />

            {/* Candidate Hiring Readiness & Overall Recruitment Health Card */}
            <Card
              style={{
                background: 'var(--color-bg-container)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                borderRadius: 12,
                marginBottom: 24
              }}
              styles={{ body: { padding: 16 } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text)' }}>
                  🎯 Candidate Hiring Readiness
                </span>
                <Tag color="success" style={{ fontWeight: 800, fontSize: 11, padding: '2px 8px', borderRadius: 6, margin: 0 }}>
                  🟢 HEALTHY • No Pending Blockers
                </Tag>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Overall Lifecycle Readiness:</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>96%</span>
                </div>
                <Progress percent={96} strokeColor="#10B981" showInfo={false} />
              </div>

              {/* Interactive Stage Checklist Chips */}
              <Row gutter={[8, 8]}>
                {[
                  { stage: 'Screening', status: 'Complete', path: '/recruitment/applications', isDone: true },
                  { stage: 'Technical Interview', status: 'Complete', path: '/recruitment/interviews', isDone: true },
                  { stage: 'HR Interview', status: 'Complete', path: '/recruitment/interviews', isDone: true },
                  { stage: 'Manager Interview', status: 'Complete', path: '/recruitment/interviews', isDone: true },
                  { stage: 'Offer Letter', status: 'Accepted', path: '/recruitment/offers', isDone: true },
                  { stage: 'Background Check', status: 'Cleared', path: '/recruitment/bgv', isDone: true },
                  { stage: 'Employee Onboarding', status: 'Waiting', path: '/recruitment/onboarding', isDone: false }
                ].map(item => (
                  <Col span={12} key={item.stage}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => navigate(item.path)}
                      style={{
                        borderRadius: 8,
                        border: item.isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                        background: item.isDone ? 'rgba(16, 185, 129, 0.03)' : 'rgba(245, 158, 11, 0.03)'
                      }}
                      styles={{ body: { padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{item.stage}</span>
                      <Tag color={item.isDone ? 'success' : 'warning'} style={{ margin: 0, fontWeight: 700, fontSize: 10, borderRadius: 4 }}>
                        {item.isDone ? '✔ ' : '⏳ '}{item.status}
                      </Tag>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>

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

            {/* Unified Recruitment Journey Timeline */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>📜 Unified Recruitment Journey Timeline</span>
                </div>
              }
              style={{
                background: 'var(--color-bg-container)',
                border: 'var(--border-glass)',
                borderRadius: 12,
                marginTop: 20
              }}
              styles={{ body: { padding: 16 } }}
            >
              {/* Timeline Category Filters */}
              <Space wrap size={[4, 4]} style={{ marginBottom: 16 }}>
                {['All', 'Recruitment', 'Interviews', 'Offers', 'Background Verification', 'Onboarding'].map(cat => (
                  <Button
                    key={cat}
                    size="small"
                    type={timelineFilter === cat ? 'primary' : 'default'}
                    onClick={() => setTimelineFilter(cat)}
                    style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}
                  >
                    {cat}
                  </Button>
                ))}
              </Space>

              <Timeline
                items={getUnifiedTimeline(selectedCandidate)
                  .filter(ev => timelineFilter === 'All' || ev.category === timelineFilter)
                  .map(ev => ({
                    color: ev.color,
                    children: (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--color-text)' }}>{ev.title}</span>
                          <span style={{ fontSize: 10.5, color: 'var(--color-text-secondary)' }}>{ev.time}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)', marginTop: 2 }}>{ev.description}</div>
                        <div style={{ fontSize: 10.5, opacity: 0.6, marginTop: 2 }}>Actor: <strong>{ev.actor}</strong></div>
                      </div>
                    )
                  }))}
              />
            </Card>
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

      {/* Bulk Spreadsheet Import Modal */}
      <Modal
        title={
          <Space>
            <CloudUploadOutlined style={{ color: '#06B6D4' }} />
            <span>Import Candidate Profiles (CSV / Excel)</span>
          </Space>
        }
        open={importOpen}
        onCancel={() => {
          setImportOpen(false)
          setImportFile(null)
          setImportJobId(null)
          setPreviewRows([])
        }}
        width={850}
        footer={[
          <Button key="cancel" onClick={() => setImportOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<CloudUploadOutlined />}
            loading={importing}
            disabled={previewRows.length === 0 && !importFile}
            onClick={handleConfirmImport}
            style={{
              background: isDarkMode ? '#FAA71A' : '#11133F',
              borderColor: isDarkMode ? '#FAA71A' : '#11133F',
              color: isDarkMode ? '#11133F' : '#fff',
              fontWeight: 700
            }}
          >
            Confirm Import
          </Button>
        ]}
      >
        <div style={{ marginTop: 12 }}>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>1. Target Job Opening (Optional)</div>
              <Select
                placeholder="Directly apply candidates to job opening..."
                style={{ width: '100%' }}
                value={importJobId}
                onChange={v => setImportJobId(v)}
                allowClear
              >
                {publishedJobs.map(job => (
                  <Option key={job.jobId} value={job.jobId}>
                    {job.jobTitle} ({job.departmentName || 'General'})
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>2. Choose Spreadsheet File (.csv / .xlsx)</div>
              <Upload
                beforeUpload={() => false}
                onChange={handleImportFileChange}
                fileList={importFile ? [importFile] : []}
                maxCount={1}
                accept=".csv,.xlsx"
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} style={{ width: '100%', borderRadius: 6 }}>
                  {importFile ? importFile.name : 'Select CSV or Excel File'}
                </Button>
              </Upload>
            </Col>
          </Row>

          {importFile && (
            <Alert
              message={`File loaded: ${importFile.name}`}
              description={`${previewRows.length} candidate rows extracted. Review details below before completing import.`}
              type="info"
              showIcon
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
          )}

          {previewRows.length > 0 && (
            <Table
              dataSource={previewRows}
              columns={[
                { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 120 },
                { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', width: 120, render: v => v || '-' },
                { title: 'Email', dataIndex: 'email', key: 'email', width: 180 },
                { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 130, render: v => v || '-' },
                { title: 'Company', dataIndex: 'currentCompany', key: 'currentCompany', width: 140, render: v => v || '-' },
                { title: 'Designation', dataIndex: 'currentDesignation', key: 'currentDesignation', width: 140, render: v => v || '-' },
                { title: 'Exp (Yrs)', dataIndex: 'totalExperience', key: 'totalExperience', width: 90, render: v => v != null ? `${v}` : '-' }
              ]}
              rowKey={(r, idx) => r.email || idx.toString()}
              loading={loadingPreview}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 800 }}
              size="small"
            />
          )}
        </div>
      </Modal>

      {/* Summary Dialog */}
      <Modal
        open={resultModal !== null}
        onCancel={() => setResultModal(null)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setResultModal(null)}>
            Close
          </Button>
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
            <CheckCircleOutlined style={{ color: '#22C55E' }} />
            Bulk Candidate Import Completed
          </div>
        }
        width={600}
        destroyOnClose
      >
        {resultModal && (
          <div>
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={6} style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Total Rows</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{resultModal.totalRows}</div>
              </Col>
              <Col span={6} style={{ textAlign: 'center' }}>
                <div style={{ color: '#22C55E', fontSize: 12 }}>Imported</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#22C55E' }}>{resultModal.importedCount}</div>
              </Col>
              <Col span={6} style={{ textAlign: 'center' }}>
                <div style={{ color: '#FAA71A', fontSize: 12 }}>Skipped</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#FAA71A' }}>{resultModal.skippedCount}</div>
              </Col>
              <Col span={6} style={{ textAlign: 'center' }}>
                <div style={{ color: '#E94043', fontSize: 12 }}>Failed</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#E94043' }}>{resultModal.failedCount || 0}</div>
              </Col>
            </Row>

            {resultModal.errors?.length > 0 && (
              <div>
                <h4 style={{ fontWeight: 700, color: '#E94043', marginBottom: 8 }}>Skipped/Failed Rows & Explanations:</h4>
                <div style={{ maxHeight: 200, overflowY: 'auto', background: 'rgba(233,64,67,0.05)', border: '1px solid rgba(233,64,67,0.1)', padding: 12, borderRadius: 8 }}>
                  <List
                    size="small"
                    dataSource={resultModal.errors}
                    renderItem={err => (
                      <List.Item style={{ fontSize: 12, color: 'var(--color-text-muted)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        ⚠️ {err}
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Record Referral Drawer */}
      <Drawer
        title="Record Employee Referral"
        width={600}
        open={referralOpen}
        onClose={() => setReferralOpen(false)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setReferralOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              loading={referralSubmitting}
              onClick={() => referralForm.submit()}
              style={{
                background: isDarkMode ? '#FAA71A' : '#11133F',
                borderColor: isDarkMode ? '#FAA71A' : '#11133F',
                color: isDarkMode ? '#11133F' : '#fff'
              }}
            >
              Submit Referral
            </Button>
          </Space>
        }
      >
        <Form form={referralForm} layout="vertical" onFinish={handleReferralSubmit}>
          <Title level={5} style={{ marginBottom: 16 }}>Referral Metadata</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="jobId"
                label="Target Job Opening (Optional)"
              >
                <Select placeholder="Select job opening (leave blank to add to Candidate Database)" allowClear>
                  {publishedJobs.map(job => (
                    <Option key={job.jobId} value={job.jobId}>
                      {job.jobTitle}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="referralEmployeeId"
                label="Referring Employee"
                rules={[{ required: true, message: 'Please select referring employee' }]}
              >
                <Select
                  showSearch
                  placeholder="Type name to search..."
                  filterOption={false}
                  onSearch={handleSearchReferralEmployees}
                  notFoundContent={null}
                >
                  {referralEmployees.map(emp => (
                    <Option key={emp.employeeId} value={emp.employeeId}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />
          <Title level={5} style={{ marginBottom: 16 }}>Candidate Personal Details</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'First name is required' }]}
              >
                <Input placeholder="John" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name">
                <Input placeholder="Doe" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}
              >
                <Input placeholder="john.doe@example.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input placeholder="+91 9876543210" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />
          <Title level={5} style={{ marginBottom: 16 }}>Professional Details</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="currentCompany" label="Current Company">
                <Input placeholder="Acme Corp" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currentDesignation" label="Current Designation">
                <Input placeholder="Software Engineer" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="totalExperience" label="Experience (Yrs)">
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currentCTC" label="Current CTC (LPA)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="expectedCTC" label="Expected CTC (LPA)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="noticePeriodDays" label="Notice Period (Days)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Resume file">
                <Upload
                  beforeUpload={file => { setReferralResume(file); return false }}
                  onRemove={() => setReferralResume(null)}
                  maxCount={1}
                  accept=".pdf,.doc,.docx"
                  fileList={referralResume ? [{ uid: '-1', name: referralResume.name, status: 'done' }] : []}
                >
                  <Button icon={<UploadOutlined />} style={{ width: '100%' }}>Choose Resume File</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* AI Resume Parser Showcase Modal */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: '#FAA71A', fontSize: 20 }} />
            <span style={{ fontWeight: 700 }}>AI Resume Parser — Automated CV Extraction</span>
            <Tag color="gold" style={{ marginLeft: 4, fontWeight: 700 }}>Phase 5 Preview</Tag>
          </Space>
        }
        open={parserModalOpen}
        onCancel={() => setParserModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setParserModalOpen(false)} style={{ background: '#11133F', borderColor: '#11133F', color: '#fff', fontWeight: 700, borderRadius: 6 }}>
            Got it
          </Button>
        ]}
        width={600}
      >
        <div style={{ padding: '12px 0' }}>
          <Alert
            type="info"
            showIcon
            message="Enterprise AI Feature Coming in Phase 5"
            description="Our upcoming AI Resume Parsing engine will automatically parse uploaded PDF, Word, and text resumes to instantly populate structured candidate profiles with zero manual data entry."
            style={{ marginBottom: 20, borderRadius: 10 }}
          />

          <Title level={5} style={{ marginBottom: 12 }}>Automated Extraction Capabilities:</Title>
          <Row gutter={[12, 12]}>
            {[
              { label: 'Full Name & Contacts', desc: 'First Name, Last Name, Email & Mobile Phone' },
              { label: 'Work Experience', desc: 'Total & Relevant Years of Experience' },
              { label: 'Technical Skills', desc: 'Languages, Frameworks & Industry Competencies' },
              { label: 'Education Details', desc: 'Highest Qualification & Specializations' },
              { label: 'Current Employment', desc: 'Company Name, Designation & Notice Period' },
              { label: 'Compensation Metrics', desc: 'Current CTC & Expected CTC Figures' }
            ].map(item => (
              <Col span={12} key={item.label}>
                <Card size="small" style={{ borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#FAA71A', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>{item.desc}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>
    </div>
  )
}
