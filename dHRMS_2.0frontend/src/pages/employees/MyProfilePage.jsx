import { useState, useEffect } from 'react'
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
  CreditCardOutlined, SafetyCertificateOutlined, ArrowDownOutlined, ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import { employeeService } from '../../services/employeeService'
import useAuthStore from '../../store/authStore'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import EmptyState from '../../components/common/EmptyState'
import useUIStore from '../../store/uiStore'
import { VALIDATORS, NORMALIZE, FILTER_KEYPRESS } from '../../constants/validation'

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
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: employeeService.getMyProfile,
    select: (res) => res?.data,
  })

  const id = profile?.employeeId

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
    updateMutation.mutate(values)
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
                  <Col xs={24} sm={8}>
                    <Form.Item name="emergencyContactName" label="Emergency Contact Name" rules={[VALIDATORS.required('Emergency Contact Name')]}>
                      <Input placeholder="e.g. Rajesh Kumar" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
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
                  <Col xs={24} sm={8}>
                    <Form.Item name="emergencyContactRelation" label="Relation" rules={[VALIDATORS.required('Relation')]}>
                      <Input placeholder="e.g. Father" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item name="currentAddress" label="Current Address" rules={[VALIDATORS.required('Current Address')]}>
                      <Input placeholder="e.g. Flat 302, Green Apartments" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item name="currentCity" label="City" rules={[VALIDATORS.required('City')]}>
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
                <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                  <Descriptions.Item label="Date of Birth">{profile.dateOfBirth ? dayjs(profile.dateOfBirth).format('DD MMM YYYY') : '—'}</Descriptions.Item>
                  <Descriptions.Item label="Gender">{profile.gender || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Blood Group">{profile.bloodGroup || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Marital Status">{profile.maritalStatus || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Personal Email">{profile.personalEmail || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Personal Phone">{profile.personalPhone || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Permanent Address" span={2}>{profile.permanentAddress || '—'}</Descriptions.Item>
                </Descriptions>
              </Card>
              <Card title="Emergency Contacts & Current Address" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                  <Descriptions.Item label="Emergency Contact">{profile.emergencyContactName || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Relationship">{profile.emergencyContactRelation || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Emergency Phone" span={2}>
                    {profile.emergencyContactPhone ? <a href={`tel:${profile.emergencyContactPhone}`}>{profile.emergencyContactPhone}</a> : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Current Address" span={2}>{profile.currentAddress || '—'}</Descriptions.Item>
                  <Descriptions.Item label="City">{profile.currentCity || '—'}</Descriptions.Item>
                  <Descriptions.Item label="State">{profile.currentState || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Pincode" span={2}>{profile.currentPincode || '—'}</Descriptions.Item>
                </Descriptions>
              </Card>
              <Card title="Government Identifiers" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
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
          <Card title="Employment Details" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Joining Date">{dayjs(profile.joiningDate).format('DD MMM YYYY')}</Descriptions.Item>
              <Descriptions.Item label="Confirmation Date">{profile.confirmationDate ? dayjs(profile.confirmationDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
              <Descriptions.Item label="Department">{profile.departmentName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Designation">{profile.designationTitle || '—'}</Descriptions.Item>
              <Descriptions.Item label="Location">{profile.locationName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Cost Center">{profile.costCenterName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Employment Type"><StatusBadge status={profile.employmentType} size="small" /></Descriptions.Item>
              <Descriptions.Item label="Official Email">{profile.officialEmail || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Probation Details" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Probation End Date">{profile.probationEndDate ? dayjs(profile.probationEndDate).format('DD MMM YYYY') : '—'}</Descriptions.Item>
              <Descriptions.Item label="Probation Status">
                {profile.confirmationDate ? (
                  <Tag color="success">Completed</Tag>
                ) : (
                  <Tag color="processing">In Progress</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Status Note" span={2}>
                {profile.confirmationDate 
                  ? 'Employment confirmed in standard services.' 
                  : `Probation in progress. End date configured as ${profile.probationEndDate ? dayjs(profile.probationEndDate).format('DD MMM YYYY') : '—'}.`
                }
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
        <Card title="Reporting Hierarchy" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', padding: '20px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Manager Box */}
            <div style={{ textAlign: 'center', marginBottom: 8, width: 280 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700, letterSpacing: '0.04em' }}>
                Reporting Manager
              </div>
              {managerObj ? (
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  onClick={() => navigate(`/employees/${managerObj.employeeId}`)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    padding: '12px 20px', 
                    background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', 
                    borderRadius: 14, 
                    border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <Avatar src={managerObj.profilePhoto} style={{ background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff' }}>
                    {managerObj.firstName?.[0]}{managerObj.lastName?.[0]}
                  </Avatar>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{managerObj.firstName} {managerObj.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{managerObj.designationTitle}</div>
                  </div>
                </motion.div>
              ) : (
                <div style={{ padding: '12px 20px', background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f1f5f9', borderRadius: 14, border: isDarkMode ? '1.5px dashed rgba(255,255,255,0.15)' : '1.5px dashed #cbd5e1', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600 }}>
                  Board of Directors (No Manager)
                </div>
              )}
            </div>

            {/* Link line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 40 }}>
              <div style={{ width: 2, flex: 1, background: '#FAA71A' }} />
              <ArrowDownOutlined style={{ color: '#FAA71A', fontSize: 14, marginTop: -6 }} />
            </div>

            {/* Current Active Employee (Self) */}
            <div style={{ textAlign: 'center', width: 310, margin: '8px 0' }}>
              <div style={{ fontSize: 11, color: 'rgba(16,17,63,0.5)', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700, letterSpacing: '0.04em' }}>
                Current Position (You)
              </div>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 14, 
                  padding: '16px 24px', 
                  background: 'rgba(250, 167, 26, 0.08)', 
                  borderRadius: 16, 
                  border: '2px solid #FAA71A', 
                  boxShadow: '0 8px 16px rgba(250, 167, 26, 0.1)',
                  textAlign: 'left'
                }}
              >
                <Avatar size={48} src={profile.profilePhoto} style={{ background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)', fontWeight: 700 }}>
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </Avatar>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#10113F', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{fullName}</div>
                  <div style={{ fontSize: 12, color: 'rgba(16,17,63,0.7)', marginTop: 2, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{profile.designationTitle}</div>
                  <div style={{ fontSize: 11, color: 'rgba(16,17,63,0.5)', fontFamily: 'monospace' }}>{profile.employeeCode}</div>
                </div>
              </div>
            </div>

            {/* Link line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: 40 }}>
              <div style={{ width: 2, flex: 1, background: '#FAA71A' }} />
              <ArrowDownOutlined style={{ color: '#FAA71A', fontSize: 14, marginTop: -6 }} />
            </div>

            {/* Direct Reports */}
            <div style={{ textAlign: 'center', width: '100%', padding: '0 24px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
                Direct Reports ({directReports.length})
              </div>
              {directReports.length > 0 ? (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {directReports.map((dr) => (
                    <motion.div
                      key={dr.employeeId}
                      whileHover={{ y: -3, scale: 1.01 }}
                      onClick={() => navigate(`/employees/${dr.employeeId}`)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        padding: '10px 16px', 
                        background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', 
                        borderRadius: 12, 
                        border: isDarkMode ? 'var(--border-glass)' : '1px solid #e2e8f0', 
                        boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: 220
                      }}
                    >
                      <Avatar src={dr.profilePhoto} style={{ background: isDarkMode ? 'var(--color-card-bg)' : '#FAA71A', color: isDarkMode ? '#FAA71A' : '#10113F', fontWeight: 600 }}>
                        {dr.firstName?.[0]}{dr.lastName?.[0]}
                      </Avatar>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{dr.firstName} {dr.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{dr.designationTitle}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'inline-block', padding: '12px 24px', background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: 12, border: isDarkMode ? '1.5px dashed rgba(255,255,255,0.15)' : '1.5px dashed #e2e8f0', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 500 }}>
                  No direct reports assigned
                </div>
              )}
            </div>
            
          </div>
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
                        <Tag style={{ margin: 0, background: isDarkMode ? '#1a2155' : '#e2e8f0', color: isDarkMode ? '#aaa' : '#64748b' }}>Missing</Tag>
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
                <Col xs={24} md={12} key={b.bankDetailId}>
                  <Card
                    style={{
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #10113F 0%, #1c1d5b 100%)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 8px 20px rgba(16, 17, 63, 0.2)',
                      position: 'relative',
                      overflow: 'hidden',
                      height: 180
                    }}
                  >
                    <div style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(250, 167, 26, 0.15)', filter: 'blur(30px)' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Corporate Bank</div>
                        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{b.bankName}</div>
                      </div>
                      <span style={{ fontSize: 24, color: '#FAA71A' }}><CreditCardOutlined /></span>
                    </div>

                    <div style={{ marginTop: 24 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Primary Account Number</div>
                      <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.1em', marginTop: 4 }}>{b.maskedAccountNumber}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                      <div>
                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>IFSC: </span>
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{b.ifscCode}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
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
                      Revised Gross CTC: <strong>₹{Number(sal.grossCTC).toLocaleString('en-IN')}</strong>. Reason: {sal.revisionReason || 'Annual Revision'}.
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
                <Avatar
                  size={96}
                  src={profile.profilePhoto}
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

                <h2 style={{ margin: '16px 0 4px', fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', textAlign: 'center' }}>
                  {fullName}
                </h2>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>{profile.employeeCode}</span>
                  <StatusBadge status={profile.employmentStatus} size="small" />
                </div>

                {/* Profile Completion Indicator */}
                <div style={{ width: '100%', marginTop: 20, background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#f8fafc', padding: 12, borderRadius: 12, border: isDarkMode ? 'var(--border-glass)' : '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Profile Completion</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>{completionPercentage}%</span>
                  </div>
                  <Progress percent={completionPercentage} showInfo={false} strokeColor="#FAA71A" trailColor={isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'} size="small" />
                  
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
