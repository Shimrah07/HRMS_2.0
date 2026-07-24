import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Descriptions, Avatar, Button, Form, Input, message, Spin,
  Row, Col, Tabs, Tag, Timeline, Modal, Space, Progress, Tooltip, Table,
  notification
} from 'antd'
import {
  EditOutlined, SaveOutlined, UserOutlined, BuildOutlined,
  ApartmentOutlined, FileOutlined, BankOutlined, HistoryOutlined,
  BookOutlined, PlusOutlined, DeleteOutlined, EnvironmentOutlined,
  MailOutlined, CalendarOutlined, PhoneOutlined, PlusSquareOutlined,
  CheckCircleOutlined, DownloadOutlined, EyeOutlined, UploadOutlined,
  CreditCardOutlined, SafetyCertificateOutlined, ArrowDownOutlined, ArrowRightOutlined,
  BranchesOutlined, DollarOutlined, IdcardOutlined, CameraOutlined
} from '@ant-design/icons'
import { EMPLOYMENT_TYPE, WORK_MODE, WEEKLY_OFF_PATTERN, PAYROLL_GROUP } from '../../constants/enums'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import { employeeService } from '../../services/employeeService'
import useAuthStore from '../../store/authStore'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import EmptyState from '../../components/common/EmptyState'
import useUIStore from '../../store/uiStore'
import { VALIDATORS, NORMALIZE, FILTER_KEYPRESS } from '../../constants/validation'
import { getAvatarUrl } from '../../constants/api'
// Mapping document types to match the backend DocumentType Enum
const docTypeMapping = {
  Aadhar: { label: 'Aadhaar Card', enumVal: 0, strVal: 'Aadhar' },
  PAN: { label: 'PAN Card', enumVal: 1, strVal: 'PAN' },
  Degree: { label: 'Degree Certificate', enumVal: 10, strVal: 'EducationCertificate' },
  Experience: { label: 'Experience Letter', enumVal: 9, strVal: 'ExperienceLetter' },
  Photo: { label: 'Profile Photo', enumVal: 12, strVal: 'Photo' }
}

