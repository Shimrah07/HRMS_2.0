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
import { GENDER, BLOOD_GROUP, MARITAL_STATUS, EMPLOYMENT_TYPE, WORK_MODE, WEEKLY_OFF_PATTERN, PAYROLL_GROUP, EMPLOYEE_TITLE, EMPLOYEE_CATEGORY, PWD_STATUS, MOTHER_TONGUE, RELATIONSHIP } from '../../constants/enums'
import { VALIDATORS, NORMALIZE, FILTER_KEYPRESS } from '../../constants/validation'
import { COUNTRIES, STATES_BY_COUNTRY, CITIES_BY_STATE } from '../../constants/indianLocations'

const { Option } = Select

const capitalizeName = (value) => {
  if (!value) return value
  return value.replace(/\b\w/g, char => char.toUpperCase()).replace(/\B\w/g, char => char.toLowerCase())
}

export default function CreateEmployeePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [form] = Form.useForm()

  // State to track parent selections for filtering dropdowns
  const [selectedBU, setSelectedBU] = useState(null)
  const [selectedDept, setSelectedDept] = useState(null)
  const [selectedSubDept, setSelectedSubDept] = useState(null)
  const [selectedJobFamily, setSelectedJobFamily] = useState(null)
  const [selectedEmpType, setSelectedEmpType] = useState('FullTime')

  // ─── Lookup Data Queries ──────────────────────────────────────────
  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: organizationService.getDepartments, select: (r) => r?.data || [] })
  const { data: desigData } = useQuery({ queryKey: ['designations'], queryFn: organizationService.getDesignations, select: (r) => r?.data || [] })
  const { data: locData } = useQuery({ queryKey: ['locations'], queryFn: organizationService.getLocations, select: (r) => r?.data || [] })
  
  const { data: companyRes } = useQuery({ queryKey: ['company'], queryFn: organizationService.getCompany })
  const companyData = companyRes?.data
  const companyDomain = companyData?.website 
    ? companyData.website.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase()
    : (companyData?.email ? companyData.email.split('@')[1].toLowerCase() : 'company.com')
  
  const { data: buRes } = useQuery({ queryKey: ['business-units'], queryFn: organizationService.getBusinessUnits, select: (r) => r?.data || [] })
  const { data: divRes } = useQuery({ queryKey: ['divisions'], queryFn: () => organizationService.getDivisions(), select: (r) => r?.data || [] })
  const { data: subDeptRes } = useQuery({ queryKey: ['sub-departments'], queryFn: () => organizationService.getSubDepartments(), select: (r) => r?.data || [] })
  const { data: teamRes } = useQuery({ queryKey: ['teams'], queryFn: () => organizationService.getTeams(), select: (r) => r?.data || [] })
  
  const { data: gradeRes } = useQuery({ queryKey: ['grades'], queryFn: organizationService.getGrades, select: (r) => r?.data || [] })
  const { data: bandRes } = useQuery({ queryKey: ['bands'], queryFn: organizationService.getBands, select: (r) => r?.data || [] })
  const { data: jobFamilyRes } = useQuery({ queryKey: ['job-families'], queryFn: organizationService.getJobFamilies, select: (r) => r?.data || [] })
  const { data: jobFuncRes } = useQuery({ queryKey: ['job-functions'], queryFn: () => organizationService.getJobFunctions(), select: (r) => r?.data || [] })
  
  const { data: ccRes } = useQuery({ queryKey: ['cost-centers'], queryFn: organizationService.getCostCenters, select: (r) => r?.data || [] })
  const { data: pcRes } = useQuery({ queryKey: ['profit-centers'], queryFn: organizationService.getProfitCenters, select: (r) => r?.data || [] })
  const { data: shiftRes } = useQuery({ queryKey: ['shifts'], queryFn: organizationService.getShifts, select: (r) => r?.data || [] })

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
        contractEndDate: emp.contractEndDate ? dayjs(emp.contractEndDate) : undefined,
        marriageDate: emp.marriageDate ? dayjs(emp.marriageDate) : undefined,
        permanentCountry: emp.permanentCountry || 'India',
        currentCountry: emp.currentCountry || 'India',
        employeeCategory: emp.employeeCategory || 'MPOnline Employee',
        probationPeriodMonths: emp.probationPeriodDays ? Math.round(emp.probationPeriodDays / 30) : 3,
        bloodGroup: emp.bloodGroup || 'Unknown',
      }
      form.setFieldsValue(initialValues)
      setFormData(initialValues)
      setSelectedBU(emp.businessUnitId)
      setSelectedDept(emp.deptId)
      setSelectedSubDept(emp.subDeptId)
      setSelectedJobFamily(emp.jobFamilyId)
      setSelectedEmpType(emp.employmentType)
    }
  }, [isEdit, emp, form])

  const flattenDepts = (arr) => { const r = []; const walk = (a) => a.forEach((d) => { r.push(d); if (d.children) walk(d.children) }); walk(arr || []); return r }
  const depts = flattenDepts(deptData)
  const rootDepts = (deptData || [])
    .filter((d) => !d.parentDeptId)
    .slice()
    .sort((a, b) => a.deptName.localeCompare(b.deptName))

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
        ? [
            'title', 'firstName', 'middleName', 'lastName', 'fullNameAadhaar',
            'employeeCategory', 'employeeCode',
            'officialEmail', 'personalEmail', 'gender', 'dateOfBirth', 'maritalStatus',
            'spouseName', 'marriageDate', 'bloodGroup', 'personalPhone', 'nationality',
            'fatherName', 'motherTongue', 'religion', 'category', 'numberOfDependents',
            'pwdStatus', 'pwdCertificateNo',
            'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
            'uanNumber', 'esiNumber', 'npspranNumber', 'previousEmployerPFNumber',
            ...(!isEdit ? ['aadharNumber', 'panNumber'] : [])
          ]
        : [
            'deptId', 'designationId', 'locationId', 'employmentType', 'joiningDate', 'probationPeriodMonths',
            'businessUnitId', 'divisionId', 'subDeptId', 'teamId', 'gradeId', 'bandId', 'jobFamilyId', 'jobFunctionId',
            'costCenterId', 'profitCenterId', 'reportingManagerId', 'l2ReportingManagerId', 'functionalManagerId',
            'workMode', 'shiftId', 'weeklyOffPattern', 'payrollGroup', 'noticePeriodDays',
            'contractEndDate', 'internshipDurationMonths', 'vendorName',
            'officialMobile', 'alternateMobile', 'whatsAppNumber', 'extensionNumber', 'alternateEmergencyContactPhone',
            'domicileState', 'permanentAddressLine1', 'permanentAddressLine2', 'permanentCity', 'permanentTaluka', 'permanentDistrict', 'permanentState', 'permanentPincode', 'permanentCountry',
            'sameAddressFlag', 'currentAddressLine1', 'currentAddressLine2', 'currentCity', 'currentDistrict', 'currentState', 'currentPincode', 'currentCountry'
          ]
      const values = await form.validateFields(stepFields)
      setFormData((prev) => ({ ...prev, ...values }))
      setCurrentStep((s) => s + 1)
    } catch (_) {}
  }

  const handleBack = () => setCurrentStep((s) => s - 1)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const finalFormData = { ...formData, ...values }
      
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

      // Address mapping compatibility
      const permParts = [cleaned.permanentAddressLine1, cleaned.permanentAddressLine2, cleaned.permanentCity, cleaned.permanentState, cleaned.permanentCountry, cleaned.permanentPincode].filter(Boolean);
      cleaned.permanentAddress = permParts.join(', ');

      const currParts = [cleaned.currentAddressLine1, cleaned.currentAddressLine2, cleaned.currentCity, cleaned.currentState, cleaned.currentCountry, cleaned.currentPincode].filter(Boolean);
      cleaned.currentAddress = currParts.join(', ');

      const payload = { 
        ...cleaned,
        probationPeriodDays: cleaned.probationPeriodMonths !== undefined ? parseInt(cleaned.probationPeriodMonths, 10) * 30 : 90,
        bloodGroup: cleaned.bloodGroup === 'Unknown' ? null : cleaned.bloodGroup,
        joiningDate: cleaned.joiningDate ? cleaned.joiningDate.format('YYYY-MM-DD') : undefined,
        dateOfBirth: cleaned.dateOfBirth ? cleaned.dateOfBirth.format('YYYY-MM-DD') : undefined,
        marriageDate: cleaned.marriageDate ? cleaned.marriageDate.format('YYYY-MM-DD') : null,
        contractEndDate: cleaned.contractEndDate ? cleaned.contractEndDate.format('YYYY-MM-DD') : null,
        internshipDurationMonths: cleaned.internshipDurationMonths ? parseInt(cleaned.internshipDurationMonths, 10) : null,
        noticePeriodDays: cleaned.noticePeriodDays ? parseInt(cleaned.noticePeriodDays, 10) : 0,
      }

      if (isEdit) {
        delete payload.createUserAccount
        delete payload.initialPassword
        delete payload.departmentName
        delete payload.designationTitle
        delete payload.locationName
        delete payload.costCenterName
        delete payload.confirmDate
        delete payload.confirmationDate
        delete payload.profilePhoto
        delete payload.employmentStatus
        delete payload.isActive
        
        if (payload.employeeCategory !== 'TCS Employee') {
          delete payload.employeeCode
        }

        updateMutation.mutate(payload)
      } else {
        if (payload.employeeCategory !== 'TCS Employee') {
          delete payload.employeeCode
        }
        createMutation.mutate(payload)
      }
    } catch (_) {}
  }

  const fetchPincodeData = async (pincode, prefix) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
      const data = await response.json()
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
        const postOffice = data[0].PostOffice[0]
        const stateName = postOffice.State
        const districtName = postOffice.District
        const blockName = postOffice.Block !== 'NA' ? postOffice.Block : ''
        const cityName = postOffice.District || postOffice.Name

        const updates = {
          [`${prefix}Country`]: 'India',
          [`${prefix}State`]: stateName,
          [`${prefix}District`]: districtName,
          [`${prefix}Taluka`]: blockName,
          [`${prefix}City`]: cityName,
        }

        form.setFieldsValue(updates)

        // Also trigger the "sameAddressFlag" logic if applicable
        const isSame = form.getFieldValue('sameAddressFlag')
        if (prefix === 'permanent' && isSame) {
          form.setFieldsValue({
            currentCountry: 'India',
            currentState: stateName,
            currentDistrict: districtName,
            currentCity: cityName,
            currentPincode: pincode
          })
        }

        notification.success({
          message: 'Address Auto-Filled',
          description: `Located postal details for PIN ${pincode} (${cityName}, ${stateName}).`,
          placement: 'topRight',
          duration: 3
        })
      }
    } catch (error) {
      console.error('Pincode fetch error:', error)
    }
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
      if (!e.isActive) return false
      return true
    })
    .map((e) => ({
      value: e.employeeId,
      label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
    }))

  const handleGradeChange = (gradeId) => {
    const selected = (gradeRes || []).find(g => g.gradeId === gradeId)
    if (selected) {
      form.setFieldsValue({ noticePeriodDays: selected.noticePeriodDays })
    }
  }

  if (isEdit && empLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  // Dropdown filtering data
  const filteredDivisions = (divRes || []).filter(d => d.businessUnitId === selectedBU)
  const filteredSubDepts = (subDeptRes || [])
    .filter(s => s.deptId === selectedDept)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
  const filteredTeams = (teamRes || []).filter(t => t.subDeptId === selectedSubDept)
  const filteredJobFunctions = (jobFuncRes || []).filter(j => j.jobFamilyId === selectedJobFamily)

  const stepForms = [
    // Step 0: Personal Info
    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={4}>
          <Form.Item name="title" label="Title" rules={[VALIDATORS.requiredSelect('Title')]}>
            <Select options={EMPLOYEE_TITLE} placeholder="Title" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              VALIDATORS.required('First Name'),
              { pattern: /^[A-Za-z\s]{2,50}$/, message: 'Only alphabets allowed, 2-50 characters' }
            ]}
            normalize={capitalizeName}
          >
            <Input placeholder="e.g. John" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item
            name="middleName"
            label="Middle Name"
            rules={[
              { pattern: /^[A-Za-z\s]{0,50}$/, message: 'Only alphabets allowed, max 50 characters' }
            ]}
            normalize={capitalizeName}
          >
            <Input placeholder="e.g. Kumar (Optional)" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              VALIDATORS.required('Last Name'),
              { pattern: /^[A-Za-z\s]{2,50}$/, message: 'Only alphabets allowed, 2-50 characters' }
            ]}
            normalize={capitalizeName}
          >
            <Input placeholder="e.g. Doe" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={24}>
          <Form.Item name="fullNameAadhaar" label="Full Name As Per Aadhaar" rules={[VALIDATORS.required('Full Name As Per Aadhaar')]}>
            <Input placeholder="Full name exactly as on Aadhaar card" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="employeeCategory" label="Employee Category" initialValue="MPOnline Employee" rules={[VALIDATORS.requiredSelect('Employee Category')]}>
            <Select
              options={[
                { value: 'MPOnline Employee', label: 'MPOnline Employee' },
                { value: 'TCS Employee', label: 'TCS Employee' }
              ]}
              placeholder="Select category"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>
        <Form.Item shouldUpdate={(prev, cur) => prev.employeeCategory !== cur.employeeCategory} noStyle>
          {({ getFieldValue }) => {
            const isTcs = getFieldValue('employeeCategory') === 'TCS Employee'
            return (
              <Col xs={24} md={12}>
                <Form.Item
                  name="employeeCode"
                  label="Employee ID"
                  initialValue={isTcs ? '' : (isEdit ? undefined : 'Auto-generated')}
                  rules={isTcs ? [VALIDATORS.required('Employee ID')] : []}
                >
                  <Input
                    placeholder={isTcs ? "Enter TCS Employee ID" : "Auto-generated"}
                    disabled={!isTcs}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            )
          }}
        </Form.Item>
        <Col xs={24} md={12}>
          <Form.Item 
            name="officialEmail" 
            label="Official Email" 
            extra="e.g. john@company.com" 
            rules={[
              VALIDATORS.required('Official Email'), 
              VALIDATORS.email,
              () => ({
                validator(_, value) {
                  if (value && companyDomain) {
                    const domain = companyDomain.toLowerCase();
                    if (!value.toLowerCase().endsWith('@' + domain)) {
                      return Promise.reject(new Error(`Official email must use the company domain (@${domain}).`));
                    }
                  }
                  return Promise.resolve();
                }
              })
            ]}
          >
            <Input placeholder="Enter official work email" style={{ borderRadius: 8 }} disabled={isEdit} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item 
            name="personalEmail" 
            label="Personal Email" 
            extra="e.g. john@gmail.com" 
            rules={[
              VALIDATORS.required('Personal Email'),
              VALIDATORS.personalEmail,
              () => ({
                validator(_, value) {
                  if (value && companyDomain) {
                    const domain = companyDomain.toLowerCase();
                    if (value.toLowerCase().endsWith('@' + domain)) {
                      return Promise.reject(new Error(`Personal email cannot use the company domain (@${domain}).`));
                    }
                  }
                  return Promise.resolve();
                }
              })
            ]}
          >
            <Input placeholder="Enter personal email" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="gender" label="Gender" rules={[VALIDATORS.requiredSelect('Gender')]}>
            <Select style={{ borderRadius: 8 }} options={GENDER} placeholder="Select gender" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="dateOfBirth" label="Date of Birth" rules={[VALIDATORS.required('Date of Birth'), VALIDATORS.dob()]}><DatePicker style={{ width: '100%', borderRadius: 8 }} placeholder="Select DOB" /></Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item shouldUpdate={(prev, cur) => prev.dateOfBirth !== cur.dateOfBirth} noStyle>
            {({ getFieldValue }) => {
              const dob = getFieldValue('dateOfBirth');
              let ageStr = '—';
              if (dob) {
                const years = dayjs().diff(dob, 'year');
                const months = dayjs().diff(dob.add(years, 'year'), 'month');
                ageStr = `${years} years, ${months} months`;
              }
              return (
                <Form.Item label="Age (Auto)">
                  <Input value={ageStr} disabled style={{ borderRadius: 8 }} />
                </Form.Item>
              );
            }}
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="maritalStatus" label="Marital Status">
            <Select options={MARITAL_STATUS} placeholder="Select status" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        
        {/* Conditional Spouse Details */}
        <Form.Item shouldUpdate={(prev, cur) => prev.maritalStatus !== cur.maritalStatus} noStyle>
          {({ getFieldValue }) =>
            getFieldValue('maritalStatus') === 'Married' && (
              <>
                <Col xs={24} md={12}>
                  <Form.Item 
                    name="spouseName" 
                    label="Spouse Name" 
                    rules={[
                      VALIDATORS.required('Spouse Name'),
                      { pattern: /^[A-Za-z\s]+$/, message: 'Spouse name must contain only alphabets.' }
                    ]}
                  >
                    <Input placeholder="Enter spouse's name" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item 
                    name="marriageDate" 
                    label="Marriage Date" 
                    dependencies={['dateOfBirth']}
                    rules={[
                      VALIDATORS.required('Marriage Date'),
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (value) {
                            const dob = getFieldValue('dateOfBirth');
                            if (dob && value.diff(dob, 'year') < 18) {
                              return Promise.reject(new Error('Employee must be at least 18 years old at the time of marriage.'));
                            }
                          }
                          return Promise.resolve();
                        }
                      })
                    ]}
                  >
                    <DatePicker style={{ width: '100%', borderRadius: 8 }} placeholder="Select marriage date" />
                  </Form.Item>
                </Col>
              </>
            )
          }
        </Form.Item>

        <Col xs={24} md={8}>
          <Form.Item name="bloodGroup" label="Blood Group">
            <Select options={BLOOD_GROUP} placeholder="Select blood group" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item 
            name="personalPhone" 
            label="Mobile Number" 
            extra="10 digit Indian mobile"
            rules={[VALIDATORS.required('Mobile Number'), VALIDATORS.phone]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
          >
            <Input maxLength={10} placeholder="Enter 10-digit number" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="nationality" label="Nationality" initialValue="Indian" rules={[VALIDATORS.requiredSelect('Nationality')]}>
            <Select style={{ borderRadius: 8 }} placeholder="Select nationality">
              <Select.Option value="Indian">Indian</Select.Option>
              <Select.Option value="NRI">NRI</Select.Option>
              <Select.Option value="Foreign National">Foreign National</Select.Option>
              <Select.Option value="OCI">OCI</Select.Option>
              <Select.Option value="PIO">PIO</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Additional Personal Info Fields */}
        <Col xs={24} md={8}>
          <Form.Item 
            name="fatherName" 
            label="Father's Name" 
            rules={[
              VALIDATORS.required("Father's Name"),
              { pattern: /^[A-Za-z\s]{3,100}$/, message: "Father's name must be 3-100 characters and contain only alphabets." }
            ]}
          >
            <Input placeholder="Enter father's name" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="motherTongue" label="Mother Tongue" rules={[VALIDATORS.requiredSelect('Mother Tongue')]}>
            <Select options={MOTHER_TONGUE} placeholder="Select mother tongue" style={{ borderRadius: 8 }} showSearch optionFilterProp="label" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="religion" label="Religion" rules={[VALIDATORS.requiredSelect('Religion')]}>
            <Select
              options={[
                { value: 'Hindu', label: 'Hindu' },
                { value: 'Muslim', label: 'Muslim' },
                { value: 'Christian', label: 'Christian' },
                { value: 'Sikh', label: 'Sikh' },
                { value: 'Buddhist', label: 'Buddhist' },
                { value: 'Jain', label: 'Jain' },
                { value: 'Other', label: 'Other' },
                { value: 'NotDisclosed', label: 'Not Disclosed' }
              ]}
              placeholder="Select religion"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="category" label="Category" rules={[VALIDATORS.requiredSelect('Category')]}>
            <Select options={EMPLOYEE_CATEGORY} placeholder="Select category" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="numberOfDependents" label="Number of Dependents" initialValue={0}>
            <Input type="number" min={0} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="pwdStatus" label="PwD Status" initialValue="No">
            <Select options={PWD_STATUS} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        {/* Conditional PwD Certificate Number */}
        <Form.Item shouldUpdate={(prev, cur) => prev.pwdStatus !== cur.pwdStatus} noStyle>
          {({ getFieldValue }) => {
            const pwd = getFieldValue('pwdStatus')
            return pwd && pwd !== 'No' && (
              <Col xs={24} md={24}>
                <Form.Item 
                  name="pwdCertificateNo" 
                  label="PwD Certificate Number" 
                  rules={[
                    VALIDATORS.required('PwD Certificate Number'),
                    { max: 20, message: 'PwD certificate number cannot exceed 20 characters.' },
                    { pattern: /^[a-zA-Z0-9]+$/, message: 'PwD certificate number must be alphanumeric.' }
                  ]}
                >
                  <Input placeholder="Enter PwD Certificate Number" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            )
          }}
        </Form.Item>

        {!isEdit && (
          <>
            <Col xs={24} md={12}>
              <Form.Item
                name="aadharNumber"
                label="Aadhaar Number"
                extra="12 digit number"
                rules={[VALIDATORS.required('Aadhaar Number'), VALIDATORS.aadhaar]}
                normalize={NORMALIZE.numeric}
                onKeyPress={FILTER_KEYPRESS.numericOnly}
              >
                <Input maxLength={12} placeholder="Enter 12-digit Aadhaar Number" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="panNumber"
                label="PAN Number"
                extra="10 char PAN"
                rules={[VALIDATORS.required('PAN Number'), VALIDATORS.pan]}
                normalize={NORMALIZE.uppercase}
              >
                <Input maxLength={10} placeholder="Enter PAN Number" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </>
        )}

        {/* Emergency Contact */}
        <Col xs={24}>
          <div style={{ fontWeight: 600, fontSize: 15, margin: '20px 0 16px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: 6, color: 'var(--color-primary)' }}>
            🚨 Emergency Contact
          </div>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item 
            name="emergencyContactName" 
            label="Emergency Contact Name" 
            rules={[
              VALIDATORS.required('Emergency Contact Name'),
              { pattern: /^[A-Za-z\s]{3,100}$/, message: 'Only alphabets allowed, 3-100 characters' }
            ]}
          >
            <Input placeholder="Full name" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item 
            name="emergencyContactRelation" 
            label="Relationship" 
            rules={[VALIDATORS.requiredSelect('Relationship')]}
          >
            <Select options={RELATIONSHIP} placeholder="Select relationship" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item 
            name="emergencyContactPhone" 
            label="Emergency Mobile" 
            dependencies={['personalPhone']}
            rules={[
              VALIDATORS.required('Emergency Mobile'),
              VALIDATORS.phone,
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value && value === getFieldValue('personalPhone')) {
                    return Promise.reject(new Error('Emergency mobile cannot be the same as personal mobile.'));
                  }
                  return Promise.resolve();
                }
              })
            ]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
          >
            <Input maxLength={10} placeholder="Enter 10-digit number" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        {/* Statutory Details */}
        <Col xs={24}>
          <div style={{ fontWeight: 600, fontSize: 15, margin: '20px 0 16px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: 6, color: 'var(--color-primary)' }}>
            🪪 Statutory Details
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item 
            name="uanNumber" 
            label="UAN Number (PF)" 
            rules={[
              VALIDATORS.required('UAN Number'),
              VALIDATORS.uan
            ]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
          >
            <Input maxLength={12} placeholder="Enter 12-digit UAN" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item 
            name="esiNumber" 
            label="ESIC IP Number" 
            rules={[
              VALIDATORS.esi
            ]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
          >
            <Input maxLength={17} placeholder="Enter 17-digit ESIC IP (Optional)" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item 
            name="npspranNumber" 
            label="NPS PRAN Number" 
            rules={[
              VALIDATORS.npspran
            ]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
          >
            <Input maxLength={12} placeholder="Enter 12-digit NPS PRAN (Optional)" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="previousEmployerPFNumber" label="Previous Employer PF Number">
            <Input placeholder="Enter previous PF number (Optional)" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
      </Row>
    </motion.div>,

    // Step 1: Employment
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <Row gutter={[16, 0]}>
        
        {/* Placement Hierarchy */}
        <Col xs={24}>
          <div style={{ fontWeight: 600, fontSize: 15, margin: '8px 0 16px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: 6, color: 'var(--color-primary)' }}>
            Placement Hierarchy
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="businessUnitId" label="Business Unit">
            <Select 
              placeholder="Select Business Unit" 
              style={{ borderRadius: 8 }}
              allowClear
              onChange={(v) => { setSelectedBU(v); form.setFieldsValue({ divisionId: undefined }) }}
              options={(buRes || []).map(b => ({ value: b.businessUnitId, label: b.name }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="divisionId" label="Division">
            <Select 
              placeholder="Select Division" 
              style={{ borderRadius: 8 }}
              allowClear
              disabled={!selectedBU}
              options={filteredDivisions.map(d => ({ value: d.divisionId, label: d.name }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="deptId" label="Department" rules={[VALIDATORS.requiredSelect('Department')]}>
            <Select 
              placeholder="Select department" 
              allowClear
              onChange={(v) => { setSelectedDept(v); form.setFieldsValue({ subDeptId: undefined, teamId: undefined }) }}
              options={rootDepts.map((d) => ({ value: d.deptId, label: d.deptName }))} 
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item 
            name="subDeptId" 
            label="Sub-Department"
            rules={
              selectedDept && filteredSubDepts.length > 0 
                ? [VALIDATORS.requiredSelect('Sub-Department')] 
                : []
            }
          >
            <Select 
              placeholder={
                !selectedDept
                  ? "Select Department first"
                  : filteredSubDepts.length > 0
                    ? "Select Sub-Department"
                    : "No Sub Departments Available"
              }
              style={{ borderRadius: 8 }}
              allowClear
              disabled={!selectedDept || filteredSubDepts.length === 0}
              onChange={(v) => { setSelectedSubDept(v); form.setFieldsValue({ teamId: undefined }) }}
              options={filteredSubDepts.map(s => ({ value: s.subDeptId, label: s.name }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="teamId" label="Team / Section">
            <Select 
              placeholder="Select Team" 
              style={{ borderRadius: 8 }}
              allowClear
              disabled={!selectedSubDept}
              options={filteredTeams.map(t => ({ value: t.teamId, label: t.name }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="locationId" label="Work Location" rules={[VALIDATORS.requiredSelect('Location')]}>
            <Select placeholder="Select office location" options={(locData || []).map((l) => ({ value: l.locationId, label: l.locationName }))} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        {/* Workforce Classification & Job Architecture */}
        <Col xs={24}>
          <div style={{ fontWeight: 600, fontSize: 15, margin: '20px 0 16px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: 6, color: 'var(--color-primary)' }}>
            Grade & Job Architecture
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="designationId" label="Designation" rules={[VALIDATORS.requiredSelect('Designation')]}>
            <Select placeholder="Select designation" options={(desigData || []).map((d) => ({ value: d.designationId, label: d.title }))} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="gradeId" label="Grade" rules={[{ required: true, message: 'Grade is mandatory' }]}>
            <Select 
              placeholder="Select Grade" 
              style={{ borderRadius: 8 }}
              onChange={handleGradeChange}
              options={(gradeRes || []).map(g => ({ value: g.gradeId, label: `${g.name} (${g.code})` }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="bandId" label="Band / Level">
            <Select 
              placeholder="Select Band" 
              style={{ borderRadius: 8 }}
              options={(bandRes || []).map(b => ({ value: b.bandId, label: `${b.name} (${b.code})` }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="jobFamilyId" label="Job Family">
            <Select 
              placeholder="Select Job Family" 
              style={{ borderRadius: 8 }}
              allowClear
              onChange={(v) => { setSelectedJobFamily(v); form.setFieldsValue({ jobFunctionId: undefined }) }}
              options={(jobFamilyRes || []).map(j => ({ value: j.jobFamilyId, label: j.name }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="jobFunctionId" label="Job Function">
            <Select 
              placeholder="Select Job Function" 
              style={{ borderRadius: 8 }}
              allowClear
              disabled={!selectedJobFamily}
              options={filteredJobFunctions.map(j => ({ value: j.jobFunctionId, label: j.name }))}
            />
          </Form.Item>
        </Col>

        {/* Employment & Cost Accounting Details */}
        <Col xs={24}>
          <div style={{ fontWeight: 600, fontSize: 15, margin: '20px 0 16px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: 6, color: 'var(--color-primary)' }}>
            Employment Details & Cost Accounting
          </div>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="employmentType" label="Employment Type" rules={[VALIDATORS.requiredSelect('Employment Type')]} initialValue="FullTime">
            <Select options={EMPLOYMENT_TYPE} style={{ borderRadius: 8 }} onChange={(v) => setSelectedEmpType(v)} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
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
                      return Promise.reject(new Error("Joining date cannot be before date of birth."));
                    }
                    if (value.isBefore(dayjs('1990-01-01'))) {
                      return Promise.reject(new Error("Joining date cannot be before 01 Jan 1990."));
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
        <Col xs={24} md={8}>
          <Form.Item 
            name="probationPeriodMonths" 
            label="Probation Period (months)" 
            initialValue={3}
            rules={[
              { required: true, message: 'Probation period is required.' },
              {
                validator(_, value) {
                  const num = parseInt(value, 10);
                  if (isNaN(num) || num < 0 || num > 24) {
                    return Promise.reject(new Error('Probation period must be between 0 and 24 months.'));
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input type="number" min={0} max={24} placeholder="e.g. 3" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        {/* Dynamic Employment Type Fields */}
        {(selectedEmpType === 'Contract' || selectedEmpType === 'FixedTerm') && (
          <Col xs={24} md={12}>
            <Form.Item 
              name="contractEndDate" 
              label="Contract End Date" 
              dependencies={['joiningDate']}
              rules={[
                { required: true, message: 'Contract End Date is required' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (value) {
                      const doj = getFieldValue('joiningDate');
                      if (doj && value.isBefore(doj)) {
                        return Promise.reject(new Error('Contract end date must be after joining date.'));
                      }
                    }
                    return Promise.resolve();
                  }
                })
              ]}
            >
              <DatePicker style={{ width: '100%', borderRadius: 8 }} placeholder="Select contract end date" />
            </Form.Item>
          </Col>
        )}
        {selectedEmpType === 'Intern' && (
          <Col xs={24} md={12}>
            <Form.Item 
              name="internshipDurationMonths" 
              label="Internship Duration (Months)" 
              rules={[{ required: true, message: 'Internship duration is required for Interns' }]}
            >
              <Input type="number" min={1} placeholder="e.g. 6" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        )}
        {selectedEmpType === 'Consultant' && (
          <Col xs={24} md={12}>
            <Form.Item name="vendorName" label="Vendor Name">
              <Input placeholder="Enter vendor or agency name" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
        )}

        <Col xs={24} md={8}>
          <Form.Item name="workMode" label="Work Mode" initialValue="Onsite">
            <Select options={WORK_MODE} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="shiftId" label="Shift Assignment" rules={[{ required: true, message: 'Shift assignment is required' }]}>
            <Select 
              placeholder="Select Shift" 
              style={{ borderRadius: 8 }}
              options={(shiftRes || []).map(s => ({ value: s.shiftId, label: `${s.shiftName} (${s.startTime} - ${s.endTime})` }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="weeklyOffPattern" label="Weekly Off Pattern" initialValue="SaturdaySunday">
            <Select options={WEEKLY_OFF_PATTERN} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="payrollGroup" label="Payroll Group" rules={[{ required: true, message: 'Payroll Group is mandatory' }]}>
            <Select options={PAYROLL_GROUP} placeholder="Select Payroll Group" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="costCenterId" label="Cost Center" rules={[{ required: true, message: 'Cost Center is mandatory' }]}>
            <Select 
              placeholder="Select Cost Center" 
              style={{ borderRadius: 8 }}
              options={(ccRes || []).map(c => ({ value: c.costCenterId, label: `${c.costCenterName} (${c.costCenterCode})` }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="profitCenterId" label="Profit Center">
            <Select 
              placeholder="Select Profit Center" 
              style={{ borderRadius: 8 }}
              allowClear
              options={(pcRes || []).map(p => ({ value: p.profitCenterId, label: `${p.name} (${p.code})` }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item 
            name="noticePeriodDays" 
            label="Notice Period (Days)" 
            rules={[
              { required: true, message: 'Notice Period is required' },
              {
                validator: (_, value) => {
                  const num = parseInt(value, 10)
                  if (isNaN(num) || num < 0 || num > 365) {
                    return Promise.reject('Must be between 0 and 365')
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input type="number" min={0} max={365} style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        {/* Manager Mappings */}
        <Col xs={24}>
          <div style={{ fontWeight: 600, fontSize: 15, margin: '20px 0 16px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: 6, color: 'var(--color-primary)' }}>
            Reporting Hierarchy
          </div>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item 
            name="reportingManagerId" 
            label="L1 Reporting Manager" 
            rules={[VALIDATORS.requiredSelect('L1 Reporting Manager')]}
          >
            <Select
              showSearch
              placeholder="Search & select L1 Manager"
              optionFilterProp="label"
              allowClear
              options={managerOptions}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="l2ReportingManagerId" label="L2 Reporting Manager">
            <Select
              showSearch
              placeholder="Search & select L2 Manager"
              optionFilterProp="label"
              allowClear
              options={managerOptions}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="functionalManagerId" label="Functional Manager">
            <Select
              showSearch
              placeholder="Search & select Functional Manager"
              optionFilterProp="label"
              allowClear
              options={managerOptions}
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Col>

        {/* Contact extensions and addresses */}
        <Col xs={24}>
          <div style={{ fontWeight: 600, fontSize: 15, margin: '20px 0 16px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: 6, color: 'var(--color-primary)' }}>
            Additional Contact Information
          </div>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="officialMobile" label="Official Mobile" rules={[VALIDATORS.phone]} normalize={NORMALIZE.numeric} onKeyPress={FILTER_KEYPRESS.numericOnly}>
            <Input maxLength={10} placeholder="Enter official mobile" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="alternateMobile" label="Alternate Mobile" rules={[VALIDATORS.phone]} normalize={NORMALIZE.numeric} onKeyPress={FILTER_KEYPRESS.numericOnly}>
            <Input maxLength={10} placeholder="Enter alternate mobile" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="whatsAppNumber" label="WhatsApp Number" rules={[VALIDATORS.phone]} normalize={NORMALIZE.numeric} onKeyPress={FILTER_KEYPRESS.numericOnly}>
            <Input maxLength={10} placeholder="Enter WhatsApp number" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="extensionNumber" label="Extension Number">
            <Input placeholder="Enter desk extension" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="alternateEmergencyContactPhone" label="Alt. Emergency Phone" rules={[VALIDATORS.phone]} normalize={NORMALIZE.numeric} onKeyPress={FILTER_KEYPRESS.numericOnly}>
            <Input maxLength={10} placeholder="Enter alternate emergency phone" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <div style={{ fontWeight: 600, fontSize: 15, margin: '20px 0 16px 0', borderBottom: '1px solid var(--border-glass)', paddingBottom: 6, color: 'var(--color-primary)' }}>
            Address & Domicile Details
          </div>
        </Col>
        <Col xs={24} md={24}>
          <Form.Item name="domicileState" label="Domicile State">
            <Select placeholder="Select Domicile State" style={{ borderRadius: 8 }} showSearch allowClear>
              {(STATES_BY_COUNTRY['India'] || []).map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Form.Item>
        </Col>

        {/* Permanent Address */}
        <Col xs={24}>
          <div style={{ fontWeight: 600, fontSize: 14, margin: '10px 0 12px 0', color: 'var(--color-text-secondary)' }}>
            Permanent Address
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item 
            name="permanentAddressLine1" 
            label="Address Line 1" 
            rules={[
              VALIDATORS.required("Permanent Address Line 1"),
              { max: 200, message: "Address Line 1 cannot exceed 200 characters." }
            ]}
          >
            <Input placeholder="Flat, House No., Building, Street" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="permanentAddressLine2" label="Address Line 2">
            <Input placeholder="Area, Landmark, Sector (Optional)" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="permanentPincode" label="Pincode" rules={[VALIDATORS.required("Pincode"), VALIDATORS.pincode]} normalize={NORMALIZE.numeric} onKeyPress={FILTER_KEYPRESS.numericOnly}>
            <Input maxLength={6} placeholder="6-digit pincode" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item name="permanentCountry" label="Country" initialValue="India" rules={[VALIDATORS.required("Country")]}>
            <Select placeholder="Select Country" style={{ borderRadius: 8 }} showSearch>
              {COUNTRIES.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Form.Item shouldUpdate={(prev, cur) => prev.permanentCountry !== cur.permanentCountry || prev.permanentState !== cur.permanentState} noStyle>
          {({ getFieldValue }) => {
            const country = getFieldValue('permanentCountry') || 'India';
            const states = STATES_BY_COUNTRY[country] || [];
            const currentVal = getFieldValue('permanentState');
            const options = [...states];
            if (currentVal && !options.includes(currentVal)) {
              options.unshift(currentVal);
            }
            return (
              <Col xs={24} md={6}>
                <Form.Item name="permanentState" label="State" rules={[VALIDATORS.required("State")]}>
                  {states.length > 0 ? (
                    <Select placeholder="Select State" style={{ borderRadius: 8 }} showSearch>
                      {options.map(s => <Option key={s} value={s}>{s}</Option>)}
                    </Select>
                  ) : (
                    <Input placeholder="Enter State" style={{ borderRadius: 8 }} />
                  )}
                </Form.Item>
              </Col>
            );
          }}
        </Form.Item>
        <Form.Item shouldUpdate={(prev, cur) => prev.permanentState !== cur.permanentState || prev.permanentCity !== cur.permanentCity} noStyle>
          {({ getFieldValue }) => {
            const state = getFieldValue('permanentState');
            const cities = CITIES_BY_STATE[state] || [];
            const currentVal = getFieldValue('permanentCity');
            const options = [...cities];
            if (currentVal && !options.includes(currentVal)) {
              options.unshift(currentVal);
            }
            return (
              <Col xs={24} md={6}>
                <Form.Item name="permanentCity" label="City" rules={[VALIDATORS.required("City")]}>
                  {cities.length > 0 ? (
                    <Select placeholder="Select City" style={{ borderRadius: 8 }} showSearch>
                      {options.map(c => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  ) : (
                    <Input placeholder="Enter City" style={{ borderRadius: 8 }} />
                  )}
                </Form.Item>
              </Col>
            );
          }}
        </Form.Item>
        <Col xs={24} md={12}>
          <Form.Item name="permanentDistrict" label="District" rules={[VALIDATORS.required("District")]}>
            <Input placeholder="District" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="permanentTaluka" label="Taluka / Tehsil">
            <Input placeholder="Taluka" style={{ borderRadius: 8 }} />
          </Form.Item>
        </Col>

        {/* Same Address Switch */}
        <Col xs={24} style={{ marginBottom: 16 }}>
          <Form.Item name="sameAddressFlag" label="Current Address same as Permanent Address" valuePropName="checked" initialValue={false}>
            <Switch className="custom-switch" />
          </Form.Item>
        </Col>

        {/* Current Address */}
        <Form.Item shouldUpdate={(prev, cur) => prev.sameAddressFlag !== cur.sameAddressFlag} noStyle>
          {({ getFieldValue }) => {
            const isSame = getFieldValue('sameAddressFlag');
            return (
              <>
                <Col xs={24}>
                  <div style={{ fontWeight: 600, fontSize: 14, margin: '10px 0 12px 0', color: 'var(--color-text-secondary)' }}>
                    Current Address
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="currentAddressLine1" label="Address Line 1" rules={!isSame ? [VALIDATORS.required("Current Address Line 1")] : []}>
                    <Input disabled={isSame} placeholder="Flat, House No., Building, Street" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="currentAddressLine2" label="Address Line 2">
                    <Input disabled={isSame} placeholder="Area, Landmark, Sector (Optional)" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="currentPincode" label="Pincode" rules={!isSame ? [VALIDATORS.required("Pincode"), VALIDATORS.pincode] : []} normalize={NORMALIZE.numeric} onKeyPress={FILTER_KEYPRESS.numericOnly}>
                    <Input disabled={isSame} maxLength={6} placeholder="6-digit pincode" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="currentCountry" label="Country" initialValue="India" rules={!isSame ? [VALIDATORS.required("Country")] : []}>
                    <Select disabled={isSame} placeholder="Select Country" style={{ borderRadius: 8 }} showSearch>
                      {COUNTRIES.map(c => <Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Form.Item shouldUpdate={(prev, cur) => prev.currentCountry !== cur.currentCountry || prev.currentState !== cur.currentState || prev.sameAddressFlag !== cur.sameAddressFlag} noStyle>
                  {({ getFieldValue }) => {
                    const country = getFieldValue('currentCountry') || 'India';
                    const states = STATES_BY_COUNTRY[country] || [];
                    const currentVal = getFieldValue('currentState');
                    const options = [...states];
                    if (currentVal && !options.includes(currentVal)) {
                      options.unshift(currentVal);
                    }
                    return (
                      <Col xs={24} md={6}>
                        <Form.Item name="currentState" label="State" rules={!isSame ? [VALIDATORS.required("State")] : []}>
                          {states.length > 0 ? (
                            <Select disabled={isSame} placeholder="Select State" style={{ borderRadius: 8 }} showSearch>
                              {options.map(s => <Option key={s} value={s}>{s}</Option>)}
                            </Select>
                          ) : (
                            <Input disabled={isSame} placeholder="Enter State" style={{ borderRadius: 8 }} />
                          )}
                        </Form.Item>
                      </Col>
                    );
                  }}
                </Form.Item>
                <Form.Item shouldUpdate={(prev, cur) => prev.currentState !== cur.currentState || prev.currentCity !== cur.currentCity || prev.sameAddressFlag !== cur.sameAddressFlag} noStyle>
                  {({ getFieldValue }) => {
                    const state = getFieldValue('currentState');
                    const cities = CITIES_BY_STATE[state] || [];
                    const currentVal = getFieldValue('currentCity');
                    const options = [...cities];
                    if (currentVal && !options.includes(currentVal)) {
                      options.unshift(currentVal);
                    }
                    return (
                      <Col xs={24} md={6}>
                        <Form.Item name="currentCity" label="City" rules={!isSame ? [VALIDATORS.required("City")] : []}>
                          {cities.length > 0 ? (
                            <Select disabled={isSame} placeholder="Select City" style={{ borderRadius: 8 }} showSearch>
                              {options.map(c => <Option key={c} value={c}>{c}</Option>)}
                            </Select>
                          ) : (
                            <Input disabled={isSame} placeholder="Enter City" style={{ borderRadius: 8 }} />
                          )}
                        </Form.Item>
                      </Col>
                    );
                  }}
                </Form.Item>
                <Col xs={24} md={24}>
                  <Form.Item name="currentDistrict" label="District" rules={!isSame ? [VALIDATORS.required("District")] : []}>
                    <Input disabled={isSame} placeholder="District" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </>
            );
          }}
        </Form.Item>
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
          onValuesChange={(changedValues, allValues) => {
            const nameFields = ['title', 'firstName', 'middleName', 'lastName'];
            const changedKey = Object.keys(changedValues)[0];
            if (nameFields.includes(changedKey)) {
              const titleVal = allValues.title ? (EMPLOYEE_TITLE.find(t => t.value === allValues.title)?.label || allValues.title) : '';
              const parts = [titleVal, allValues.firstName, allValues.middleName, allValues.lastName].filter(Boolean);
              form.setFieldsValue({
                fullNameAadhaar: parts.join(' ').replace(/\.+/g, '.').trim()
              });
            }
            
            // Pincode auto-fill triggers
            if (changedKey === 'permanentPincode') {
              const val = changedValues.permanentPincode;
              if (val && val.length === 6) {
                fetchPincodeData(val, 'permanent');
              }
            }
            if (changedKey === 'currentPincode') {
              const val = changedValues.currentPincode;
              if (val && val.length === 6) {
                fetchPincodeData(val, 'current');
              }
            }

            // Cascading dropdowns clearing on parent selection change
            if (changedKey === 'permanentCountry') {
              form.setFieldsValue({
                permanentState: undefined,
                permanentCity: undefined
              });
              if (allValues.sameAddressFlag) {
                form.setFieldsValue({
                  currentCountry: changedValues.permanentCountry,
                  currentState: undefined,
                  currentCity: undefined
                });
              }
            }
            if (changedKey === 'permanentState') {
              form.setFieldsValue({
                permanentCity: undefined
              });
              if (allValues.sameAddressFlag) {
                form.setFieldsValue({
                  currentState: changedValues.permanentState,
                  currentCity: undefined
                });
              }
            }
            if (changedKey === 'currentCountry') {
              form.setFieldsValue({
                currentState: undefined,
                currentCity: undefined
              });
            }
            if (changedKey === 'currentState') {
              form.setFieldsValue({
                currentCity: undefined
              });
            }

            const permFields = [
              'permanentAddressLine1', 'permanentAddressLine2', 'permanentCity', 
              'permanentDistrict', 'permanentState', 'permanentPincode', 'permanentCountry'
            ];
            if (changedKey === 'sameAddressFlag' && changedValues.sameAddressFlag) {
              form.setFieldsValue({
                currentAddressLine1: allValues.permanentAddressLine1,
                currentAddressLine2: allValues.permanentAddressLine2,
                currentCity: allValues.permanentCity,
                currentDistrict: allValues.permanentDistrict,
                currentState: allValues.permanentState,
                currentPincode: allValues.permanentPincode,
                currentCountry: allValues.permanentCountry
              });
            } else if (allValues.sameAddressFlag && permFields.includes(changedKey)) {
              const suffix = changedKey.replace('permanent', '');
              const currentKey = 'current' + suffix;
              form.setFieldsValue({
                [currentKey]: changedValues[changedKey]
              });
            }
          }}
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
