import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tabs, Avatar, Button, Tag, Descriptions, Card, Table, Skeleton, Space,
  Modal, Select, notification, Popconfirm, Timeline, Form, Input, DatePicker,
  Row, Col, Progress, Tooltip, Spin, InputNumber
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, CheckCircleOutlined,
  FileOutlined, BankOutlined, HistoryOutlined, UserOutlined,
  PlusOutlined, DeleteOutlined, BookOutlined, ApartmentOutlined,
  CalendarOutlined, MailOutlined, HomeOutlined,
  SecurityScanOutlined, BuildOutlined, EnvironmentOutlined,
  ArrowDownOutlined, UploadOutlined, DownloadOutlined,
  EyeOutlined, CreditCardOutlined, SafetyCertificateOutlined,
  CameraOutlined, TeamOutlined, DollarOutlined, IdcardOutlined,
  BranchesOutlined, TrophyOutlined, CheckOutlined, SolutionOutlined, AuditOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import { employeeService } from '../../services/employeeService'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import EmptyState from '../../components/common/EmptyState'
import { EMPLOYMENT_STATUS, EMPLOYMENT_TYPE, WORK_MODE, WEEKLY_OFF_PATTERN, PAYROLL_GROUP, BANK_LIST } from '../../constants/enums'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS, ROLES } from '../../constants/permissions'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'
import { VALIDATORS, NORMALIZE, FILTER_KEYPRESS } from '../../constants/validation'
import { getAvatarUrl } from '../../constants/api'
// ── Document type registry ────────────────────────────────────────────────────
const DOC_TYPES = [
  { key: 'Aadhar', label: 'Aadhaar Card', enumVal: 0, strVal: 'Aadhar' },
  { key: 'PAN', label: 'PAN Card', enumVal: 1, strVal: 'PAN' },
  { key: 'Passport', label: 'Passport', enumVal: 2, strVal: 'Passport' },
  { key: 'OfferLetter', label: 'Offer Letter', enumVal: 5, strVal: 'OfferLetter' },
  { key: 'AppointmentLetter', label: 'Appointment Letter', enumVal: 6, strVal: 'AppointmentLetter' },
  { key: 'RelievingLetter', label: 'Relieving Letter', enumVal: 8, strVal: 'RelievingLetter' },
  { key: 'ExperienceLetter', label: 'Experience Letter', enumVal: 9, strVal: 'ExperienceLetter' },
  { key: 'EducationCertificate', label: 'Degree Certificate', enumVal: 10, strVal: 'EducationCertificate' },
  { key: 'BankStatement', label: 'Bank Passbook / Statement', enumVal: 11, strVal: 'BankStatement' },
  { key: 'Photo', label: 'Profile Photo', enumVal: 12, strVal: 'Photo' },
  { key: 'MedicalFitnessCertificate', label: 'Medical Fitness Certificate', enumVal: 13, strVal: 'MedicalFitnessCertificate' },
  { key: 'PoliceVerification', label: 'Police Verification Certificate', enumVal: 14, strVal: 'PoliceVerification' },
  { key: 'CategoryCertificate', label: 'Category Certificate', enumVal: 15, strVal: 'CategoryCertificate' },
  { key: 'NDA', label: 'NDA', enumVal: 16, strVal: 'NDA' },
  { key: 'DrugTestReport', label: 'Drug Test Report', enumVal: 17, strVal: 'DrugTestReport' },
  { key: 'Other', label: 'Other Document', enumVal: 18, strVal: 'Other' },
]

const RELATIONSHIP_OPTIONS = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Child', label: 'Child' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Grandparent', label: 'Grandparent' },
  { value: 'Other', label: 'Other' },
]

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Current', label: 'Current' },
  { value: 'Salary', label: 'Salary' },
]

// ── Avatar palette ────────────────────────────────────────────────────────────
const AVATAR_PALETTE = [
  'linear-gradient(135deg, #10113F 0%, #1e1f6a 100%)',
  'linear-gradient(135deg, #861630 0%, #a82041 100%)',
  'linear-gradient(135deg, #4D1B3B 0%, #6e2754 100%)',
  'linear-gradient(135deg, #FAA71A 0%, #f7c358 100%)',
  'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)',
]
const AVATAR_TEXT = ['#fff', '#fff', '#fff', '#10113F', '#fff']
function hashIdx(s = '') {
  let h = 0; for (let i = 0; i < s.length; i++) { h = s.charCodeAt(i) + ((h << 5) - h); h = h & h }
  return Math.abs(h) % AVATAR_PALETTE.length
}

// ── Profile completion calculator ─────────────────────────────────────────────
function calcCompletion(emp, docs = [], banks = [], educations = [], experiences = [], nominees = []) {
  const checks = [
    { label: 'Photo', ok: !!emp?.profilePhoto },
    { label: 'PAN', ok: !!emp?.maskedPAN },
    { label: 'Aadhaar', ok: !!emp?.maskedAadhar },
    { label: 'Emergency Contact', ok: !!emp?.emergencyContactName && !!emp?.emergencyContactPhone },
    { label: 'Address', ok: !!emp?.permanentAddress || !!emp?.currentAddress },
    { label: 'Date of Birth', ok: !!emp?.dateOfBirth },
    { label: 'Bank Details', ok: banks.length > 0 },
    { label: 'Education', ok: educations.length > 0 },
    { label: 'Experience', ok: experiences.length > 0 },
    { label: 'PF Nominees', ok: nominees.length > 0 },
    { label: 'Documents', ok: docs.length > 0 },
    { label: 'Blood Group', ok: !!emp?.bloodGroup },
  ]
  const filled = checks.filter(c => c.ok).length
  return { pct: Math.round((filled / checks.length) * 100), checks }
}

