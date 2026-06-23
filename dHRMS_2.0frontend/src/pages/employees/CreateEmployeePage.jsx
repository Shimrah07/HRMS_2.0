import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, DatePicker, Steps, Card, Switch, Row, Col, Spin, notification } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { employeeService } from '../../services/employeeService'
import { organizationService } from '../../services/organizationService'
import PageHeader from '../../components/common/PageHeader'
import { GENDER, BLOOD_GROUP, MARITAL_STATUS, EMPLOYMENT_TYPE } from '../../constants/enums'
import { VALIDATORS, NORMALIZE, FILTER_KEYPRESS } from '../../constants/validation'

const { Option } = Select

export default function CreateEmployeePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [form] = Form.useForm()

  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: organizationService.getDepartments, select: (r) => r?.data || [] })
  const { data: desigData } = useQuery({ queryKey: ['designations'], queryFn: organizationService.getDesignations, select: (r) => r?.data || [] })
  const { data: locData } = useQuery({ queryKey: ['locations'], queryFn: organizationService.getLocations, select: (r) => r?.data || [] })

  // Fetch all employees to populate Reporting Manager options
  const { data: allEmpsRes } = useQuery({
    queryKey: ['all-employees-lookup'],
    queryFn: () => employeeService.getEmployees({ pageSize: 10000 }),
  })
  const allEmployees = allEmpsRes?.data || []

  // Fetch employee details in Edit Mode
  const { data: emp, isLoading: empLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeeService.getEmployee(id),
    enabled: isEdit,
    select: (res) => res?.data,
  })

  useEffect(() => {
    if (isEdit && emp) {
      const initialValues = {
        ...emp,
        joiningDate: emp.joiningDate ? dayjs(emp.joiningDate) : undefined,
        dateOfBirth: emp.dateOfBirth ? dayjs(emp.dateOfBirth) : undefined,
      }
      form.setFieldsValue(initialValues)
      setFormData(initialValues)
    }
  }, [isEdit, emp, form])

  const flattenDepts = (arr) => { const r = []; const walk = (a) => a.forEach((d) => { r.push(d); if (d.children) walk(d.children) }); walk(arr || []); return r }
  const depts = flattenDepts(deptData)

  const createMutation = useMutation({
    mutationFn: employeeService.createEmployee,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Employee Onboarded',
          description: 'Employee profile has been initialized successfully.',
          placement: 'topRight'
        })
        navigate(`/employees/${res.data.employeeId}`)
      } else {
        notification.error({
          message: 'Onboarding Failed',
          description: res.message || 'Unable to create the employee record.',
          placement: 'topRight'
        })
      }
    },
    onError: (err) => {
      let errMsg = 'An error occurred while communicating with the server.'
      if (err.response?.data) {
        if (err.response.data.message) {
          errMsg = err.response.data.message
        } else if (err.response.data.errors) {
          const errorsObj = err.response.data.errors
          const messages = []
          Object.keys(errorsObj).forEach((field) => {
            if (Array.isArray(errorsObj[field])) {
              messages.push(...errorsObj[field])
            } else {
              messages.push(errorsObj[field])
            }
          })
          if (messages.length > 0) {
            errMsg = messages.join(' | ')
          }
        }
      }
      notification.error({
        message: 'Submission Error',
        description: errMsg,
        placement: 'topRight'
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload) => employeeService.updateEmployee(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Profile Updated',
          description: 'Employee profile has been saved successfully.',
          placement: 'topRight'
        })
        navigate(`/employees/${id}`)
      } else {
        notification.error({
          message: 'Update Failed',
          description: res.message || 'Unable to update the employee record.',
          placement: 'topRight'
        })
      }
    },
    onError: (err) => {
      let errMsg = 'An error occurred while communicating with the server.'
      if (err.response?.data) {
        if (err.response.data.message) {
          errMsg = err.response.data.message
        } else if (err.response.data.errors) {
          const errorsObj = err.response.data.errors
          const messages = []
          Object.keys(errorsObj).forEach((field) => {
            if (Array.isArray(errorsObj[field])) {
              messages.push(...errorsObj[field])
            } else {
              messages.push(errorsObj[field])
            }
          })
          if (messages.length > 0) {
            errMsg = messages.join(' | ')
          }
        }
      }
      notification.error({
        message: 'Update Error',
        description: errMsg,
        placement: 'topRight'
      })
    },
  })

  const steps = isEdit
    ? [
        { title: 'Personal Info', description: 'Basic personal details' },
        { title: 'Employment', description: 'Role and position details' },
      ]
    : [
        { title: 'Personal Info', description: 'Basic personal details' },
        { title: 'Employment', description: 'Role and position details' },
        { title: 'Account', description: 'System access setup' },
      ]

  const handleNext = async () => {
    try {
      const stepFields = currentStep === 0
        ? ['firstName', 'middleName', 'lastName', 'officialEmail', 'personalEmail', 'gender', 'dateOfBirth', 'maritalStatus', 'bloodGroup', 'personalPhone', 'nationality']
        : ['deptId', 'designationId', 'locationId', 'employmentType', 'joiningDate', 'probationPeriodDays', 'permanentAddress', 'reportingManagerId']
      const values = await form.validateFields(stepFields)
      setFormData((prev) => ({ ...prev, ...values }))
      setCurrentStep((s) => s + 1)
    } catch (_) {}
  }

  const handleBack = () => setCurrentStep((s) => s - 1)

  const handleSubmit = async () => {
    try {
      // Validate all fields across all steps
      const values = await form.validateFields()
      const finalFormData = { ...formData, ...values }
      
      // Clean payload: remove empty strings, convert probationPeriodDays to integer, format dates
      const cleaned = {}
      Object.keys(finalFormData).forEach((key) => {
        const val = finalFormData[key]
        if (val !== undefined && val !== null && val !== '') {
          cleaned[key] = val
        }
      })
      if (!isEdit && finalFormData.createUserAccount === false) {
        cleaned.createUserAccount = false
      }

      const payload = { 
        ...cleaned,
        probationPeriodDays: cleaned.probationPeriodDays !== undefined ? parseInt(cleaned.probationPeriodDays, 10) : 90,
        joiningDate: cleaned.joiningDate ? cleaned.joiningDate.format('YYYY-MM-DD') : undefined,
        dateOfBirth: cleaned.dateOfBirth ? cleaned.dateOfBirth.format('YYYY-MM-DD') : undefined,
      }

      if (isEdit) {
        // Clean fields not needed/allowed in backend update schema
        delete payload.createUserAccount
        delete payload.initialPassword
        delete payload.employeeCode
        delete payload.departmentName
        delete payload.designationTitle
        delete payload.locationName
        delete payload.costCenterName
        delete payload.confirmDate
        delete payload.confirmationDate
        delete payload.profilePhoto
        delete payload.employmentStatus
        delete payload.isActive
        
        updateMutation.mutate(payload)
      } else {
        createMutation.mutate(payload)
      }
    } catch (_) {}
  }

  // Cycle detection logic to prevent circular reporting manager chains
  const getDescendants = (empId, employeesList) => {
    const descendants = new Set()
    const queue = [empId]
    while (queue.length > 0) {
      const currentId = queue.shift()
      const reports = employeesList.filter((e) => e.reportingManagerId === currentId)
      reports.forEach((r) => {
        if (!descendants.has(r.employeeId)) {
          descendants.add(r.employeeId)
          queue.push(r.employeeId)
        }
      })
    }
    return descendants
  }

  const descendants = isEdit ? getDescendants(id, allEmployees) : new Set()
  const managerOptions = allEmployees
    .filter((e) => {
      if (isEdit && e.employeeId === id) return false
      if (isEdit && descendants.has(e.employeeId)) return false
      return true
    })
    .map((e) => ({
      value: e.employeeId,
      label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
    }))

  if (isEdit && empLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  const stepForms = [
    // Step 0: Personal Info
    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}><Form.Item name="firstName" label="First Name" rules={[VALIDATORS.required('First Name')]}><Input placeholder="e.g. John" style={{ borderRadius: 8 }} /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="middleName" label="Middle Name"><Input placeholder="e.g. Kumar (Optional)" style={{ borderRadius: 8 }} /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="lastName" label="Last Name" rules={[VALIDATORS.required('Last Name')]}><Input placeholder="e.g. Doe" style={{ borderRadius: 8 }} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="officialEmail" label="Official Email" extra="e.g. john@company.com" rules={[VALIDATORS.required('Official Email'), VALIDATORS.email]}><Input placeholder="Enter official work email" style={{ borderRadius: 8 }} disabled={isEdit} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="personalEmail" label="Personal Email" extra="e.g. john@gmail.com" rules={[VALIDATORS.personalEmail]}><Input placeholder="Enter personal email (Optional)" style={{ borderRadius: 8 }} /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="gender" label="Gender" rules={[VALIDATORS.requiredSelect('Gender')]}><Select style={{ borderRadius: 8 }} options={GENDER} placeholder="Select gender" /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="dateOfBirth" label="Date of Birth" rules={[VALIDATORS.required('Date of Birth'), VALIDATORS.dob()]}><DatePicker style={{ width: '100%', borderRadius: 8 }} placeholder="Select DOB" /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="maritalStatus" label="Marital Status"><Select options={MARITAL_STATUS} placeholder="Select status" /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item name="bloodGroup" label="Blood Group"><Select options={BLOOD_GROUP} placeholder="Select blood group" /></Form.Item></Col>
        <Col xs={24} md={8}>
          <Form.Item 
            name="personalPhone" 
            label="Mobile Number" 
            extra="10 digit Indian mobile (e.g. 9876543210)"
            rules={[VALIDATORS.required('Mobile Number'), VALIDATORS.phone]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
          >
            <Input maxLength={10} placeholder="Enter 10-digit number" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}><Form.Item name="nationality" label="Nationality" initialValue="Indian"><Input style={{ borderRadius: 8 }} /></Form.Item></Col>
        {!isEdit && (
          <>
            <Col xs={24} md={12}>
              <Form.Item
                name="aadharNumber"
                label="Aadhaar Number"
                extra="12 digit number (e.g. 123456789012)"
                rules={[VALIDATORS.aadhaar]}
                normalize={NORMALIZE.numeric}
                onKeyPress={FILTER_KEYPRESS.numericOnly}
              >
                <Input maxLength={12} placeholder="Enter Aadhaar Number (Optional)" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="panNumber"
                label="PAN Number"
                extra="10 char PAN (e.g. ABCDE1234F)"
                rules={[VALIDATORS.pan]}
                normalize={NORMALIZE.uppercase}
              >
                <Input maxLength={10} placeholder="Enter PAN Number (Optional)" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </>
        )}
      </Row>
    </motion.div>,
 
    // Step 1: Employment
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}><Form.Item name="deptId" label="Department" rules={[VALIDATORS.requiredSelect('Department')]}><Select placeholder="Select department" options={depts.map((d) => ({ value: d.deptId, label: d.deptName }))} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="designationId" label="Designation" rules={[VALIDATORS.requiredSelect('Designation')]}><Select placeholder="Select designation" options={(desigData || []).map((d) => ({ value: d.designationId, label: d.title }))} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="locationId" label="Location" rules={[VALIDATORS.requiredSelect('Location')]}><Select placeholder="Select office location" options={(locData || []).map((l) => ({ value: l.locationId, label: l.locationName }))} /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item name="employmentType" label="Employment Type" rules={[VALIDATORS.requiredSelect('Employment Type')]} initialValue="FullTime"><Select options={EMPLOYMENT_TYPE} /></Form.Item></Col>
        <Col xs={24} md={12}>
          <Form.Item 
            name="joiningDate" 
            label="Joining Date" 
            dependencies={['dateOfBirth']}
            rules={[
              VALIDATORS.required('Joining Date'),
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value) {
                    const dob = getFieldValue('dateOfBirth');
                    if (dob && value.isBefore(dob)) {
                      return Promise.reject(new Error("Joining date cannot be before the employee's date of birth."));
                    }
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker style={{ width: '100%', borderRadius: 8 }} placeholder="Select joining date" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item 
            name="probationPeriodDays" 
            label="Probation Period (days)" 
            initialValue={90}
            rules={[{ required: true, message: 'Please specify probation period days.' }]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
          >
            <Input type="number" placeholder="e.g. 90" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="reportingManagerId" label="Reporting Manager" extra={isEdit ? "Descendants and current employee are excluded to prevent circular chains." : ""}>
            <Select
              showSearch
              placeholder="Search & select reporting manager"
              optionFilterProp="label"
              allowClear
              options={managerOptions}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>
        <Col xs={24}><Form.Item name="permanentAddress" label="Permanent Address"><Input.TextArea rows={2} placeholder="Enter permanent address details" style={{ borderRadius: 8 }} /></Form.Item></Col>
      </Row>
    </motion.div>,

    // Step 2: Account (only for creating employee)
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Form.Item name="createUserAccount" label="Create System Account" valuePropName="checked" initialValue={true}>
        <Switch className="custom-switch" />
      </Form.Item>
      <Form.Item shouldUpdate={(prev, cur) => prev.createUserAccount !== cur.createUserAccount} noStyle>
        {({ getFieldValue }) =>
          getFieldValue('createUserAccount') && (
            <Row gutter={[16, 0]}>
              <Col xs={24} md={12}>
                <Form.Item name="initialPassword" label="Initial Password" extra="Leave blank to auto-generate">
                  <Input.Password style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            </Row>
          )
        }
      </Form.Item>
      <div style={{ 
        background: 'var(--color-surface)', 
        border: 'var(--border-glass)', 
        borderRadius: 12, 
        padding: 16, 
        marginTop: 8,
        transition: 'all 0.25s'
      }}>
        <h4 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)', fontWeight: 600 }}>Summary</h4>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 14 }}>
          {formData.firstName || ''} {formData.lastName || ''} {formData.officialEmail ? `· ${formData.officialEmail}` : ''}
        </p>
      </div>
    </motion.div>,
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={isEdit ? "Edit Employee Details" : "Add New Employee"}
        breadcrumbs={[
          { label: 'Home', path: '/dashboard' },
          { label: 'Employees', path: '/employees' },
          { label: isEdit ? 'Edit Employee' : 'New Employee' }
        ]}
      />

      <Card className="premium-glass-card" style={{ maxWidth: 860, margin: '0 auto' }}>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 36 }} />

        <Form 
          form={form} 
          layout="vertical" 
          requiredMark="optional" 
          preserve={true}
          validateTrigger={['onBlur', 'onChange']}
          scrollToFirstError={{ focusFirstInput: true }}
        >
          {stepForms[currentStep]}
        </Form>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 20, borderTop: 'var(--border-glass)' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={currentStep === 0 ? () => navigate(isEdit ? `/employees/${id}` : '/employees') : handleBack} 
            style={{ borderRadius: 8 }}
            disabled={isEdit ? updateMutation.isPending : createMutation.isPending}
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          {currentStep < (isEdit ? 1 : 2) ? (
            <Button 
              type="primary" 
              onClick={handleNext} 
              icon={<ArrowRightOutlined />} 
              style={{ borderRadius: 8 }}
              disabled={isEdit ? updateMutation.isPending : createMutation.isPending}
            >
              Continue
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              icon={<CheckOutlined />} 
              loading={isEdit ? updateMutation.isPending : createMutation.isPending} 
              disabled={isEdit ? updateMutation.isPending : createMutation.isPending}
              style={{ borderRadius: 8 }}
            >
              {isEdit ? 'Save Changes' : 'Create Employee'}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