export default function MyProfilePage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { isDarkMode } = useUIStore()
  const queryClient = useQueryClient()
  const { can, isSuperAdmin } = usePermission()
  const hasPayrollView = isSuperAdmin || can(PERMISSIONS.PAYROLL.VIEW)
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const photoRef = useRef(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: employeeService.getMyProfile,
    select: (res) => res?.data,
  })

  const id = profile?.employeeId

  const photoMutation = useMutation({
    mutationFn: (file) => employeeService.uploadPhoto(id, file),
    onSuccess: (res) => {
      notification.success({
        message: 'Photo Uploaded',
        description: 'Profile photo has been updated.',
        placement: 'topRight'
      })
      if (res?.success && res.data) {
        useAuthStore.getState().updateUser({ profilePhoto: res.data })
      }
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
    },
    onError: () => {
      notification.error({
        message: 'Upload Failed',
        description: 'Failed to upload profile photo.',
        placement: 'topRight'
      })
    },
  })

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

  // Sub-queries for profile tabs
  const { data: docs } = useQuery({
    queryKey: ['employee-docs', id],
    queryFn: () => employeeService.getDocuments(id),
    enabled: !!id,
    select: (res) => res?.data || [],
  })

  const { data: banks } = useQuery({
    queryKey: ['employee-banks', id],
    queryFn: () => employeeService.getBankDetails(id),
    enabled: !!id,
    select: (res) => res?.data || [],
  })

  const { data: salaryHistory } = useQuery({
    queryKey: ['salary-history', id],
    queryFn: () => employeeService.getSalaryHistory(id),
    enabled: !!id,
    select: (res) => res?.data || [],
  })

  // To search managers and direct reports
  const { data: allEmpsRes } = useQuery({
    queryKey: ['all-employees-list-myprofile'],
    queryFn: () => employeeService.getEmployees({ pageSize: 10000 }),
    enabled: !!id
  })
  const allEmployees = allEmpsRes?.data || []

  // Local CRUD for Education and Experience
  const [education, setEducation] = useState([])
  const [experience, setExperience] = useState([])
  
  // Modals for CRUD
  const [isEduModalOpen, setIsEduModalOpen] = useState(false)
  const [isExpModalOpen, setIsExpModalOpen] = useState(false)
  const [editingEdu, setEditingEdu] = useState(null)
  const [editingExp, setEditingExp] = useState(null)

  const [eduForm] = Form.useForm()
  const [expForm] = Form.useForm()

  // Sync state with localStorage if no backend educations/experiences exist
  useEffect(() => {
    if (id) {
      const storedEdu = localStorage.getItem(`emp_edu_${id}`)
      const storedExp = localStorage.getItem(`emp_exp_${id}`)
      
      setEducation(storedEdu ? JSON.parse(storedEdu) : [
        { key: '1', degree: 'Bachelor of Technology (B.Tech) in Computer Science', school: 'Indian Institute of Technology, Delhi', year: '2020', grade: '9.2 CGPA' },
        { key: '2', degree: 'Higher Secondary School Certificate', school: 'St. Xavier School, Delhi', year: '2016', grade: '92%' }
      ])
      setExperience(storedExp ? JSON.parse(storedExp) : [
        { key: '1', role: 'Software Engineer', company: 'Tech Solutions Private Limited', start: 'Jul 2021', end: 'Dec 2023', details: 'Developed responsive user interfaces, integrated REST APIs, and managed deployment workflows.' },
        { key: '2', role: 'Associate Developer', company: 'Innova Systems', start: 'Jun 2020', end: 'Jun 2021', details: 'Built core features for client-facing financial applications.' }
      ])
    }
  }, [id])

  const saveEdu = (newEdu) => {
    setEducation(newEdu)
    localStorage.setItem(`emp_edu_${id}`, JSON.stringify(newEdu))
  }

  const saveExp = (newExp) => {
    setExperience(newExp)
    localStorage.setItem(`emp_exp_${id}`, JSON.stringify(newExp))
  }

  // Education CRUD handlers
  const handleOpenAddEdu = () => {
    setEditingEdu(null)
    eduForm.resetFields()
    setIsEduModalOpen(true)
  }

  const handleOpenEditEdu = (record) => {
    setEditingEdu(record)
    eduForm.setFieldsValue(record)
    setIsEduModalOpen(true)
  }

  const handleSaveEdu = (values) => {
    if (editingEdu) {
      const updated = education.map(item => item.key === editingEdu.key ? { ...item, ...values } : item)
      saveEdu(updated)
      notification.success({
        message: 'Education Updated',
        description: 'Academic qualification record updated.',
        placement: 'topRight'
      })
    } else {
      const added = [...education, { key: Date.now().toString(), ...values }]
      saveEdu(added)
      notification.success({
        message: 'Education Added',
        description: 'Academic qualification record added successfully.',
        placement: 'topRight'
      })
    }
    setIsEduModalOpen(false)
    eduForm.resetFields()
  }

  const handleDeleteEdu = (key) => {
    const updated = education.filter(item => item.key !== key)
    saveEdu(updated)
    notification.success({
      message: 'Record Deleted',
      description: 'Academic qualification record deleted.',
      placement: 'topRight'
    })
  }

  // Experience CRUD handlers
  const handleOpenAddExp = () => {
    setEditingExp(null)
    expForm.resetFields()
    setIsExpModalOpen(true)
  }

  const handleOpenEditExp = (record) => {
    setEditingExp(record)
    expForm.setFieldsValue(record)
    setIsExpModalOpen(true)
  }

  const handleSaveExp = (values) => {
    if (editingExp) {
      const updated = experience.map(item => item.key === editingExp.key ? { ...item, ...values } : item)
      saveExp(updated)
      notification.success({
        message: 'Experience Updated',
        description: 'Work experience record updated.',
        placement: 'topRight'
      })
    } else {
      const added = [...experience, { key: Date.now().toString(), ...values }]
      saveExp(added)
      notification.success({
        message: 'Experience Added',
        description: 'Work experience record saved successfully.',
        placement: 'topRight'
      })
    }
    setIsExpModalOpen(false)
    expForm.resetFields()
  }

  const handleDeleteExp = (key) => {
    const updated = experience.filter(item => item.key !== key)
    saveExp(updated)
    notification.success({
      message: 'Record Deleted',
      description: 'Work experience record deleted.',
      placement: 'topRight'
    })
  }

  // File Upload handling
  const triggerFileUpload = (docTypeKey) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      const mapping = docTypeMapping[docTypeKey]
      try {
        notification.info({
          message: 'Uploading Document',
          description: `Please wait while ${mapping.label} is uploading...`,
          placement: 'topRight',
          key: 'uploadDoc'
        })
        await employeeService.uploadDocument(id, file, mapping.strVal)
        notification.success({
          message: 'Upload Complete',
          description: `${mapping.label} uploaded successfully!`,
          placement: 'topRight',
          key: 'uploadDoc'
        })
        queryClient.invalidateQueries({ queryKey: ['employee-docs', id] })
      } catch (err) {
        notification.error({
          message: 'Upload Failed',
          description: `Failed to upload document: ${err.message || 'Error'}`,
          placement: 'topRight',
          key: 'uploadDoc'
        })
      }
    }
    input.click()
  }

  const updateMutation = useMutation({
    mutationFn: (payload) => employeeService.updateMyProfile(payload),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Profile Updated',
          description: 'Profile updated successfully.',
          placement: 'topRight'
        })
        setEditing(false)
        queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      } else {
        notification.error({
          message: 'Update Failed',
          description: res.message || 'Failed to update profile.',
          placement: 'topRight'
        })
      }
    },
  })

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>

  if (!profile) {
    return (
      <EmptyState
        title="No employee profile linked"
        description="Your user account is not linked to an employee profile. Contact your HR administrator."
      />
    )
  }

  const fullName = `${profile.firstName} ${profile.middleName ? profile.middleName + ' ' : ''}${profile.lastName}`

  const handleSave = async () => {
    const values = await form.validateFields()
    const parts = [
      values.currentAddressLine1,
      values.currentAddressLine2,
      values.currentCity,
      values.currentDistrict,
      values.currentState,
      values.currentPincode
    ].filter(Boolean)
    const payload = {
      ...values,
      currentAddress: parts.join(', ')
    }
    updateMutation.mutate(payload)
  }

  // Education & Experience Data Sources (Prefer Backend if available)
  const isEduBackend = profile.educations && profile.educations.length > 0
  const isExpBackend = profile.experiences && profile.experiences.length > 0

  const activeEduList = isEduBackend ? profile.educations : education
  const activeExpList = isExpBackend ? profile.experiences : experience

  // Calculate Profile Completion %
  const completionChecks = [
    { label: 'Photo', ok: !!profile.profilePhoto },
    { label: 'PAN', ok: !!profile.maskedPAN },
    { label: 'Aadhaar', ok: !!profile.maskedAadhar },
    { label: 'Emergency Contact', ok: !!profile.emergencyContactName && !!profile.emergencyContactPhone },
    { label: 'Address', ok: !!profile.permanentAddress || !!profile.currentAddress },
    { label: 'Date of Birth', ok: !!profile.dateOfBirth },
    { label: 'Bank Details', ok: banks && banks.length > 0 },
    { label: 'Education', ok: activeEduList.length > 0 },
    { label: 'Experience', ok: activeExpList.length > 0 },
    { label: 'Documents', ok: docs && docs.length > 0 },
    { label: 'Blood Group', ok: !!profile.bloodGroup },
  ]
  const filled = completionChecks.filter(c => c.ok).length
  const completionPercentage = Math.round((filled / completionChecks.length) * 100)

  // Direct Reports counting and finding Manager
  const directReports = allEmployees.filter(e => e.reportingManagerId === profile.employeeId)
  const managerObj = allEmployees.find(e => e.employeeId === profile.reportingManagerId)
  const l2ManagerObj = allEmployees.find(e => e.employeeId === profile.l2ReportingManagerId)
  const l3ManagerObj = allEmployees.find(e => e.employeeId === profile.l3ReportingManagerId)
  const l4ManagerObj = allEmployees.find(e => e.employeeId === profile.l4ReportingManagerId)
  const functionalManagerObj = allEmployees.find(e => e.employeeId === profile.functionalManagerId)

  // Documents helper
  const findDoc = (typeKey) => {
    const mapping = docTypeMapping[typeKey]
    return (docs || []).find(d => 
      d.docType === mapping.enumVal || 
      d.docType === mapping.strVal ||
      d.docType?.toString() === mapping.enumVal.toString() ||
      d.docType?.toString() === mapping.strVal
    )
  }

  const bankColumns = [
    { title: 'Bank Name', dataIndex: 'bankName', key: 'bank', render: (v) => <strong style={{ color: 'var(--color-text-primary)' }}>{v}</strong> },
    { title: 'Account Number', dataIndex: 'maskedAccountNumber', key: 'account', render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { title: 'IFSC Code', dataIndex: 'ifscCode', key: 'ifsc', render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span> },
    { title: 'Account Type', dataIndex: 'accountType', key: 'type', render: (v) => <Tag color="blue">{v}</Tag> },
    { title: 'Primary', dataIndex: 'isPrimary', key: 'primary', render: (v) => v ? <Tag color="success">Primary Account</Tag> : null },
  ]

  const tabs = [
    {
      key: 'overview',
      label: <span><UserOutlined /> Overview</span>,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {editing ? (
            <Card title="Edit Contact & Address Details" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
              <Form form={form} layout="vertical" validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={12}>
                    <Form.Item name="personalEmail" label="Personal Email" rules={[VALIDATORS.required('Personal Email'), VALIDATORS.personalEmail]}>
                      <Input placeholder="e.g. self@domain.com" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      name="personalPhone" 
                      label="Personal Phone" 
                      rules={[VALIDATORS.required('Personal Phone'), VALIDATORS.phone]}
                      normalize={NORMALIZE.numeric}
                      onKeyPress={FILTER_KEYPRESS.numericOnly}
                    >
                      <Input maxLength={10} placeholder="e.g. 9999988888" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      name="whatsAppNumber" 
                      label="WhatsApp Number" 
                      rules={[VALIDATORS.phone]}
                      normalize={NORMALIZE.numeric}
                      onKeyPress={FILTER_KEYPRESS.numericOnly}
                    >
                      <Input maxLength={10} placeholder="e.g. 9999988888 (Optional)" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item 
                      name="alternateMobile" 
                      label="Alternate Mobile" 
                      rules={[VALIDATORS.phone]}
                      normalize={NORMALIZE.numeric}
                      onKeyPress={FILTER_KEYPRESS.numericOnly}
                    >
                      <Input maxLength={10} placeholder="e.g. 9999988888 (Optional)" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  
                  {/* Emergency Contact */}
                  <Col xs={24} sm={6}>
                    <Form.Item name="emergencyContactName" label="Emergency Contact Name" rules={[VALIDATORS.required('Emergency Contact Name')]}>
                      <Input placeholder="e.g. Rajesh Kumar" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="emergencyContactRelation" label="Relation" rules={[VALIDATORS.required('Relation')]}>
                      <Input placeholder="e.g. Father" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item 
                      name="emergencyContactPhone" 
                      label="Emergency Contact Phone" 
                      rules={[VALIDATORS.required('Emergency Contact Phone'), VALIDATORS.phone]}
                      normalize={NORMALIZE.numeric}
                      onKeyPress={FILTER_KEYPRESS.numericOnly}
                    >
                      <Input maxLength={10} placeholder="e.g. 9876543210" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item 
                      name="alternateEmergencyContactPhone" 
                      label="Alternate Emergency Phone" 
                      rules={[VALIDATORS.phone]}
                      normalize={NORMALIZE.numeric}
                      onKeyPress={FILTER_KEYPRESS.numericOnly}
                    >
                      <Input maxLength={10} placeholder="e.g. 9876543211" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>

                  {/* Current Address */}
                  <Col xs={24} sm={12}>
                    <Form.Item name="currentAddressLine1" label="Current Address Line 1" rules={[VALIDATORS.required('Current Address Line 1')]}>
                      <Input placeholder="Flat, House No., Building, Apartment" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="currentAddressLine2" label="Current Address Line 2">
                      <Input placeholder="Area, Street, Sector, Village (Optional)" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="currentCity" label="City" rules={[VALIDATORS.required('City')]}>
                      <Input placeholder="e.g. New Delhi" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="currentDistrict" label="District" rules={[VALIDATORS.required('District')]}>
                      <Input placeholder="e.g. New Delhi" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="currentState" label="State" rules={[VALIDATORS.required('State')]}>
                      <Input placeholder="e.g. Delhi" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item 
                      name="currentPincode" 
                      label="Pincode" 
                      rules={[VALIDATORS.required('Pincode'), VALIDATORS.pincode]}
                      normalize={NORMALIZE.numeric}
                      onKeyPress={FILTER_KEYPRESS.numericOnly}
                    >
                      <Input maxLength={6} placeholder="e.g. 110001" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
          ) : (
            <>
              <Card title="Personal Information" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
                  <Descriptions.Item label="Title">{profile.title || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Date of Birth">{profile.dateOfBirth ? dayjs(profile.dateOfBirth).format('DD MMM YYYY') : '—'}</Descriptions.Item>
                  <Descriptions.Item label="Gender">{profile.gender || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Blood Group">{profile.bloodGroup || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Marital Status">{profile.maritalStatus || '—'}</Descriptions.Item>
                  {profile.maritalStatus === 'Married' && (
                    <>
                      <Descriptions.Item label="Spouse Name">{profile.spouseName || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Marriage Date">{profile.marriageDate ? dayjs(profile.marriageDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
                    </>
                  )}
                  <Descriptions.Item label="Religion">{profile.religion || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Category">{profile.category || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Mother Tongue">{profile.motherTongue || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Father Name">{profile.fatherName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Number of Dependents">{profile.numberOfDependents !== undefined && profile.numberOfDependents !== null ? profile.numberOfDependents : '—'}</Descriptions.Item>
                  <Descriptions.Item label="PwD Status">{profile.pwdStatus || '—'}</Descriptions.Item>
                  {profile.pwdStatus && profile.pwdStatus !== 'No' && (
                    <Descriptions.Item label="PwD Certificate Number">{profile.pwdCertificateNo || '—'}</Descriptions.Item>
                  )}
                  <Descriptions.Item label="Personal Email">{profile.personalEmail || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Personal Phone">{profile.personalPhone || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Full Name As Per Aadhaar" span={2}>{profile.fullNameAadhaar || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Permanent Address" span={2}>
                    {profile.permanentAddressLine1 ? (
                      <div>
                        {profile.permanentAddressLine1}
                        {profile.permanentAddressLine2 ? `, ${profile.permanentAddressLine2}` : ''}
                        <br />
                        {profile.permanentCity ? `${profile.permanentCity}` : ''}
                        {profile.permanentTaluka ? ` (Taluka: ${profile.permanentTaluka})` : ''}
                        {profile.permanentDistrict ? `, ${profile.permanentDistrict}` : ''}
                        {profile.permanentState ? `, ${profile.permanentState}` : ''}
                        {profile.permanentPincode ? ` - ${profile.permanentPincode}` : ''}
                      </div>
                    ) : (
                      profile.permanentAddress || '—'
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
              <Card title="Emergency Contacts & Current Address" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
                  <Descriptions.Item label="WhatsApp Number">{profile.whatsAppNumber || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Alternate Mobile">{profile.alternateMobile || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Emergency Contact">{profile.emergencyContactName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Relationship">{profile.emergencyContactRelation || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Emergency Phone">
                    {profile.emergencyContactPhone ? <a href={`tel:${profile.emergencyContactPhone}`}>{profile.emergencyContactPhone}</a> : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Alternate Emergency Phone">
                    {profile.alternateEmergencyContactPhone ? <a href={`tel:${profile.alternateEmergencyContactPhone}`}>{profile.alternateEmergencyContactPhone}</a> : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Current Address" span={2}>
                    {profile.currentAddressLine1 ? (
                      <div>
                        {profile.currentAddressLine1}
                        {profile.currentAddressLine2 ? `, ${profile.currentAddressLine2}` : ''}
                        <br />
                        {profile.currentCity ? `${profile.currentCity}` : ''}
                        {profile.currentDistrict ? `, ${profile.currentDistrict}` : ''}
                        {profile.currentState ? `, ${profile.currentState}` : ''}
                        {profile.currentPincode ? ` - ${profile.currentPincode}` : ''}
                      </div>
                    ) : (
                      profile.currentAddress || '—'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="City">{profile.currentCity || '—'}</Descriptions.Item>
                  <Descriptions.Item label="District">{profile.currentDistrict || '—'}</Descriptions.Item>
                  <Descriptions.Item label="State">{profile.currentState || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Pincode" span={2}>{profile.currentPincode || '—'}</Descriptions.Item>
                </Descriptions>
              </Card>
              <Card title="Government Identifiers" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
                  <Descriptions.Item label="PAN Card">{profile.maskedPAN || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Aadhaar Card">{profile.maskedAadhar || '—'}</Descriptions.Item>
                  <Descriptions.Item label="UAN Number">{profile.uanNumber || '—'}</Descriptions.Item>
                  <Descriptions.Item label="ESI Number">{profile.esiNumber || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Passport Number">{profile.passportNumber || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Passport Expiry">{profile.passportExpiry ? dayjs(profile.passportExpiry).format('DD MMM YYYY') : '—'}</Descriptions.Item>
                </Descriptions>
              </Card>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'employment',
      label: <span><BuildOutlined /> Employment</span>,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 1. Placement Hierarchy */}
          <Card title={<span><BuildOutlined style={{ marginRight: 8 }} />Organizational Placement</span>}
            style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
              <Descriptions.Item label="Business Unit">{profile.businessUnitName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Division">{profile.divisionName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Department">{profile.departmentName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Sub-Department">{profile.subDeptName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Location">{profile.locationName || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 2. Job Architecture */}
          <Card title={<span><IdcardOutlined style={{ marginRight: 8 }} />Job Architecture & Classification</span>}
            style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
              <Descriptions.Item label="Grade">{profile.gradeName || '—'} {profile.gradeCode ? `(${profile.gradeCode})` : ''}</Descriptions.Item>
              <Descriptions.Item label="Band / Level">{profile.bandName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Job Family">{profile.jobFamilyName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Job Function">{profile.jobFunctionName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Designation">{profile.designationTitle || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 3. Cost Accounting */}
          <Card title={<span><DollarOutlined style={{ marginRight: 8 }} />Cost & Profit Centers</span>}
            style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
              <Descriptions.Item label="Cost Center">{profile.costCenterName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Profit Center">{profile.profitCenterName || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 4. Shift & Work Settings */}
          <Card title={<span><CalendarOutlined style={{ marginRight: 8 }} />Work Mode & Shifts</span>}
            style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
              <Descriptions.Item label="Work Mode">
                {profile.workMode ? <Tag color="green">{WORK_MODE.find(w => w.value === profile.workMode)?.label || profile.workMode}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Shift">
                {profile.shiftName ? <Tag color="magenta">{profile.shiftName}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Weekly Off Pattern">
                {profile.weeklyOffPattern ? <Tag color="blue">{WEEKLY_OFF_PATTERN.find(w => w.value === profile.weeklyOffPattern)?.label || profile.weeklyOffPattern}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Notice Period">{profile.noticePeriodDays !== undefined ? `${profile.noticePeriodDays} Days` : '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 5. Classification & Status */}
          <Card title={<span><SafetyCertificateOutlined style={{ marginRight: 8 }} />Employment Status & Payroll</span>}
            style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
              <Descriptions.Item label="Joining Date">{dayjs(profile.joiningDate).format('DD MMM YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Confirmation Date">{profile.confirmationDate ? dayjs(profile.confirmationDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
              <Descriptions.Item label="Employment Type">
                {profile.employmentType ? <Tag color="orange">{EMPLOYMENT_TYPE.find(e => e.value === profile.employmentType)?.label || profile.employmentType}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Employment Status"><StatusBadge status={profile.employmentStatus} /></Descriptions.Item>
              <Descriptions.Item label="Payroll Group">
                {profile.payrollGroup ? <Tag color="purple">{PAYROLL_GROUP.find(p => p.value === profile.payrollGroup)?.label || profile.payrollGroup}</Tag> : '—'}
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
              {profile.employmentType === 'Contract' && (
                <Descriptions.Item label="Contract End Date" span={2}>
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    {profile.contractEndDate ? dayjs(profile.contractEndDate).format('DD MMM YYYY') : 'Not Set'}
                  </span>
                </Descriptions.Item>
              )}
              {profile.employmentType === 'Intern' && (
                <Descriptions.Item label="Internship Duration" span={2}>
                  {profile.internshipDurationMonths ? `${profile.internshipDurationMonths} Months` : 'Not Set'}
                </Descriptions.Item>
              )}
              {profile.employmentType === 'Consultant' && (
                <Descriptions.Item label="Vendor Name" span={2}>
                  {profile.vendorName || 'Not Specified'}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title={<span><CalendarOutlined style={{ marginRight: 8 }} />Probation & Confirmation</span>}
            style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 2 }} bordered size="small">
              <Descriptions.Item label="Probation End Date">{profile.probationEndDate ? dayjs(profile.probationEndDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                {profile.confirmationDate
                  ? <Tag color="success" icon={<CheckCircleOutlined />}>Confirmed</Tag>
                  : <Tag color="processing">On Probation</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Note" span={2}>
                {profile.confirmationDate
                  ? `Confirmed on ${dayjs(profile.confirmationDate).format('DD MMM YYYY')}.`
                  : `Probation in progress. End date: ${profile.probationEndDate ? dayjs(profile.probationEndDate).format('DD MMM YYYY') : 'N/A'}.`}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      ),
    },
    {
      key: 'reporting',
      label: <span><ApartmentOutlined /> Reporting Structure</span>,
      children: (
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

                {/* Current employee (Self) */}
                <div style={{ textAlign: 'center', width: 320, margin: '8px 0' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Current Position</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', background: isDarkMode ? 'rgba(250, 167, 26, 0.15)' : 'rgba(250, 167, 26, 0.08)', borderRadius: 16, border: '2px solid #FAA71A', boxShadow: '0 8px 16px rgba(250, 167, 26, 0.1)' }}>
                    <Avatar size={48} src={getAvatarUrl(profile.profilePhoto)} style={{ background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)', fontWeight: 700 }}>
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </Avatar>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-text-primary)' }}>{fullName}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{profile.designationTitle}</div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{profile.employeeCode}</div>
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
                        <Avatar src={getAvatarUrl(profile.profilePhoto)} style={{ background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)' }}>
                          {profile.firstName?.[0]}{profile.lastName?.[0]}
                        </Avatar>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text-primary)' }}>{fullName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{profile.designationTitle}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </div>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: 'documents',
      label: <span><FileOutlined /> Documents</span>,
      children: (
        <Card title="My Documents Center" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Object.keys(docTypeMapping).map((key) => {
              const mapping = docTypeMapping[key]
              const doc = findDoc(key)
              
              return (
                <Card 
                  key={key} 
                  type="inner"
                  style={{ 
                    borderRadius: 12, 
                    border: doc ? 'var(--border-glass)' : (isDarkMode ? '1.5px dashed rgba(255,255,255,0.15)' : '1.5px dashed #cbd5e1'),
                    background: doc ? 'var(--color-card-bg-elevated)' : (isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc'),
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                  bodyStyle={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 24, color: doc ? '#FAA71A' : 'var(--color-text-muted)' }}><FileOutlined /></span>
                      {doc ? (
                        doc.isVerified ? (
                          <Tag color="success" style={{ margin: 0 }}>Verified</Tag>
                        ) : (
                          <Tag color="warning" style={{ margin: 0 }}>Pending Verification</Tag>
                        )
                      ) : (
                        <Tag style={{ margin: 0, background: isDarkMode ? 'rgba(140, 70, 255, 0.15)' : '#e2e8f0', color: isDarkMode ? 'rgba(200,160,255,0.8)' : '#64748b' }}>Missing</Tag>
                      )}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <strong style={{ fontSize: 14, color: 'var(--color-text-primary)', display: 'block' }}>{mapping.label}</strong>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginTop: 2 }}>
                        {doc ? doc.DocName || doc.docName : 'No file uploaded'}
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: 'var(--border-glass)', marginTop: 16, paddingTop: 12, display: 'flex', gap: 8 }}>
                    {doc ? (
                      <>
                        <Button 
                          size="small" 
                          icon={<EyeOutlined />} 
                          style={{ flex: 1, borderRadius: 6 }}
                          onClick={() => {
                            Modal.info({
                              title: mapping.label,
                              width: 500,
                              content: (
                                <div style={{ padding: '10px 0' }}>
                                  <Descriptions column={1} size="small" bordered>
                                    <Descriptions.Item label="File Name">{doc.docName}</Descriptions.Item>
                                    <Descriptions.Item label="Size">{(doc.fileSize / 1024).toFixed(1)} KB</Descriptions.Item>
                                    <Descriptions.Item label="Uploaded At">{dayjs(doc.uploadedAt).format('DD MMM YYYY, hh:mm A')}</Descriptions.Item>
                                    <Descriptions.Item label="Verification">{doc.isVerified ? 'Verified by Administrator' : 'Pending review'}</Descriptions.Item>
                                  </Descriptions>
                                </div>
                              )
                            })
                          }}
                        >
                          Details
                        </Button>
                        <Button 
                          size="small" 
                          icon={<DownloadOutlined />} 
                          type="primary"
                          style={{ flex: 1, borderRadius: 6, background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', fontWeight: 600 }}
                          onClick={() => {
                            const url = employeeService.getDocumentDownloadUrl(id, doc.docId)
                            window.open(url, '_blank')
                          }}
                        >
                          Download
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="small" 
                        icon={<UploadOutlined />} 
                        style={{ flex: 1, borderRadius: 6 }}
                        onClick={() => triggerFileUpload(key)}
                      >
                        Upload
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>
      ),
    },
    {
      key: 'bank',
      label: <span><BankOutlined /> Bank Details</span>,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {banks && banks.length > 0 ? (
            <Row gutter={[16, 16]}>
              {banks.map((b) => (
                <Col xs={24} md={16} lg={14} key={b.bankDetailId}>
                  <Card
                    className="premium-bank-card"
                    style={{
                      borderRadius: 16,
                      position: 'relative',
                      overflow: 'hidden',
                      height: 185
                    }}
                  >
                    <div style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(250, 167, 26, 0.15)', filter: 'blur(30px)', pointerEvents: 'none' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Bank</div>
                        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: '#ffffff' }}>{b.bankName}</div>
                      </div>
                      <span style={{ fontSize: 22, color: '#FAA71A' }}><CreditCardOutlined /></span>
                    </div>

                    <div style={{ zIndex: 1 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Primary Account Number</div>
                      <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.08em', marginTop: 2, color: '#ffffff' }}>{b.maskedAccountNumber}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 100 }}>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IFSC Code</span>
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace', color: '#ffffff', marginTop: 2 }}>{b.ifscCode}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                        <Tag style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 9, border: 'none', margin: 0 }}>{b.accountType}</Tag>
                        {b.isPrimary && <Tag style={{ background: '#FAA71A', color: '#10113F', fontWeight: 700, border: 'none', fontSize: 9, margin: 0 }}>PRIMARY</Tag>}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <EmptyState
              title="No bank accounts configured"
              description="No bank accounts have been configured for your profile. Contact HR to link accounts."
            />
          )}

          <Card title="Bank Account Details Summary" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', overflow: 'hidden' }}>
            <Table columns={bankColumns} dataSource={banks || []} rowKey="bankDetailId" pagination={false}
              locale={{ emptyText: <EmptyState title="No bank details added" /> }} />
          </Card>
        </div>
      ),
    },
    {
      key: 'career',
      label: <span><BookOutlined /> Education & Experience</span>,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Education card */}
          <Card 
            title="Academic Qualifications" 
            extra={
              !isEduBackend && (
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleOpenAddEdu} style={{ borderRadius: 6 }}>
                  Add Education
                </Button>
              )
            }
            style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}
          >
            {isEduBackend && (
              <div style={{ marginBottom: 12 }}>
                <Tag color="blue"><SafetyCertificateOutlined /> Synced from backend (Read Only)</Tag>
              </div>
            )}
            
            {activeEduList.length === 0 ? (
              <EmptyState
                title="No academic records found"
                description="Add degree or qualifications."
                action={!isEduBackend ? handleOpenAddEdu : undefined}
                actionLabel="Add Education"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeEduList.map((edu, idx) => (
                  <div key={edu.key || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 10, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{edu.degree}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>{edu.school} · Completed in {edu.year}</p>
                      {edu.grade && <Tag style={{ background: '#FAA71A', color: '#10113F', fontWeight: 700, marginTop: 8, border: 'none', fontSize: 10 }}>{edu.grade}</Tag>}
                    </div>
                    {!isEduBackend && (
                      <Space>
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenEditEdu(edu)} />
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteEdu(edu.key)} />
                      </Space>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Experience card */}
          <Card 
            title="Professional Experience" 
            extra={
              !isExpBackend && (
                <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleOpenAddExp} style={{ borderRadius: 6 }}>
                  Add Experience
                </Button>
              )
            }
            style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}
          >
            {isExpBackend && (
              <div style={{ marginBottom: 12 }}>
                <Tag color="blue"><SafetyCertificateOutlined /> Synced from backend (Read Only)</Tag>
              </div>
            )}

            {activeExpList.length === 0 ? (
              <EmptyState
                title="No professional experience records found"
                description="Add past employments."
                action={!isExpBackend ? handleOpenAddExp : undefined}
                actionLabel="Add Experience"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeExpList.map((exp, idx) => (
                  <div key={exp.key || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', borderRadius: 10, border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{exp.role}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>{exp.company} | {exp.start} - {exp.end}</p>
                      {exp.details && <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--color-text-secondary)', borderLeft: '2px solid #FAA71A', paddingLeft: 8 }}>{exp.details}</p>}
                    </div>
                    {!isExpBackend && (
                      <Space>
                        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleOpenEditExp(exp)} />
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteExp(exp.key)} />
                      </Space>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'timeline',
      label: <span><HistoryOutlined /> Timeline</span>,
      children: (
        <Card title="Employee Lifecycle Milestones" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', padding: '16px 8px' }}>
          <Timeline
            mode="left"
            items={[
              {
                label: dayjs(profile.joiningDate).format('DD MMM YYYY'),
                children: (
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>Joined the Organization</h4>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Onboarded as {profile.employmentType} - {profile.designationTitle} in the {profile.departmentName} department.
                    </p>
                  </div>
                ),
                color: '#FAA71A',
              },
              ...(profile.confirmationDate ? [{
                label: dayjs(profile.confirmationDate).format('DD MMM YYYY'),
                children: (
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>Employment Confirmed</h4>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Probation period successfully completed and confirmed.
                    </p>
                  </div>
                ),
                color: isDarkMode ? '#FAA71A' : '#10113F',
              }] : []),
              ...(salaryHistory || []).map((sal, idx) => ({
                label: dayjs(sal.effectiveFrom).format('DD MMM YYYY'),
                children: (
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      Salary Revision {sal.isActive ? <Tag color="success" style={{ marginLeft: 8 }}>Active</Tag> : null}
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      Revised Gross CTC: <strong>{hasPayrollView ? `₹${Number(sal.grossCTC).toLocaleString('en-IN')}` : '₹ ****'}</strong>. {hasPayrollView ? `Reason: ${sal.revisionReason || 'Annual Revision'}.` : ''}
                    </p>
                  </div>
                ),
                color: sal.isActive ? 'green' : 'gray',
              })),
            ]}
          />
        </Card>
      ),
    },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="My Profile"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'My Profile' }]}
        actions={
          editing ? (
            <Space>
              <Button onClick={() => setEditing(false)} style={{ borderRadius: 8 }}>Cancel</Button>
              <Button type="primary" icon={<SaveOutlined />} loading={updateMutation.isPending} onClick={handleSave}
                style={{ borderRadius: 8, fontWeight: 600 }}>Save Changes</Button>
            </Space>
          ) : (
            <Button icon={<EditOutlined />} onClick={() => { setEditing(true); form.setFieldsValue(profile) }} style={{ borderRadius: 8 }}>
              Edit Personal Info
            </Button>
          )
        }
      />

      <Row gutter={[24, 24]}>
        {/* Left column sticky info */}
        <Col xs={24} lg={8}>
          <div style={{ position: 'sticky', top: 80 }}>
            <Card
              style={{
                borderRadius: 16,
                border: 'var(--border-glass)',
                background: 'var(--color-card-bg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-subtle)'
              }}
              bodyStyle={{ padding: '28px 24px 24px' }}
            >
              {/* Cover vector */}
              <div style={{ height: 75, background: 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0 }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    size={96}
                    src={getAvatarUrl(profile.profilePhoto)}
                    style={{
                      border: isDarkMode ? '4px solid var(--color-surface)' : '4px solid #fff',
                      background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)',
                      fontSize: 32,
                      fontWeight: 800,
                      boxShadow: 'var(--shadow-medium)',
                    }}
                  >
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </Avatar>
                  <Tooltip title="Upload profile photo">
                    <button
                      onClick={() => photoRef.current?.click()}
                      style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#FAA71A', border: isDarkMode ? '2px solid var(--color-surface)' : '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                      {photoMutation.isPending ? <Spin size="small" /> : <CameraOutlined style={{ color: '#10113F', fontSize: 13 }} />}
                    </button>
                  </Tooltip>
                  <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </div>

                <h2 style={{ margin: '16px 0 4px', fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', textAlign: 'center' }}>
                  {fullName}
                </h2>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>{profile.employeeCode}</span>
                  <StatusBadge status={profile.employmentStatus} size="small" />
                </div>

                {/* Premium Metadata Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px', justifyContent: 'center', width: '100%', margin: '14px 0 6px' }}>
                  {profile.gradeName && <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>Grade: {profile.gradeName}</Tag>}
                  {profile.bandName && <Tag color="purple" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{profile.bandName}</Tag>}
                  {profile.jobFamilyName && <Tag color="cyan" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{profile.jobFamilyName}</Tag>}
                  {profile.employmentType && <Tag color="gold" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{EMPLOYMENT_TYPE.find(t => t.value === profile.employmentType)?.label || profile.employmentType}</Tag>}
                  {profile.workMode && <Tag color="green" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{WORK_MODE.find(w => w.value === profile.workMode)?.label || profile.workMode}</Tag>}
                  {profile.shiftName && <Tag color="magenta" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>Shift: {profile.shiftName}</Tag>}
                  {profile.payrollGroup && <Tag color="orange" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>{PAYROLL_GROUP.find(p => p.value === profile.payrollGroup)?.label || profile.payrollGroup}</Tag>}
                  {profile.costCenterName && <Tag color="geekblue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>CC: {profile.costCenterName}</Tag>}
                </div>

                {/* Profile Completion Indicator */}
                <div style={{ width: '100%', marginTop: 20, background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', padding: 12, borderRadius: 12, border: isDarkMode ? 'var(--border-glass)' : '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Profile Completion</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>{completionPercentage}%</span>
                  </div>
                  <Progress percent={completionPercentage} showInfo={false} strokeColor="#FAA71A" trailColor={isDarkMode ? 'rgba(160, 90, 255, 0.2)' : '#e2e8f0'} size="small" />
                  
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

                <div style={{ width: '100%', borderTop: 'var(--border-glass)', margin: '20px 0' }} />

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#FAA71A', fontSize: 16 }}><ApartmentOutlined /></span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Department & Role</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{profile.designationTitle || '—'} · {profile.departmentName || '—'}</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#FAA71A', fontSize: 16 }}><EnvironmentOutlined /></span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Location</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{profile.locationName || '—'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#FAA71A', fontSize: 16 }}><MailOutlined /></span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Official Email</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{profile.officialEmail || '—'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#FAA71A', fontSize: 16 }}><CalendarOutlined /></span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Joined Date</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{dayjs(profile.joiningDate).format('DD MMMM YYYY')}</div>
                    </div>
                  </div>

                  {managerObj && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate(`/employees/${managerObj.employeeId}`)}>
                      <span style={{ color: '#FAA71A', fontSize: 16 }}><UserOutlined /></span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Manager (Click to view)</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', textDecoration: 'underline' }}>{managerObj.firstName} {managerObj.lastName}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </Col>

        {/* Right column detailed tabs */}
        <Col xs={24} lg={16}>
          <Tabs 
            items={tabs} 
            defaultActiveKey="overview" 
            style={{ 
              background: 'var(--color-card-bg)', 
              borderRadius: 16, 
              padding: '12px 24px 24px', 
              border: 'var(--border-glass)', 
              boxShadow: 'var(--shadow-subtle)' 
            }} 
          />
        </Col>
      </Row>

      {/* Add/Edit Education Modal */}
      <Modal
        title={editingEdu ? "Edit Academic Qualification" : "Add Academic Qualification"}
        open={isEduModalOpen}
        onCancel={() => setIsEduModalOpen(false)}
        onOk={() => eduForm.submit()}
        destroyOnClose
      >
        <Form form={eduForm} layout="vertical" onFinish={handleSaveEdu} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
          <Form.Item name="degree" label="Degree / Qualification" rules={[VALIDATORS.required('Degree / Qualification')]}>
            <Input placeholder="e.g. Master of Business Administration (MBA)" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="school" label="School / University" rules={[VALIDATORS.required('School / University')]}>
            <Input placeholder="e.g. Indian Institute of Management, Ahmedabad" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item 
            name="year" 
            label="Year of Completion" 
            rules={[
              VALIDATORS.required('Year of Completion'),
              VALIDATORS.passingYear()
            ]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
          >
            <Input maxLength={4} placeholder="e.g. 2018" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="grade" label="Grade / CGPA / Percentage (Optional)">
            <Input placeholder="e.g. 8.5 CGPA" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add/Edit Experience Modal */}
      <Modal
        title={editingExp ? "Edit Work Experience" : "Add Work Experience"}
        open={isExpModalOpen}
        onCancel={() => setIsExpModalOpen(false)}
        onOk={() => expForm.submit()}
        destroyOnClose
      >
        <Form form={expForm} layout="vertical" onFinish={handleSaveExp} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
          <Form.Item name="role" label="Job Title / Designation" rules={[VALIDATORS.required('Job Title / Designation')]}>
            <Input placeholder="e.g. Lead Frontend Architect" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="company" label="Company Name" rules={[VALIDATORS.required('Company Name')]}>
            <Input placeholder="e.g. Google India Pvt Ltd" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="start" label="Start Date (Month Year)" rules={[VALIDATORS.required('Start Date')]}>
            <Input placeholder="e.g. Jun 2021" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="end" label="End Date (Month Year)" rules={[VALIDATORS.required('End Date')]}>
            <Input placeholder="e.g. Dec 2023 or Present" style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="details" label="Roles & Responsibilities (Optional)">
            <Input.TextArea rows={4} placeholder="Describe your key achievements and core duties..." style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