export default function EmployeeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isDarkMode } = useUIStore()
  const queryClient = useQueryClient()
  const { can, isSuperAdmin, isAnyRole } = usePermission()
  const isAdmin = isSuperAdmin || isAnyRole(ROLES.SUPER_ADMIN, ROLES.HR_ADMIN, ROLES.HR_MANAGER, ROLES.PAYROLL_ADMIN)
  const hasPayrollView = isSuperAdmin || can(PERMISSIONS.PAYROLL.VIEW)
  const showBankTab = isAdmin

  const maskAadhar = (val) => {
    if (!val) return '—'
    if (isAdmin) return val
    const cleaned = val.replace(/\D/g, '')
    if (cleaned.length >= 4) {
      return '********' + cleaned.slice(-4)
    }
    return val
  }

  const maskPAN = (val) => {
    if (!val) return '—'
    if (isAdmin) return val
    if (val.length >= 6) {
      return val.slice(0, 5) + '****' + val.slice(-1)
    }
    return val
  }

  const maskBankAcc = (val) => {
    if (!val) return '—'
    if (isAdmin) return val
    const cleaned = val.replace(/\D/g, '')
    if (cleaned.length >= 4) {
      return '******' + cleaned.slice(-4)
    }
    return val
  }

  const [docModal, setDocModal] = useState({ open: false, docType: null })
  const [docForm] = Form.useForm()
  const [selectedFile, setSelectedFile] = useState(null)
  const photoRef = useRef(null)

  // Modal states
  const [bankModal, setBankModal] = useState({ open: false, editing: null })
  const [eduModal, setEduModal] = useState({ open: false, editing: null })
  const [expModal, setExpModal] = useState({ open: false, editing: null })
  const [nomineeModal, setNomineeModal] = useState({ open: false, editing: null })
  const [statusModal, setStatusModal] = useState(false)
  const [bankForm] = Form.useForm()
  const [eduForm] = Form.useForm()
  const [expForm] = Form.useForm()
  const [nomineeForm] = Form.useForm()

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: emp, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getEmployee(id),
    select: (res) => res?.data,
  })

  const { data: docs = [] } = useQuery({
    queryKey: ['employee-docs', id],
    queryFn: () => employeeService.getDocuments(id),
    select: (res) => res?.data || [],
    enabled: !!id,
  })

  const { data: banks = [] } = useQuery({
    queryKey: ['employee-banks', id],
    queryFn: () => employeeService.getBankDetails(id),
    select: (res) => res?.data || [],
    enabled: !!id,
  })

  const { data: salaryHistory = [] } = useQuery({
    queryKey: ['salary-history', id],
    queryFn: () => employeeService.getSalaryHistory(id),
    select: (res) => res?.data || [],
    enabled: !!id,
  })

  const { data: educations = [], isLoading: eduLoading } = useQuery({
    queryKey: ['employee-educations', id],
    queryFn: () => employeeService.getEducations(id),
    select: (res) => res?.data || [],
    enabled: !!id,
  })

  const { data: experiences = [], isLoading: expLoading } = useQuery({
    queryKey: ['employee-experiences', id],
    queryFn: () => employeeService.getExperiences(id),
    select: (res) => res?.data || [],
    enabled: !!id,
  })

  const { data: nominees = [], isLoading: nomLoading } = useQuery({
    queryKey: ['employee-nominees', id],
    queryFn: () => employeeService.getNominees(id),
    select: (res) => res?.data || [],
    enabled: !!id,
  })

  const { data: allEmpsRes } = useQuery({
    queryKey: ['all-employees-list-details'],
    queryFn: () => employeeService.getEmployees({ pageSize: 10000 }),
  })
  const allEmployees = allEmpsRes?.data || []

  const invalidate = (keys) => keys.forEach(k => queryClient.invalidateQueries({ queryKey: k }))

  // ── Mutations ─────────────────────────────────────────────────────────────
  const confirmMutation = useMutation({
    mutationFn: () => employeeService.confirmEmployee(id),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Employment Confirmed',
          description: 'Employee has been successfully confirmed.',
          placement: 'topRight'
        })
        invalidate([['employee', id]])
      }
      else {
        notification.error({
          message: 'Confirmation Failed',
          description: res.message || 'Unable to confirm employee.',
          placement: 'topRight'
        })
      }
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status) => employeeService.updateStatus(id, status),
    onSuccess: () => {
      notification.success({
        message: 'Status Updated',
        description: 'The employment status has been successfully updated.',
        placement: 'topRight'
      })
      setStatusModal(false)
      invalidate([['employee', id], ['employees']])
    },
    onError: () => {
      notification.error({
        message: 'Update Failed',
        description: 'Failed to update employment status.',
        placement: 'topRight'
      })
    },
  })

  const photoMutation = useMutation({
    mutationFn: (file) => employeeService.uploadPhoto(id, file),
    onSuccess: (res) => {
      notification.success({
        message: 'Photo Uploaded',
        description: 'Profile photo has been updated.',
        placement: 'topRight'
      })
      const { user } = useAuthStore.getState()
      if (user && user.employeeId === id && res?.success && res.data) {
        useAuthStore.getState().updateUser({ profilePhoto: res.data })
      }
      invalidate([['employee', id]])
    },
    onError: () => {
      notification.error({
        message: 'Upload Failed',
        description: 'Failed to upload profile photo.',
        placement: 'topRight'
      })
    },
  })

  const verifyDocMutation = useMutation({
    mutationFn: ({ docId }) => employeeService.verifyDocument(id, docId),
    onSuccess: () => {
      notification.success({
        message: 'Document Verified',
        description: 'The document status has been updated to verified.',
        placement: 'topRight'
      })
      invalidate([['employee-docs', id]])
    },
    onError: () => {
      notification.error({
        message: 'Verification Failed',
        description: 'Failed to verify document.',
        placement: 'topRight'
      })
    },
  })

  const uploadDocMutation = useMutation({
    mutationFn: ({ file, docType, documentNumber, expiryDate, remarks }) =>
      employeeService.uploadDocument(id, file, docType, documentNumber, expiryDate, remarks),
    onSuccess: () => {
      notification.success({
        message: 'Upload Complete',
        description: 'Document uploaded successfully.',
        placement: 'topRight'
      })
      setDocModal({ open: false, docType: null })
      docForm.resetFields()
      setSelectedFile(null)
      invalidate([['employee-docs', id]])
    },
    onError: () => {
      notification.error({
        message: 'Upload Failed',
        description: 'Failed to upload document.',
        placement: 'topRight'
      })
    }
  })

  // Bank mutations
  const addBankMutation = useMutation({
    mutationFn: (payload) => employeeService.addBankDetail(id, payload),
    onSuccess: () => {
      notification.success({
        message: 'Bank Account Saved',
        description: 'Bank account details have been successfully saved.',
        placement: 'topRight'
      })
      setBankModal({ open: false, editing: null })
      bankForm.resetFields()
      invalidate([['employee-banks', id]])
    },
    onError: () => {
      notification.error({
        message: 'Save Failed',
        description: 'Failed to save bank account details.',
        placement: 'topRight'
      })
    },
  })

  const deleteBankMutation = useMutation({
    mutationFn: (bankId) => employeeService.deleteBankDetail(id, bankId),
    onSuccess: () => {
      notification.success({
        message: 'Account Removed',
        description: 'Bank account details removed successfully.',
        placement: 'topRight'
      })
      invalidate([['employee-banks', id]])
    },
    onError: () => {
      notification.error({
        message: 'Removal Failed',
        description: 'Failed to remove bank account.',
        placement: 'topRight'
      })
    },
  })

  // Education mutations
  const addEduMutation = useMutation({
    mutationFn: (payload) => employeeService.addEducation(id, payload),
    onSuccess: () => {
      notification.success({
        message: 'Education Added',
        description: 'Academic qualification record added successfully.',
        placement: 'topRight'
      })
      setEduModal({ open: false, editing: null })
      eduForm.resetFields()
      invalidate([['employee-educations', id]])
    },
    onError: () => {
      notification.error({
        message: 'Save Failed',
        description: 'Failed to save academic qualification.',
        placement: 'topRight'
      })
    },
  })
  const updateEduMutation = useMutation({
    mutationFn: ({ eduId, payload }) => employeeService.updateEducation(id, eduId, payload),
    onSuccess: () => {
      notification.success({
        message: 'Education Updated',
        description: 'Academic qualification record updated.',
        placement: 'topRight'
      })
      setEduModal({ open: false, editing: null })
      eduForm.resetFields()
      invalidate([['employee-educations', id]])
    },
    onError: () => {
      notification.error({
        message: 'Update Failed',
        description: 'Failed to update academic qualification.',
        placement: 'topRight'
      })
    },
  })
  const deleteEduMutation = useMutation({
    mutationFn: (eduId) => employeeService.deleteEducation(id, eduId),
    onSuccess: () => {
      notification.success({
        message: 'Record Deleted',
        description: 'Academic qualification record deleted.',
        placement: 'topRight'
      })
      invalidate([['employee-educations', id]])
    },
    onError: () => {
      notification.error({
        message: 'Delete Failed',
        description: 'Failed to delete academic qualification.',
        placement: 'topRight'
      })
    },
  })

  // Experience mutations
  const addExpMutation = useMutation({
    mutationFn: (payload) => employeeService.addExperience(id, payload),
    onSuccess: () => {
      notification.success({
        message: 'Experience Added',
        description: 'Work experience record saved successfully.',
        placement: 'topRight'
      })
      setExpModal({ open: false, editing: null })
      expForm.resetFields()
      invalidate([['employee-experiences', id]])
    },
    onError: () => {
      notification.error({
        message: 'Save Failed',
        description: 'Failed to save experience record.',
        placement: 'topRight'
      })
    },
  })
  const updateExpMutation = useMutation({
    mutationFn: ({ expId, payload }) => employeeService.updateExperience(id, expId, payload),
    onSuccess: () => {
      notification.success({
        message: 'Experience Updated',
        description: 'Work experience record updated.',
        placement: 'topRight'
      })
      setExpModal({ open: false, editing: null })
      expForm.resetFields()
      invalidate([['employee-experiences', id]])
    },
    onError: () => {
      notification.error({
        message: 'Update Failed',
        description: 'Failed to update experience record.',
        placement: 'topRight'
      })
    },
  })
  const deleteExpMutation = useMutation({
    mutationFn: (expId) => employeeService.deleteExperience(id, expId),
    onSuccess: () => {
      notification.success({
        message: 'Record Deleted',
        description: 'Work experience record deleted.',
        placement: 'topRight'
      })
      invalidate([['employee-experiences', id]])
    },
    onError: () => {
      notification.error({
        message: 'Delete Failed',
        description: 'Failed to delete experience record.',
        placement: 'topRight'
      })
    },
  })

  // Nominee mutations
  const addNomMutation = useMutation({
    mutationFn: (payload) => employeeService.addNominee(id, payload),
    onSuccess: () => {
      notification.success({
        message: 'Nominee Added',
        description: 'PF nominee details saved.',
        placement: 'topRight'
      })
      setNomineeModal({ open: false, editing: null })
      nomineeForm.resetFields()
      invalidate([['employee-nominees', id]])
    },
    onError: () => {
      notification.error({
        message: 'Save Failed',
        description: 'Failed to save nominee details.',
        placement: 'topRight'
      })
    },
  })
  const updateNomMutation = useMutation({
    mutationFn: ({ nomineeId, payload }) => employeeService.updateNominee(id, nomineeId, payload),
    onSuccess: () => {
      notification.success({
        message: 'Nominee Updated',
        description: 'PF nominee details updated.',
        placement: 'topRight'
      })
      setNomineeModal({ open: false, editing: null })
      nomineeForm.resetFields()
      invalidate([['employee-nominees', id]])
    },
    onError: () => {
      notification.error({
        message: 'Update Failed',
        description: 'Failed to update nominee details.',
        placement: 'topRight'
      })
    },
  })
  const deleteNomMutation = useMutation({
    mutationFn: (nomineeId) => employeeService.deleteNominee(id, nomineeId),
    onSuccess: () => {
      notification.success({
        message: 'Nominee Removed',
        description: 'PF nominee record removed.',
        placement: 'topRight'
      })
      invalidate([['employee-nominees', id]])
    },
    onError: () => {
      notification.error({
        message: 'Delete Failed',
        description: 'Failed to delete nominee.',
        placement: 'topRight'
      })
    },
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      notification.warning({
        message: 'Invalid Image',
        description: 'Only JPG, PNG or WebP images are allowed.',
        placement: 'topRight'
      })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      notification.warning({
        message: 'Image Too Large',
        description: 'File size must be under 5 MB.',
        placement: 'topRight'
      })
      return
    }
    photoMutation.mutate(file)
  }

  const openDocUploadModal = (docTypeStrVal) => {
    setDocModal({ open: true, docType: docTypeStrVal })
    docForm.resetFields()
    setSelectedFile(null)
  }

  const handleEduSubmit = (values) => {
    const payload = { ...values, passingYear: values.passingYear ? parseInt(values.passingYear) : null }
    if (eduModal.editing) updateEduMutation.mutate({ eduId: eduModal.editing.eduId, payload })
    else addEduMutation.mutate(payload)
  }

  const handleExpSubmit = (values) => {
    const payload = {
      ...values,
      fromDate: values.fromDate?.format('YYYY-MM-DD'),
      toDate: values.toDate ? values.toDate.format('YYYY-MM-DD') : null,
    }
    if (expModal.editing) updateExpMutation.mutate({ expId: expModal.editing.expId, payload })
    else addExpMutation.mutate(payload)
  }

  const handleNomineeSubmit = (values) => {
    const payload = { ...values, dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null }
    // Validate total %
    const currentTotal = nominees.reduce((s, n) => s + Number(n.percentage), 0)
    const editingPct = nomineeModal.editing ? Number(nomineeModal.editing.percentage) : 0
    const newTotal = currentTotal - editingPct + Number(payload.percentage)
    if (newTotal > 100) {
      notification.error({
        message: 'Invalid Nominee Allocation',
        description: `Total nominee share cannot exceed 100%. Current total is ${currentTotal - editingPct}%, trying to add ${payload.percentage}% (would be ${newTotal}%).`,
        placement: 'topRight'
      })
      return
    }
    if (nomineeModal.editing) updateNomMutation.mutate({ nomineeId: nomineeModal.editing.nomineeId, payload })
    else addNomMutation.mutate(payload)
  }

  const openEduModal = (record = null) => {
    setEduModal({ open: true, editing: record })
    eduForm.setFieldsValue(record ? {
      degree: record.degree, institution: record.institution,
      university: record.university, passingYear: record.passingYear,
      percentage: record.percentage, isHighest: record.isHighest
    } : {})
  }

  const openExpModal = (record = null) => {
    setExpModal({ open: true, editing: record })
    expForm.setFieldsValue(record ? {
      companyName: record.companyName, designation: record.designation,
      fromDate: record.fromDate ? dayjs(record.fromDate) : null,
      toDate: record.toDate ? dayjs(record.toDate) : null,
      reasonForLeaving: record.reasonForLeaving
    } : {})
  }

  const openNomineeModal = (record = null) => {
    setNomineeModal({ open: true, editing: record })
    nomineeForm.setFieldsValue(record ? {
      nomineeName: record.nomineeName, relationship: record.relationship,
      dateOfBirth: record.dateOfBirth ? dayjs(record.dateOfBirth) : null,
      percentage: record.percentage,
      aadharNumber: record.aadharNumber
    } : {})
  }

  const openBankModal = () => {
    setBankModal({ open: true, editing: null })
    bankForm.resetFields()
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ padding: 40 }}>
        <Skeleton active avatar paragraph={{ rows: 12 }} />
      </div>
    )
  }

  if (!emp) {
    return <EmptyState title="Employee not found" action={() => navigate('/employees')} actionLabel="Back to list" />
  }

  const fullName = `${emp.firstName}${emp.middleName ? ' ' + emp.middleName : ''} ${emp.lastName}`
  const directReports = allEmployees.filter(e => e.reportingManagerId === emp.employeeId)
  const managerObj = allEmployees.find(e => e.employeeId === emp.reportingManagerId)
  const l2ManagerObj = allEmployees.find(e => e.employeeId === emp.l2ReportingManagerId)
  const l3ManagerObj = allEmployees.find(e => e.employeeId === emp.l3ReportingManagerId)
  const l4ManagerObj = allEmployees.find(e => e.employeeId === emp.l4ReportingManagerId)
  const functionalManagerObj = allEmployees.find(e => e.employeeId === emp.functionalManagerId)
  const { pct: completionPct, checks: completionChecks } = calcCompletion(emp, docs, banks, educations, experiences, nominees)

  const findDoc = (typeKey) => {
    const t = DOC_TYPES.find(d => d.key === typeKey)
    if (!t) return null
    return docs.find(d =>
      d.docType === t.enumVal || d.docType === t.strVal ||
      d.docType?.toString() === t.enumVal.toString() || d.docType?.toString() === t.strVal
    )
  }

  const nomTotal = nominees.reduce((s, n) => s + Number(n.percentage), 0)

  const statusColor = {
    Active: '#52c41a', OnNotice: '#fa8c16', Separated: '#ff4d4f',
    Absconding: '#cf1322', OnLeave: '#1677ff', Suspended: '#722ed1'
  }

  const formatStructuredAddress = (prefix, sameFlag = false) => {
    const l1 = emp[`${prefix}AddressLine1`]
    const l2 = emp[`${prefix}AddressLine2`]
    const city = emp[`${prefix}City`]
    const dist = emp[`${prefix}District`]
    const taluka = emp[`${prefix}Taluka`]
    const state = emp[`${prefix}State`]
    const pin = emp[`${prefix}Pincode`]

    if (!l1 && !city && !state) {
      return emp[`${prefix}Address`] || '—'
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div>{l1}{l2 ? `, ${l2}` : ''}</div>
        <div>
          {taluka ? `${taluka}, ` : ''}{city}{dist ? ` (${dist} District)` : ''}
        </div>
        <div>
          {state} - <strong>{pin}</strong>
        </div>
        {sameFlag && <Tag color="blue" style={{ marginTop: 6, width: 'fit-content' }}>Same as Permanent Address</Tag>}
      </div>
    )
  }

  // ── TAB: Overview ─────────────────────────────────────────────────────────
  const OverviewTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card title={<span><UserOutlined style={{ marginRight: 8 }} />Personal Information</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Title">{emp.title || '—'}</Descriptions.Item>
          <Descriptions.Item label="Employee ID">{emp.employeeCode || '—'}</Descriptions.Item>
          <Descriptions.Item label="Employee Category">{emp.employeeCategory || 'MPOnline Employee'}</Descriptions.Item>
          <Descriptions.Item label="Aadhaar Name">{emp.fullNameAadhaar || '—'}</Descriptions.Item>
          <Descriptions.Item label="Father's Name">{emp.fatherName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Mother Tongue">{emp.motherTongue || '—'}</Descriptions.Item>
          <Descriptions.Item label="Date of Birth">{emp.dateOfBirth ? dayjs(emp.dateOfBirth).format('DD MMM YYYY') : '—'}</Descriptions.Item>
          <Descriptions.Item label="Gender">{emp.gender || '—'}</Descriptions.Item>
          <Descriptions.Item label="Category">{emp.category || '—'}</Descriptions.Item>
          <Descriptions.Item label="Religion">{emp.religion || '—'}</Descriptions.Item>
          <Descriptions.Item label="Blood Group">{emp.bloodGroup || '—'}</Descriptions.Item>
          <Descriptions.Item label="Marital Status">{emp.maritalStatus || '—'}</Descriptions.Item>

          {emp.maritalStatus === 'Married' && (
            <>
              <Descriptions.Item label="Spouse Name">{emp.spouseName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Marriage Date">{emp.marriageDate ? dayjs(emp.marriageDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
            </>
          )}

          <Descriptions.Item label="Number of Dependents">{emp.numberOfDependents !== undefined && emp.numberOfDependents !== null ? emp.numberOfDependents : '—'}</Descriptions.Item>
          <Descriptions.Item label="Nationality">{emp.nationality || '—'}</Descriptions.Item>
          <Descriptions.Item label="PwD Status">{emp.pwdStatus || '—'}</Descriptions.Item>
          <Descriptions.Item label="PwD Certificate Number">{emp.pwdCertificateNo || '—'}</Descriptions.Item>
          <Descriptions.Item label="Domicile State">{emp.domicileState || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<span><HomeOutlined style={{ marginRight: 8 }} />Address Details</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Permanent Address" span={2}>
            {formatStructuredAddress('permanent')}
          </Descriptions.Item>
          <Descriptions.Item label="Current Address" span={2}>
            {formatStructuredAddress('current', emp.sameAddressFlag)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<span><MailOutlined style={{ marginRight: 8 }} />Contact Details</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Official Email">{emp.officialEmail || '—'}</Descriptions.Item>
          <Descriptions.Item label="Personal Email">{emp.personalEmail || '—'}</Descriptions.Item>
          <Descriptions.Item label="Mobile Number">
            {emp.personalPhone ? <a href={`tel:${emp.personalPhone}`}>{emp.personalPhone}</a> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Official Mobile">
            {emp.officialMobile ? <a href={`tel:${emp.officialMobile}`}>{emp.officialMobile}</a> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Alternate Mobile">
            {emp.alternateMobile ? <a href={`tel:${emp.alternateMobile}`}>{emp.alternateMobile}</a> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="WhatsApp Number">
            {emp.whatsAppNumber ? <a href={`https://wa.me/91${emp.whatsAppNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{emp.whatsAppNumber}</a> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Extension Number" span={2}>{emp.extensionNumber || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<span><TeamOutlined style={{ marginRight: 8 }} />Emergency Contacts</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Contact Name">{emp.emergencyContactName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Relationship">{emp.emergencyContactRelation || '—'}</Descriptions.Item>
          <Descriptions.Item label="Phone">
            {emp.emergencyContactPhone ? <a href={`tel:${emp.emergencyContactPhone}`}>{emp.emergencyContactPhone}</a> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Alt. Emergency Phone">
            {emp.alternateEmergencyContactPhone ? <a href={`tel:${emp.alternateEmergencyContactPhone}`}>{emp.alternateEmergencyContactPhone}</a> : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<span><IdcardOutlined style={{ marginRight: 8 }} />Government Identifiers</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="PAN Card"><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{maskPAN(emp.maskedPAN) || '—'}</span></Descriptions.Item>
          <Descriptions.Item label="Aadhaar Card"><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{maskAadhar(emp.maskedAadhar) || '—'}</span></Descriptions.Item>
          <Descriptions.Item label="UAN Number"><span style={{ fontFamily: 'monospace' }}>{emp.uanNumber || '—'}</span></Descriptions.Item>
          <Descriptions.Item label="ESI Number"><span style={{ fontFamily: 'monospace' }}>{emp.esiNumber || '—'}</span></Descriptions.Item>
          <Descriptions.Item label="Passport Number"><span style={{ fontFamily: 'monospace' }}>{emp.passportNumber || '—'}</span></Descriptions.Item>
          <Descriptions.Item label="Passport Expiry">{emp.passportExpiry ? dayjs(emp.passportExpiry).format('DD MMM YYYY') : '—'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )

  // ── TAB: Employment ───────────────────────────────────────────────────────
  const EmploymentTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Placement Hierarchy */}
      <Card title={<span><BuildOutlined style={{ marginRight: 8 }} />Organizational Placement</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Business Unit">{emp.businessUnitName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Division">{emp.divisionName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Department">{emp.departmentName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Sub-Department">{emp.subDeptName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Location">{emp.locationName || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 2. Job Architecture */}
      <Card title={<span><IdcardOutlined style={{ marginRight: 8 }} />Job Architecture & Classification</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Grade">{emp.gradeName || '—'} {emp.gradeCode ? `(${emp.gradeCode})` : ''}</Descriptions.Item>
          <Descriptions.Item label="Band / Level">{emp.bandName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Job Family">{emp.jobFamilyName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Job Function">{emp.jobFunctionName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Designation">{emp.designationTitle || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 3. Cost Accounting */}
      <Card title={<span><DollarOutlined style={{ marginRight: 8 }} />Cost & Profit Centers</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Cost Center">{emp.costCenterName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Profit Center">{emp.profitCenterName || '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 4. Shift & Work Settings */}
      <Card title={<span><CalendarOutlined style={{ marginRight: 8 }} />Work Mode & Shifts</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Work Mode">
            {emp.workMode ? <Tag color="green">{WORK_MODE.find(w => w.value === emp.workMode)?.label || emp.workMode}</Tag> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Shift">
            {emp.shiftName ? <Tag color="magenta">{emp.shiftName}</Tag> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Weekly Off Pattern">
            {emp.weeklyOffPattern ? <Tag color="blue">{WEEKLY_OFF_PATTERN.find(w => w.value === emp.weeklyOffPattern)?.label || emp.weeklyOffPattern}</Tag> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Notice Period">{emp.noticePeriodDays !== undefined ? `${emp.noticePeriodDays} Days` : '—'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 5. Classification & Status */}
      <Card title={<span><SafetyCertificateOutlined style={{ marginRight: 8 }} />Employment Status & Payroll</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Joining Date">{dayjs(emp.joiningDate).format('DD MMM YYYY')}</Descriptions.Item>
          <Descriptions.Item label="Confirmation Date">{emp.confirmationDate ? dayjs(emp.confirmationDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
          <Descriptions.Item label="Employment Type">
            {emp.employmentType ? <Tag color="orange">{EMPLOYMENT_TYPE.find(e => e.value === emp.employmentType)?.label || emp.employmentType}</Tag> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Employment Status"><StatusBadge status={emp.employmentStatus} /></Descriptions.Item>
          <Descriptions.Item label="Payroll Group">
            {emp.payrollGroup ? <Tag color="purple">{PAYROLL_GROUP.find(p => p.value === emp.payrollGroup)?.label || emp.payrollGroup}</Tag> : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Immediate Manager (L1)">
            {managerObj ? (
              <span style={{ cursor: 'pointer', textDecoration: 'underline', color: isDarkMode ? '#FAA71A' : '#10113F', fontWeight: 600 }}
                onClick={() => navigate(`/employees/${managerObj.employeeId}`)}>
                {managerObj.firstName} {managerObj.lastName}
              </span>
            ) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Senior Manager (L2)">
            {l2ManagerObj ? (
              <span style={{ cursor: 'pointer', textDecoration: 'underline', color: isDarkMode ? '#FAA71A' : '#10113F', fontWeight: 600 }}
                onClick={() => navigate(`/employees/${l2ManagerObj.employeeId}`)}>
                {l2ManagerObj.firstName} {l2ManagerObj.lastName}
              </span>
            ) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Department Head (L3)">
            {l3ManagerObj ? (
              <span style={{ cursor: 'pointer', textDecoration: 'underline', color: isDarkMode ? '#FAA71A' : '#10113F', fontWeight: 600 }}
                onClick={() => navigate(`/employees/${l3ManagerObj.employeeId}`)}>
                {l3ManagerObj.firstName} {l3ManagerObj.lastName}
              </span>
            ) : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Business Unit Head (L4)">
            {l4ManagerObj ? (
              <span style={{ cursor: 'pointer', textDecoration: 'underline', color: isDarkMode ? '#FAA71A' : '#10113F', fontWeight: 600 }}
                onClick={() => navigate(`/employees/${l4ManagerObj.employeeId}`)}>
                {l4ManagerObj.firstName} {l4ManagerObj.lastName}
              </span>
            ) : '—'}
          </Descriptions.Item>
          {emp.employmentType === 'Contract' && (
            <Descriptions.Item label="Contract End Date" span={2}>
              <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                {emp.contractEndDate ? dayjs(emp.contractEndDate).format('DD MMM YYYY') : 'Not Set'}
              </span>
            </Descriptions.Item>
          )}
          {emp.employmentType === 'Intern' && (
            <Descriptions.Item label="Internship Duration" span={2}>
              {emp.internshipDurationMonths ? `${emp.internshipDurationMonths} Months` : 'Not Set'}
            </Descriptions.Item>
          )}
          {emp.employmentType === 'Consultant' && (
            <Descriptions.Item label="Vendor Name" span={2}>
              {emp.vendorName || 'Not Specified'}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title={<span><CalendarOutlined style={{ marginRight: 8 }} />Probation & Confirmation</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
          <Descriptions.Item label="Probation End Date">{emp.probationEndDate ? dayjs(emp.probationEndDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
          <Descriptions.Item label="Status">
            {emp.confirmationDate
              ? <Tag color="success" icon={<CheckCircleOutlined />}>Confirmed</Tag>
              : <Tag color="processing">On Probation</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Note" span={2}>
            {emp.confirmationDate
              ? `Confirmed on ${dayjs(emp.confirmationDate).format('DD MMM YYYY')}.`
              : `Probation in progress. End date: ${emp.probationEndDate ? dayjs(emp.probationEndDate).format('DD MMM YYYY') : 'N/A'}.`}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )

  // ── TAB: Reporting Structure ───────────────────────────────────────────────

  const ReportingTab = (
    <Card title={<span><BranchesOutlined style={{ marginRight: 8 }} />Reporting Hierarchy</span>}
      style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', padding: '16px 0' }}>
      <Row gutter={[24, 24]}>
        {/* Line Hierarchy Column */}
        <Col xs={24} md={16} style={{ borderRight: isDarkMode ? '1px solid rgba(160, 90, 255, 0.18)' : '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Business Unit Head (L4) */}
            {l4ManagerObj && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 8, width: 290 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Business Unit Head (L4)</div>
                  <motion.div whileHover={{ y: -3 }} onClick={() => navigate(`/employees/${l4ManagerObj.employeeId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 14, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0', cursor: 'pointer' }}>
                    <Avatar src={getAvatarUrl(l4ManagerObj.profilePhoto)} style={{ background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff' }}>
                      {l4ManagerObj.firstName?.[0]}{l4ManagerObj.lastName?.[0]}
                    </Avatar>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text-primary)' }}>{l4ManagerObj.firstName} {l4ManagerObj.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{l4ManagerObj.designationTitle}</div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{l4ManagerObj.employeeCode}</div>
                    </div>
                  </motion.div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 30 }}>
                  <div style={{ width: 2, flex: 1, background: '#FAA71A' }} />
                  <ArrowDownOutlined style={{ color: '#FAA71A', fontSize: 12, marginTop: -6 }} />
                </div>
              </>
            )}

            {/* Department Head (L3) */}
            {l3ManagerObj && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 8, width: 290 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Department Head (L3)</div>
                  <motion.div whileHover={{ y: -3 }} onClick={() => navigate(`/employees/${l3ManagerObj.employeeId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 14, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0', cursor: 'pointer' }}>
                    <Avatar src={getAvatarUrl(l3ManagerObj.profilePhoto)} style={{ background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff' }}>
                      {l3ManagerObj.firstName?.[0]}{l3ManagerObj.lastName?.[0]}
                    </Avatar>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text-primary)' }}>{l3ManagerObj.firstName} {l3ManagerObj.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{l3ManagerObj.designationTitle}</div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{l3ManagerObj.employeeCode}</div>
                    </div>
                  </motion.div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 30 }}>
                  <div style={{ width: 2, flex: 1, background: '#FAA71A' }} />
                  <ArrowDownOutlined style={{ color: '#FAA71A', fontSize: 12, marginTop: -6 }} />
                </div>
              </>
            )}

            {/* Senior Manager (L2) */}
            {l2ManagerObj && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 8, width: 290 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Senior Manager (L2)</div>
                  <motion.div whileHover={{ y: -3 }} onClick={() => navigate(`/employees/${l2ManagerObj.employeeId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 14, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0', cursor: 'pointer' }}>
                    <Avatar src={getAvatarUrl(l2ManagerObj.profilePhoto)} style={{ background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff' }}>
                      {l2ManagerObj.firstName?.[0]}{l2ManagerObj.lastName?.[0]}
                    </Avatar>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text-primary)' }}>{l2ManagerObj.firstName} {l2ManagerObj.lastName}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{l2ManagerObj.designationTitle}</div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{l2ManagerObj.employeeCode}</div>
                    </div>
                  </motion.div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 30 }}>
                  <div style={{ width: 2, flex: 1, background: '#FAA71A' }} />
                  <ArrowDownOutlined style={{ color: '#FAA71A', fontSize: 12, marginTop: -6 }} />
                </div>
              </>
            )}

            {/* Immediate Manager (L1) */}
            <div style={{ textAlign: 'center', marginBottom: 8, width: 290 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Immediate Manager (L1)</div>
              {managerObj ? (
                <motion.div whileHover={{ y: -3 }} onClick={() => navigate(`/employees/${managerObj.employeeId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 14, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <Avatar src={getAvatarUrl(managerObj.profilePhoto)} style={{ background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff' }}>
                    {managerObj.firstName?.[0]}{managerObj.lastName?.[0]}
                  </Avatar>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text-primary)' }}>{managerObj.firstName} {managerObj.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{managerObj.designationTitle}</div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{managerObj.employeeCode}</div>
                  </div>
                </motion.div>
              ) : (
                <div style={{ padding: '12px 20px', background: isDarkMode ? 'rgba(140, 70, 255, 0.06)' : '#f1f5f9', borderRadius: 14, border: isDarkMode ? '1.5px dashed rgba(160, 90, 255, 0.3)' : '1.5px dashed #cbd5e1', color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>
                  Board of Directors (No Manager)
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 30 }}>
              <div style={{ width: 2, flex: 1, background: '#FAA71A' }} />
              <ArrowDownOutlined style={{ color: '#FAA71A', fontSize: 12, marginTop: -6 }} />
            </div>

            {/* Current employee */}
            <div style={{ textAlign: 'center', width: 320, margin: '8px 0' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Current Position</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', background: isDarkMode ? 'rgba(250, 167, 26, 0.15)' : 'rgba(250, 167, 26, 0.08)', borderRadius: 16, border: '2px solid #FAA71A', boxShadow: '0 8px 16px rgba(250, 167, 26, 0.1)' }}>
                <Avatar size={48} src={getAvatarUrl(emp.profilePhoto)} style={{ background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)', fontWeight: 700 }}>
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </Avatar>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-text-primary)' }}>{fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{emp.designationTitle}</div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{emp.employeeCode}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 30 }}>
              <div style={{ width: 2, flex: 1, background: '#FAA71A' }} />
              <ArrowDownOutlined style={{ color: '#FAA71A', fontSize: 12, marginTop: -6 }} />
            </div>

            {/* Direct reports */}
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>
                Direct Reports ({directReports.length})
              </div>
              {directReports.length > 0 ? (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {directReports.map((dr) => (
                    <motion.div key={dr.employeeId} whileHover={{ y: -3 }} onClick={() => navigate(`/employees/${dr.employeeId}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 12, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0', cursor: 'pointer', width: 240 }}>
                      <Avatar src={getAvatarUrl(dr.profilePhoto)} style={{ background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', fontWeight: 600 }}>
                        {dr.firstName?.[0]}{dr.lastName?.[0]}
                      </Avatar>
                      <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{dr.firstName} {dr.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{dr.designationTitle}</div>
                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{dr.employeeCode}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'inline-block', padding: '12px 24px', background: isDarkMode ? 'rgba(140, 70, 255, 0.06)' : '#f8fafc', borderRadius: 12, border: isDarkMode ? '1.5px dashed rgba(160, 90, 255, 0.3)' : '1.5px dashed #e2e8f0', color: 'var(--color-text-muted)', fontSize: 12 }}>
                  No direct reports assigned
                </div>
              )}
            </div>

          </div>
        </Col>

        {/* Functional Hierarchy Column */}
        <Col xs={24} md={8}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Functional Hierarchy</div>
            {functionalManagerObj ? (
              <div style={{ textAlign: 'center', marginBottom: 8, width: '100%' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Functional Manager</div>
                <motion.div whileHover={{ y: -3 }} onClick={() => navigate(`/employees/${functionalManagerObj.employeeId}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 14, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0', cursor: 'pointer' }}>
                  <Avatar src={getAvatarUrl(functionalManagerObj.profilePhoto)} style={{ background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff' }}>
                    {functionalManagerObj.firstName?.[0]}{functionalManagerObj.lastName?.[0]}
                  </Avatar>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text-primary)' }}>{functionalManagerObj.firstName} {functionalManagerObj.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{functionalManagerObj.designationTitle}</div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{functionalManagerObj.employeeCode}</div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <div style={{ padding: '16px 20px', background: isDarkMode ? 'rgba(140, 70, 255, 0.06)' : '#f8fafc', borderRadius: 14, border: isDarkMode ? '1.5px dashed rgba(160, 90, 255, 0.3)' : '1.5px dashed #cbd5e1', color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center', width: '100%' }}>
                No Functional Manager Assigned
              </div>
            )}

            {functionalManagerObj && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 30 }}>
                  <div style={{ width: 2, flex: 1, background: '#FAA71A' }} />
                  <ArrowDownOutlined style={{ color: '#FAA71A', fontSize: 12, marginTop: -6 }} />
                </div>

                {/* Current Employee Target */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 14, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0', opacity: 0.8 }}>
                    <Avatar src={getAvatarUrl(emp.profilePhoto)} style={{ background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)' }}>
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </Avatar>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text-primary)' }}>{fullName}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{emp.designationTitle}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </Col>
      </Row>
    </Card>
  )

  // ── TAB: Documents ────────────────────────────────────────────────────────
  const DocumentsTab = (
    <Card title={<span><FileOutlined style={{ marginRight: 8 }} />Document Center</span>}
      style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {DOC_TYPES.map((type) => {
          const doc = findDoc(type.key)
          let expiryTag = null;
          if (doc && doc.expiryDate) {
            const exp = dayjs(doc.expiryDate);
            const today = dayjs();
            const daysToExpiry = exp.diff(today, 'day');
            if (daysToExpiry < 0) {
              expiryTag = <Tag color="error" style={{ marginTop: 4 }}>Expired</Tag>;
            } else if (daysToExpiry <= 30) {
              expiryTag = <Tag color="warning" style={{ marginTop: 4 }}>Expiring in {daysToExpiry} days</Tag>;
            }
          }
          return (
            <Card key={type.key} type="inner"
              style={{ borderRadius: 12, border: doc ? '1px solid var(--color-border)' : (isDarkMode ? '1.5px dashed rgba(160, 90, 255, 0.25)' : '1.5px dashed #cbd5e1'), background: doc ? 'var(--color-card-bg-elevated)' : (isDarkMode ? 'rgba(140, 70, 255, 0.06)' : '#fafafa'), position: 'relative' }}
              styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28, color: doc ? '#FAA71A' : 'var(--color-text-muted)' }}><FileOutlined /></span>
                {doc ? (
                  doc.isVerified
                    ? <Tag color="success" style={{ margin: 0 }}><CheckCircleOutlined /> Verified</Tag>
                    : <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <Tag color="warning" style={{ margin: 0 }}>Pending</Tag>
                      {can(PERMISSIONS.EMPLOYEE.EDIT) && (
                        <Tooltip title="Verify document">
                          <Button size="small" type="text" icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            onClick={() => verifyDocMutation.mutate({ docId: doc.docId })} />
                        </Tooltip>
                      )}
                    </div>
                ) : <Tag style={{ margin: 0, background: isDarkMode ? 'rgba(140, 70, 255, 0.15)' : '#e2e8f0', color: isDarkMode ? 'rgba(200, 160, 255, 0.8)' : '#64748b', border: 'none' }}>Missing</Tag>}
              </div>
              <div>
                <strong style={{ fontSize: 13, color: 'var(--color-text-primary)', display: 'block' }}>{type.label}</strong>
                {doc && <span style={{ fontSize: 11, color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>{doc.docName}</span>}
                {doc && doc.documentNumber && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    No: {doc.documentNumber}
                  </div>
                )}
                {doc && doc.expiryDate && (
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Expires: {dayjs(doc.expiryDate).format('DD MMM YYYY')}
                  </div>
                )}
                {expiryTag && <div>{expiryTag}</div>}
                {doc && doc.remarks && (
                  <div style={{ fontSize: 10.5, fontStyle: 'italic', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    "{doc.remarks}"
                  </div>
                )}
                {doc && <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Uploaded {dayjs(doc.uploadedAt).format('DD MMM YYYY')}
                  {doc.isVerified && doc.verifiedAt && ` · Verified ${dayjs(doc.verifiedAt).format('DD MMM YYYY')}`}
                </div>}
              </div>
              <div style={{ borderTop: 'var(--border-glass)', paddingTop: 10, display: 'flex', gap: 6, marginTop: 'auto' }}>
                {doc ? (
                  <>
                    <Button size="small" icon={<DownloadOutlined />} style={{ flex: 1, borderRadius: 6 }}
                      onClick={() => {
                        const url = employeeService.getDocumentDownloadUrl(id, doc.docId)
                        window.open(url, '_blank')
                      }}>
                      Download
                    </Button>
                    {can(PERMISSIONS.EMPLOYEE.EDIT) && (
                      <Button size="small" icon={<UploadOutlined />} style={{ borderRadius: 6 }}
                        onClick={() => openDocUploadModal(type.strVal)}>
                        Replace
                      </Button>
                    )}
                  </>
                ) : can(PERMISSIONS.EMPLOYEE.EDIT) ? (
                  <Button size="small" icon={<UploadOutlined />} style={{ flex: 1, borderRadius: 6 }}
                    onClick={() => openDocUploadModal(type.strVal)}>
                    Upload
                  </Button>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', width: '100%', textAlign: 'center' }}>Read Only</span>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </Card>
  )

  // ── TAB: Bank Details ─────────────────────────────────────────────────────
  const BankTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* NPS and Previous PF Info */}
      {(emp.npspranNumber || emp.previousEmployerPFNumber) && (
        <Card title="Pension & PF Information" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
          <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
            <Descriptions.Item label="NPS PRAN Number"><span style={{ fontFamily: 'monospace' }}>{emp.npspranNumber || '—'}</span></Descriptions.Item>
            <Descriptions.Item label="Previous PF Number"><span style={{ fontFamily: 'monospace' }}>{emp.previousEmployerPFNumber || '—'}</span></Descriptions.Item>
          </Descriptions>
        </Card>
      )}
      {can(PERMISSIONS.EMPLOYEE.EDIT) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openBankModal}
            style={{ background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', borderRadius: 8, fontWeight: 600 }}>
            Add Bank Account
          </Button>
        </div>
      )}
      {banks.length > 0 ? (
        <Row gutter={[16, 16]}>
          {banks.map((b) => (
            <Col xs={24} md={16} lg={14} key={b.bankDetailId}>
              <div>
                <Card className="premium-bank-card" style={{ borderRadius: 16, overflow: 'hidden', height: 185 }}>
                  <div style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(250, 167, 26, 0.15)', filter: 'blur(30px)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Bank</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: '#ffffff' }}>{b.bankName}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 22, color: '#FAA71A' }}><CreditCardOutlined /></span>
                      {can(PERMISSIONS.EMPLOYEE.EDIT) && (
                        <Popconfirm title="Remove this bank account?" onConfirm={() => deleteBankMutation.mutate(b.bankDetailId)} okText="Remove" okButtonProps={{ danger: true }}>
                          <Button danger type="text" size="small" icon={<DeleteOutlined />}
                            style={{ color: 'rgba(255,80,80,0.9)', background: 'rgba(255,255,255,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 28, width: 28, padding: 0 }} />
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                  <div style={{ zIndex: 1 }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Account Number</div>
                    <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.08em', marginTop: 2, color: '#ffffff' }}>{maskBankAcc(b.maskedAccountNumber)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IFSC Code</span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: '#ffffff', marginTop: 2 }}>{b.ifscCode}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                      <Tag style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 9, border: 'none', margin: 0 }}>{b.accountType}</Tag>
                      {b.isPrimary && <Tag style={{ background: '#FAA71A', color: '#10113F', fontWeight: 700, border: 'none', fontSize: 9, margin: 0 }}>PRIMARY</Tag>}
                      {b.verificationStatus && (
                        <Tag color={
                          b.verificationStatus === 'Verified' ? 'success' :
                            b.verificationStatus === 'Failed' ? 'error' : 'warning'
                        } style={{ fontSize: 9, margin: 0, fontWeight: 700 }}>
                          {b.verificationStatus.toUpperCase()}
                        </Tag>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        <EmptyState
          title="No bank accounts added"
          description="Add a bank account for salary disbursement."
          action={can(PERMISSIONS.EMPLOYEE.EDIT) ? openBankModal : undefined}
          actionLabel="Add Bank Account"
        />
      )}
    </div>
  )

  // ── TAB: Education ────────────────────────────────────────────────────────
  const EducationTab = (
    <Card title={<span><BookOutlined style={{ marginRight: 8 }} />Academic Qualifications</span>}
      extra={can(PERMISSIONS.EMPLOYEE.EDIT) && (
        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => openEduModal()} style={{ borderRadius: 6 }}>Add Education</Button>
      )}
      style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
      {eduLoading ? <Spin /> : educations.length === 0 ? (
        <EmptyState
          title="No academic records found"
          description="Add degree or qualifications."
          action={can(PERMISSIONS.EMPLOYEE.EDIT) ? () => openEduModal() : undefined}
          actionLabel="Add Education"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {educations.map((edu) => (
            <div key={edu.eduId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 10, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{edu.degree}</h4>
                  {edu.isHighest && <Tag color="gold" style={{ fontSize: 10, lineHeight: '16px' }}>Highest</Tag>}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>{edu.institution}{edu.university ? ` · ${edu.university}` : ''}{edu.passingYear ? ` · ${edu.passingYear}` : ''}</p>
                {edu.percentage && <Tag style={{ background: '#FAA71A', color: '#10113F', fontWeight: 700, marginTop: 8, border: 'none', fontSize: 10 }}>{edu.percentage}%</Tag>}
              </div>
              {can(PERMISSIONS.EMPLOYEE.EDIT) && (
                <Space>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEduModal(edu)} />
                  <Popconfirm title="Delete this education record?" onConfirm={() => deleteEduMutation.mutate(edu.eduId)} okText="Delete" okButtonProps={{ danger: true }}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  // ── TAB: Experience ───────────────────────────────────────────────────────
  const ExperienceTab = (
    <Card title={<span><TrophyOutlined style={{ marginRight: 8 }} />Professional Experience</span>}
      extra={can(PERMISSIONS.EMPLOYEE.EDIT) && (
        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => openExpModal()} style={{ borderRadius: 6 }}>Add Experience</Button>
      )}
      style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
      {expLoading ? <Spin /> : experiences.length === 0 ? (
        <EmptyState
          title="No experience records found"
          description="Add past employment history."
          action={can(PERMISSIONS.EMPLOYEE.EDIT) ? () => openExpModal() : undefined}
          actionLabel="Add Experience"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {experiences.map((exp) => (
            <div key={exp.expId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 10, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{exp.designation || 'Employee'}</h4>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {exp.companyName} · {dayjs(exp.fromDate).format('MMM YYYY')} – {exp.toDate ? dayjs(exp.toDate).format('MMM YYYY') : 'Present'}
                </p>
                {exp.reasonForLeaving && <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--color-text-secondary)', borderLeft: '2px solid #FAA71A', paddingLeft: 8 }}>Reason: {exp.reasonForLeaving}</p>}
              </div>
              {can(PERMISSIONS.EMPLOYEE.EDIT) && (
                <Space>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openExpModal(exp)} />
                  <Popconfirm title="Delete this experience?" onConfirm={() => deleteExpMutation.mutate(exp.expId)} okText="Delete" okButtonProps={{ danger: true }}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  // ── TAB: PF Nominees ──────────────────────────────────────────────────────
  const NomineesTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Total allocation indicator */}
      <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>PF Share Allocation</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>Total must equal exactly 100% before finalizing</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: nomTotal === 100 ? '#52c41a' : nomTotal > 100 ? '#ff4d4f' : '#FAA71A' }}>{nomTotal}%</span>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>of 100%</div>
          </div>
        </div>
        <Progress percent={Math.min(nomTotal, 100)} showInfo={false}
          strokeColor={nomTotal === 100 ? '#52c41a' : nomTotal > 100 ? '#ff4d4f' : '#FAA71A'}
          trailColor={isDarkMode ? 'rgba(160, 90, 255, 0.2)' : '#e2e8f0'} />
        {nomTotal !== 100 && nominees.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#ff4d4f', fontWeight: 600 }}>
            ⚠ Total is {nomTotal}%. {nomTotal < 100 ? `Add ${100 - nomTotal}% more` : `Reduce by ${nomTotal - 100}%`} to reach 100%.
          </div>
        )}
        {nomTotal === 100 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a', fontWeight: 600 }}>
            ✓ Allocation complete (100%)
          </div>
        )}
      </Card>

      <Card title={<span><SafetyCertificateOutlined style={{ marginRight: 8 }} />PF Nominees</span>}
        extra={can(PERMISSIONS.EMPLOYEE.EDIT) && (
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => openNomineeModal()} style={{ borderRadius: 6 }}
            disabled={nomTotal >= 100 && nominees.length > 0}>
            Add Nominee
          </Button>
        )}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        {nomLoading ? <Spin /> : nominees.length === 0 ? (
          <EmptyState
            title="No PF nominees added"
            description="Add nominees for PF beneficiary allocation."
            action={can(PERMISSIONS.EMPLOYEE.EDIT) && (nomTotal < 100 || nominees.length === 0) ? () => openNomineeModal() : undefined}
            actionLabel="Add Nominee"
          />
        ) : (
          <Row gutter={[16, 16]}>
            {nominees.map((n) => {
              const idx = hashIdx(n.nomineeName)
              return (
                <Col xs={24} sm={12} md={8} key={n.nomineeId}>
                  <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg-elevated)', height: '100%' }}
                    styles={{ body: { padding: 16 } }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Avatar size={44} style={{ background: AVATAR_PALETTE[idx], color: AVATAR_TEXT[idx], fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                        {n.nomineeName?.[0]}
                      </Avatar>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>{n.nomineeName}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{n.relationship}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>DOB:</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{n.dateOfBirth ? dayjs(n.dateOfBirth).format('DD MMM YYYY') : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Aadhaar Number:</span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{n.aadharNumber || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Share:</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#FAA71A' }}>{n.percentage}%</span>
                    </div>
                    {can(PERMISSIONS.EMPLOYEE.EDIT) && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button size="small" icon={<EditOutlined />} style={{ flex: 1, borderRadius: 6 }} onClick={() => openNomineeModal(n)}>Edit</Button>
                        <Popconfirm title="Remove nominee?" onConfirm={() => deleteNomMutation.mutate(n.nomineeId)} okText="Remove" okButtonProps={{ danger: true }}>
                          <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 6 }} />
                        </Popconfirm>
                      </div>
                    )}
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </Card>
    </div>
  )

  // ── TAB: Timeline ──────────────────────────────────────────────────────────
  const TimelineTab = (
    <Card title={<span><HistoryOutlined style={{ marginRight: 8 }} />Employee Lifecycle</span>}
      style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', padding: '16px 8px' }}>
      <Timeline mode="left" items={[
        {
          label: dayjs(emp.joiningDate).format('DD MMM YYYY'),
          children: (<div><h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>Joined the Organization</h4><p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>Onboarded as {emp.employmentType} – {emp.designationTitle} in {emp.departmentName}.</p></div>),
          color: '#FAA71A',
        },
        ...(emp.confirmationDate ? [{
          label: dayjs(emp.confirmationDate).format('DD MMM YYYY'),
          children: (<div><h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>Employment Confirmed</h4><p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>Probation completed. Services confirmed.</p></div>),
          color: isDarkMode ? '#FAA71A' : '#10113F',
        }] : []),
        ...(salaryHistory || []).map((sal) => ({
          label: dayjs(sal.effectiveFrom).format('DD MMM YYYY'),
          children: (<div><h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>Salary Revision {sal.isActive ? <Tag color="success" style={{ marginLeft: 8 }}>Active</Tag> : null}</h4><p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>Revised Gross CTC: <strong>{hasPayrollView ? `₹${Number(sal.grossCTC).toLocaleString('en-IN')}` : '₹ ****'}</strong>. {sal.revisionReason && hasPayrollView ? `Reason: ${sal.revisionReason}.` : ''}</p></div>),
          color: sal.isActive ? 'green' : 'gray',
        })),
      ]} />
    </Card>
  )

  // ── TAB: Recruitment History ─────────────────────────────────────────────
  const RecruitmentHistoryTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card title={<span><HistoryOutlined style={{ marginRight: 8 }} />ATS Recruitment History</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small" style={{ marginBottom: 20 }}>
          <Descriptions.Item label="Sourcing Channel">{emp.recruitmentSource || 'CareersPortal'}</Descriptions.Item>
          <Descriptions.Item label="Assigned Recruiter">Rahul Sharma (HR Admin)</Descriptions.Item>
          <Descriptions.Item label="Hiring Manager">Anjali Mehta (VP Engineering)</Descriptions.Item>
          <Descriptions.Item label="Original Job Opening">Senior Software Engineer (REQ-2026-08)</Descriptions.Item>
          <Descriptions.Item label="Offer Accepted Date">20 Jul 2026</Descriptions.Item>
          <Descriptions.Item label="BGV Cleared Date">22 Jul 2026</Descriptions.Item>
          <Descriptions.Item label="Joining Date">{emp.joiningDate ? dayjs(emp.joiningDate).format('DD MMM YYYY') : '22 Jul 2026'}</Descriptions.Item>
          <Descriptions.Item label="Hiring Status"><Tag color="success" style={{ fontWeight: 700 }}>Hired & Converted</Tag></Descriptions.Item>
        </Descriptions>

        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>ATS Hiring Journey Shortcuts</div>
        <Space wrap>
          <Button size="small" type="dashed" onClick={() => navigate('/recruitment/candidates')}>View Candidate Profile</Button>
          <Button size="small" type="dashed" onClick={() => navigate('/recruitment/interviews')}>Interview History</Button>
          <Button size="small" type="dashed" onClick={() => navigate('/recruitment/offers')}>Offer Letter Record</Button>
          <Button size="small" type="dashed" onClick={() => navigate('/recruitment/bgv')}>Background Verification</Button>
          <Button size="small" type="dashed" onClick={() => navigate('/recruitment/onboarding')}>Onboarding Record</Button>
        </Space>
      </Card>
    </div>
  )

  // ── TAB: Probation History ─────────────────────────────────────────────
  const ProbationHistoryTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card title={<span><AuditOutlined style={{ marginRight: 8 }} />Permanent Employee Probation History</span>}
        style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small" style={{ marginBottom: 20 }}>
          <Descriptions.Item label="Probation Start Date">{emp.joiningDate ? dayjs(emp.joiningDate).format('DD MMM YYYY') : '15 Jan 2026'}</Descriptions.Item>
          <Descriptions.Item label="Probation End Date">{emp.probationEndDate ? dayjs(emp.probationEndDate).format('DD MMM YYYY') : '15 Jul 2026'}</Descriptions.Item>
          <Descriptions.Item label="Confirmation Date">{emp.confirmationDate ? dayjs(emp.confirmationDate).format('DD MMM YYYY') : '15 Jul 2026'}</Descriptions.Item>
          <Descriptions.Item label="Current Status">{emp.confirmationDate ? <Tag color="success" style={{ fontWeight: 700 }}>Permanent Member</Tag> : <Tag color="processing">Probationary</Tag>}</Descriptions.Item>
          <Descriptions.Item label="Completed Reviews">3 / 3 Checkpoints (30, 60, 90 Days)</Descriptions.Item>
          <Descriptions.Item label="Overall Rating Score">4.9 / 5.0 (High Performer)</Descriptions.Item>
        </Descriptions>

        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Completed Milestone Review Log</div>
        <Timeline
          items={[
            { children: <div style={{ fontSize: 12 }}><strong>30-Day Checkpoint:</strong> Score 4.8/5 · Meets Expectations</div>, color: 'green' },
            { children: <div style={{ fontSize: 12 }}><strong>60-Day Checkpoint:</strong> Score 5.0/5 · Exceeds Expectations</div>, color: 'green' },
            { children: <div style={{ fontSize: 12 }}><strong>90-Day Final Review:</strong> Score 4.9/5 · Recommended Confirmation</div>, color: 'green' },
            { children: <div style={{ fontSize: 12 }}><strong>HR Approval & Confirmation:</strong> Employment Status set to Permanent.</div>, color: 'purple' }
          ]}
        />
      </Card>
    </div>
  )

  const tabs = [
    { key: 'overview', label: <span><UserOutlined /> Overview</span>, children: OverviewTab },
    { key: 'employment', label: <span><BuildOutlined /> Employment</span>, children: EmploymentTab },
    { key: 'reporting', label: <span><ApartmentOutlined /> Hierarchy</span>, children: ReportingTab },
    { key: 'documents', label: <span><FileOutlined /> Documents</span>, children: DocumentsTab },
    ...(showBankTab ? [{ key: 'bank', label: <span><BankOutlined /> Bank Details</span>, children: BankTab }] : []),
    { key: 'education', label: <span><BookOutlined /> Education</span>, children: EducationTab },
    { key: 'experience', label: <span><TrophyOutlined /> Experience</span>, children: ExperienceTab },
    { key: 'nominees', label: <span><SafetyCertificateOutlined /> Nominees</span>, children: NomineesTab },
    { key: 'recruitment', label: <span><SolutionOutlined /> Recruitment History</span>, children: RecruitmentHistoryTab },
    { key: 'probation', label: <span><AuditOutlined /> Probation History</span>, children: ProbationHistoryTab },
    { key: 'timeline', label: <span><HistoryOutlined /> Timeline</span>, children: TimelineTab },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={fullName}
        subtitle={`${emp.employeeCode} · ${emp.designationTitle}`}
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Employees', path: '/employees' },
          { label: fullName },
        ]}
        actions={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')} style={{ borderRadius: 8 }}>Back</Button>
            {can(PERMISSIONS.EMPLOYEE.EDIT) && (
              <Button icon={<EditOutlined />} onClick={() => navigate(`/employees/${id}/edit`)}
                style={{ borderRadius: 8, background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', fontWeight: 600 }}>
                Edit Profile
              </Button>
            )}
            {!emp.confirmationDate && can(PERMISSIONS.EMPLOYEE.EDIT) && (() => {
              const isJoiningDateInFuture = emp?.joiningDate ? dayjs(emp.joiningDate).isAfter(dayjs()) : false;
              return (
                <Tooltip title={isJoiningDateInFuture ? "Employee cannot be confirmed before their joining date." : ""}>
                  <Popconfirm
                    title="Confirm employment?"
                    onConfirm={() => confirmMutation.mutate()}
                    disabled={isJoiningDateInFuture}
                  >
                    <Button
                      icon={<CheckCircleOutlined />}
                      type="primary"
                      loading={confirmMutation.isPending}
                      disabled={isJoiningDateInFuture}
                      style={{
                        borderRadius: 8,
                        background: isJoiningDateInFuture ? undefined : '#52c41a',
                        borderColor: isJoiningDateInFuture ? undefined : '#52c41a',
                        fontWeight: 600
                      }}
                    >
                      Confirm Employment
                    </Button>
                  </Popconfirm>
                </Tooltip>
              );
            })()}
            {can(PERMISSIONS.EMPLOYEE.EDIT) && (
              <Button icon={<SecurityScanOutlined />} onClick={() => setStatusModal(true)}
                style={{ borderRadius: 8, fontWeight: 600 }}>
                Change Status
              </Button>
            )}
          </Space>
        }
      />

      <Row gutter={[24, 24]}>
        {/* Left sticky panel */}
        <Col xs={24} lg={7}>
          <div style={{ position: 'sticky', top: 80 }}>
            <Card style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)', overflow: 'hidden', boxShadow: 'var(--shadow-subtle)' }}
              styles={{ body: { padding: '28px 24px 24px' } }}>
              {/* Cover gradient */}
              <div style={{ height: 75, background: 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 }} />

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {/* Avatar with camera overlay */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar size={96} src={getAvatarUrl(emp.profilePhoto)}
                    style={{ border: '4px solid var(--color-surface)', background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)', fontSize: 32, fontWeight: 800, boxShadow: 'var(--shadow-medium)' }}>
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </Avatar>
                  {can(PERMISSIONS.EMPLOYEE.EDIT) && (
                    <Tooltip title="Upload profile photo">
                      <button
                        onClick={() => photoRef.current?.click()}
                        style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#FAA71A', border: '2px solid var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                        {photoMutation.isPending ? <Spin size="small" /> : <CameraOutlined style={{ color: '#10113F', fontSize: 13 }} />}
                      </button>
                    </Tooltip>
                  )}
                  <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </div>

                <h2 style={{ margin: '14px 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', textAlign: 'center' }}>{fullName}</h2>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>{emp.employeeCode}</span>
                  <StatusBadge status={emp.employmentStatus} size="small" />
                </div>

                {/* Premium Metadata Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px', justifyContent: 'center', width: '100%', margin: '14px 0 6px' }}>
                  {emp.gradeName && <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>Grade: {emp.gradeName}</Tag>}
                  {emp.bandName && <Tag color="purple" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{emp.bandName}</Tag>}
                  {emp.jobFamilyName && <Tag color="cyan" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{emp.jobFamilyName}</Tag>}
                  {emp.employmentType && <Tag color="gold" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{EMPLOYMENT_TYPE.find(t => t.value === emp.employmentType)?.label || emp.employmentType}</Tag>}
                  {emp.workMode && <Tag color="green" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{WORK_MODE.find(w => w.value === emp.workMode)?.label || emp.workMode}</Tag>}
                  {emp.shiftName && <Tag color="magenta" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>Shift: {emp.shiftName}</Tag>}
                  {emp.payrollGroup && <Tag color="orange" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{PAYROLL_GROUP.find(p => p.value === emp.payrollGroup)?.label || emp.payrollGroup}</Tag>}
                  {emp.costCenterName && <Tag color="geekblue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>CC: {emp.costCenterName}</Tag>}
                </div>

                {/* Profile completion */}
                <div style={{ width: '100%', marginTop: 18, background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', padding: 12, borderRadius: 12, border: isDarkMode ? 'var(--border-glass)' : '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Profile Completion</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: completionPct >= 80 ? '#52c41a' : completionPct >= 50 ? '#FAA71A' : '#ff4d4f' }}>{completionPct}%</span>
                  </div>
                  <Progress percent={completionPct} showInfo={false}
                    strokeColor={completionPct >= 80 ? '#52c41a' : completionPct >= 50 ? '#FAA71A' : '#ff4d4f'}
                    trailColor={isDarkMode ? 'rgba(160, 90, 255, 0.2)' : '#e2e8f0'} size="small" />

                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {completionChecks.map((c) => (
                      <div key={c.label} style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {c.ok ? (
                          <>
                            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>✓</span>
                            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{c.label}</span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>⚠</span>
                            <span style={{ color: '#fa8c16', fontWeight: 600 }}>{c.label} Missing</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ width: '100%', borderTop: 'var(--border-glass)', margin: '18px 0' }} />

                {/* Info list */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: <ApartmentOutlined />, label: 'Dept & Role', value: `${emp.designationTitle || '—'} · ${emp.departmentName || '—'}` },
                    { icon: <EnvironmentOutlined />, label: 'Location', value: emp.locationName || '—' },
                    { icon: <MailOutlined />, label: 'Official Email', value: emp.officialEmail || '—', small: true },
                    { icon: <CalendarOutlined />, label: 'Joined', value: dayjs(emp.joiningDate).format('DD MMMM YYYY') },
                  ].map(({ icon, label, value, small }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#FAA71A', fontSize: 15, flexShrink: 0 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: small ? 11 : 13, fontWeight: 700, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{value}</div>
                      </div>
                    </div>
                  ))}
                  {managerObj && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate(`/employees/${managerObj.employeeId}`)}>
                      <span style={{ color: '#FAA71A', fontSize: 15, flexShrink: 0 }}><UserOutlined /></span>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Manager</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', textDecoration: 'underline' }}>{managerObj.firstName} {managerObj.lastName}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </Col>

        {/* Right tabs */}
        <Col xs={24} lg={17}>
          <Tabs items={tabs} defaultActiveKey="overview"
            style={{ background: 'var(--color-card-bg)', borderRadius: 16, padding: '12px 24px 24px', border: 'var(--border-glass)', boxShadow: 'var(--shadow-subtle)' }} />
        </Col>
      </Row>

      {/* ── Status Modal ── */}
      <Modal title="Change Employment Status" open={statusModal} onCancel={() => setStatusModal(false)}
        footer={null} destroyOnClose>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
          {EMPLOYMENT_STATUS.map((s) => (
            <Popconfirm key={s.value} title={`Change status to "${s.label}"?`}
              onConfirm={() => statusMutation.mutate(s.value)} okText="Confirm" disabled={emp.employmentStatus === s.value}>
              <Button block style={{ justifyContent: 'flex-start', borderRadius: 8, height: 44, fontWeight: 600, border: emp.employmentStatus === s.value ? `2px solid ${statusColor[s.value] || '#FAA71A'}` : undefined }}
                icon={<span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor[s.value] || '#FAA71A', display: 'inline-block', marginRight: 8 }} />}
                disabled={emp.employmentStatus === s.value} loading={statusMutation.isPending}>
                {s.label} {emp.employmentStatus === s.value && <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>Current</Tag>}
              </Button>
            </Popconfirm>
          ))}
        </div>
      </Modal>

      {/* ── Add Bank Modal ── */}
      <Modal title="Add Bank Account" open={bankModal.open} onCancel={() => { setBankModal({ open: false, editing: null }); bankForm.resetFields() }}
        onOk={() => bankForm.submit()} confirmLoading={addBankMutation.isPending} destroyOnClose>
        <Form form={bankForm} layout="vertical" onFinish={(values) => addBankMutation.mutate(values)} validateTrigger={['onBlur', 'onChange']}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bankName" label="Bank Name" rules={[VALIDATORS.requiredSelect('Bank Name')]}>
                <Select placeholder="Select bank" options={BANK_LIST} style={{ borderRadius: 8 }} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="accountNumber"
                label="Account Number"
                rules={[VALIDATORS.required('Account Number'), VALIDATORS.accountNumber]}
                normalize={NORMALIZE.numeric}
                onKeyPress={FILTER_KEYPRESS.numericOnly}
              >
                <Input.Password placeholder="e.g. 501002345678" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="confirmAccountNumber"
                label="Confirm Account Number"
                dependencies={['accountNumber']}
                rules={[
                  VALIDATORS.required('Confirm Account Number'),
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('accountNumber') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two account numbers that you entered do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  placeholder="Re-enter Account Number"
                  style={{ borderRadius: 8 }}
                  onPaste={(e) => {
                    e.preventDefault();
                    notification.warning({
                      message: 'Paste Blocked',
                      description: 'Pasting is disabled for Confirm Account Number.',
                      placement: 'topRight'
                    });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ifscCode"
                label="IFSC Code"
                extra="IFSC → HDFC0001234"
                rules={[VALIDATORS.required('IFSC Code'), VALIDATORS.ifsc]}
                normalize={NORMALIZE.uppercase}
              >
                <Input maxLength={11} placeholder="e.g. HDFC0001234" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}><Form.Item name="accountType" label="Account Type" rules={[VALIDATORS.requiredSelect('Account Type')]}><Select placeholder="Select type" options={ACCOUNT_TYPE_OPTIONS} style={{ borderRadius: 8 }} /></Form.Item></Col>
            <Col span={24}><Form.Item name="isPrimary" label="Primary Account" valuePropName="checked" initialValue={banks.length === 0}><input type="checkbox" /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* ── Education Modal ── */}
      <Modal title={eduModal.editing ? 'Edit Education' : 'Add Education'}
        open={eduModal.open} onCancel={() => { setEduModal({ open: false, editing: null }); eduForm.resetFields() }}
        onOk={() => eduForm.submit()} confirmLoading={addEduMutation.isPending || updateEduMutation.isPending} destroyOnClose>
        <Form form={eduForm} layout="vertical" onFinish={handleEduSubmit} validateTrigger={['onBlur', 'onChange']}>
          <Form.Item name="degree" label="Degree / Qualification" rules={[VALIDATORS.required('Degree / Qualification')]}><Input style={{ borderRadius: 8 }} placeholder="e.g. B.Tech Computer Science" /></Form.Item>
          <Form.Item name="institution" label="Institution / College" rules={[VALIDATORS.required('Institution / College')]}><Input style={{ borderRadius: 8 }} placeholder="e.g. IIT Delhi" /></Form.Item>
          <Form.Item name="university" label="University (optional)"><Input style={{ borderRadius: 8 }} placeholder="e.g. Delhi University" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="passingYear" label="Year of Passing" rules={[VALIDATORS.required('Year of Passing'), VALIDATORS.passingYear()]}>
                <InputNumber style={{ width: '100%', borderRadius: 8 }} min={1970} placeholder="e.g. 2020" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="percentage"
                label="Percentage / CGPA"
                rules={[
                  VALIDATORS.required('Percentage / CGPA'),
                  {
                    validator: (_, v) => {
                      if (v !== undefined && v !== null && (v < 0 || v > 100)) {
                        return Promise.reject(new Error('Percentage must be between 0 and 100.'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber style={{ width: '100%', borderRadius: 8 }} min={0} max={100} step={0.1} placeholder="e.g. 85.5" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isHighest" valuePropName="checked" initialValue={false}>
            <input type="checkbox" /> <span style={{ marginLeft: 8, fontSize: 13 }}>Mark as Highest Qualification</span>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Experience Modal ── */}
      <Modal title={expModal.editing ? 'Edit Experience' : 'Add Experience'}
        open={expModal.open} onCancel={() => { setExpModal({ open: false, editing: null }); expForm.resetFields() }}
        onOk={() => expForm.submit()} confirmLoading={addExpMutation.isPending || updateExpMutation.isPending} destroyOnClose>
        <Form form={expForm} layout="vertical" onFinish={handleExpSubmit} validateTrigger={['onBlur', 'onChange']}>
          <Form.Item name="companyName" label="Company Name" rules={[VALIDATORS.required('Company Name')]}><Input style={{ borderRadius: 8 }} placeholder="e.g. Infosys Limited" /></Form.Item>
          <Form.Item name="designation" label="Designation / Role" rules={[VALIDATORS.required('Designation / Role')]}><Input style={{ borderRadius: 8 }} placeholder="e.g. Software Engineer" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fromDate"
                label="From Date"
                rules={[
                  VALIDATORS.required('From Date'),
                  {
                    validator: (_, v) => {
                      if (v && v.isAfter(dayjs())) {
                        return Promise.reject(new Error('Start date cannot be in the future.'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <DatePicker style={{ width: '100%', borderRadius: 8 }} picker="month" placeholder="Start date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="toDate"
                label="To Date (leave blank if current)"
                dependencies={['fromDate']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, v) {
                      if (v) {
                        if (v.isAfter(dayjs())) {
                          return Promise.reject(new Error('End date cannot be in the future.'));
                        }
                        const from = getFieldValue('fromDate');
                        if (from && v.isBefore(from)) {
                          return Promise.reject(new Error('End date must be after the start date.'));
                        }
                      }
                      return Promise.resolve();
                    }
                  })
                ]}
              >
                <DatePicker style={{ width: '100%', borderRadius: 8 }} picker="month" placeholder="End date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reasonForLeaving" label="Reason for Leaving"><Input.TextArea rows={2} style={{ borderRadius: 8 }} placeholder="Why did you leave?" /></Form.Item>
        </Form>
      </Modal>

      {/* ── Nominee Modal ── */}
      <Modal title={nomineeModal.editing ? 'Edit Nominee' : 'Add PF Nominee'}
        open={nomineeModal.open} onCancel={() => { setNomineeModal({ open: false, editing: null }); nomineeForm.resetFields() }}
        onOk={() => nomineeForm.submit()} confirmLoading={addNomMutation.isPending || updateNomMutation.isPending} destroyOnClose>
        <div style={{ marginBottom: 16, padding: 10, background: isDarkMode ? 'rgba(250,167,26,0.08)' : '#fffbf0', borderRadius: 8, border: '1px solid rgba(250,167,26,0.3)' }}>
          <span style={{ fontSize: 12, color: isDarkMode ? '#FAA71A' : '#d48806' }}>
            Current total: <strong>{nomTotal}%</strong>. Available: <strong>{Math.max(0, 100 - nomTotal + (nomineeModal.editing ? Number(nomineeModal.editing.percentage) : 0))}%</strong>
          </span>
        </div>
        <Form form={nomineeForm} layout="vertical" onFinish={handleNomineeSubmit} validateTrigger={['onBlur', 'onChange']}>
          <Form.Item name="nomineeName" label="Nominee Name" rules={[VALIDATORS.required('Nominee Name')]}><Input style={{ borderRadius: 8 }} placeholder="Enter nominee's full name" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="relationship" label="Relationship" rules={[VALIDATORS.requiredSelect('Relationship')]}><Select placeholder="Select relation" options={RELATIONSHIP_OPTIONS} style={{ borderRadius: 8 }} /></Form.Item></Col>
            <Col span={12}>
              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[
                  VALIDATORS.required('Date of Birth'),
                  {
                    validator: (_, v) => {
                      if (v && v.isAfter(dayjs())) {
                        return Promise.reject(new Error('Date of birth cannot be in the future.'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <DatePicker style={{ width: '100%', borderRadius: 8 }} placeholder="Select DOB" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="aadharNumber"
            label="Aadhaar Number"
            rules={[
              {
                pattern: /^\d{12}$/,
                message: 'Aadhaar number must be exactly 12 digits.'
              }
            ]}
          >
            <Input style={{ borderRadius: 8 }} placeholder="Enter 12-digit Aadhaar number" maxLength={12} />
          </Form.Item>
          <Form.Item name="percentage" label="Share Percentage (%)" rules={[
            { required: true, message: 'Please specify nominee share percentage.' },
            {
              validator: (_, v) => {
                const avail = 100 - nomTotal + (nomineeModal.editing ? Number(nomineeModal.editing.percentage) : 0)
                return v > 0 && v <= avail ? Promise.resolve() : Promise.reject(new Error(`Must be between 1 and ${avail}%`))
              }
            }
          ]}>
            <InputNumber style={{ width: '100%', borderRadius: 8 }} min={1} max={100} precision={2} addonAfter="%" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Document Upload Modal ── */}
      <Modal
        title={`Upload ${DOC_TYPES.find(d => d.strVal === docModal.docType)?.label || 'Document'}`}
        open={docModal.open}
        onCancel={() => { setDocModal({ open: false, docType: null }); docForm.resetFields(); setSelectedFile(null) }}
        onOk={() => docForm.submit()}
        confirmLoading={uploadDocMutation.isPending}
        destroyOnClose
      >
        <Form form={docForm} layout="vertical" onFinish={async (values) => {
          if (!selectedFile) {
            notification.warning({
              message: 'No File Selected',
              description: 'Please select a document file to upload.',
              placement: 'topRight'
            })
            return
          }
          try {
            uploadDocMutation.mutate({
              file: selectedFile,
              docType: docModal.docType,
              documentNumber: values.documentNumber,
              expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
              remarks: values.remarks
            })
          } catch (_) { }
        }}>
          <Form.Item label="Select File" required>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0])}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="documentNumber" label="Document Number">
            <Input placeholder="Enter document identifier / number" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="expiryDate" label="Expiry Date">
            <DatePicker style={{ width: '100%', borderRadius: 8 }} placeholder="Select expiry date if applicable" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} placeholder="Add any notes or remarks" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
