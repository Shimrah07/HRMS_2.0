import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Steps, Form, Input, InputNumber, Select, DatePicker, Button, Row, Col, Card, Space, notification, message, Spin, Space as AntSpace } from 'antd'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { recruitmentService } from '../../services/recruitmentService'
import { organizationService } from '../../services/organizationService'
import { employeeService } from '../../services/employeeService'
import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/common/PageHeader'
import useUIStore from '../../store/uiStore'

const { Step } = Steps

export default function CreateMrfPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user, hasRole } = useAuth()
  const { isDarkMode } = useUIStore()

  const [draftId, setDraftId] = useState(id)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (id) {
      setDraftId(id)
    }
  }, [id])

  const [currentStep, setCurrentStep] = useState(() => {
    const pathParts = window.location.pathname.split('/')
    const urlId = pathParts.find(p => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p))
    const saved = urlId ? localStorage.getItem(`mrf-draft-step-${urlId}`) : null
    return saved ? parseInt(saved, 10) : (location.state?.currentStep || 0)
  })

  const saveCurrentStep = (step, targetId) => {
    const keyId = targetId || draftId || id
    if (keyId) {
      localStorage.setItem(`mrf-draft-step-${keyId}`, step)
    }
  }

  const [form] = Form.useForm()
  const [selectedDeptId, setSelectedDeptId] = useState(null)
  const [selectedVacancyType, setSelectedVacancyType] = useState('New')
  const [justificationWordCount, setJustificationWordCount] = useState(0)

  // Fetch requisition detail if editing
  const { data: reqDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['requisition-detail', id],
    queryFn: () => recruitmentService.getRequisition(id).then(res => res?.data || null),
    enabled: !!id
  })

  // Load static dropdown data
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

  const { data: gradesData } = useQuery({
    queryKey: ['grades-list'],
    queryFn: organizationService.getGrades,
    select: (r) => r?.data || []
  })

  // Hiring Manager and Replacing Employee dropdowns (load active employees)
  const { data: employeesData } = useQuery({
    queryKey: ['employees-active-list'],
    queryFn: () => employeeService.getEmployees({ pageSize: 1000, activeStatus: 'active' }),
    select: (r) => r?.data || []
  })

  // Hiring Manager dropdown data (load active employees for selected department)
  const { data: deptEmployeesData, isLoading: isLoadingDeptEmployees } = useQuery({
    queryKey: ['employees-active-list-dept', selectedDeptId],
    queryFn: () => employeeService.getEmployees({ pageSize: 1000, activeStatus: 'active', deptId: selectedDeptId }),
    enabled: !!selectedDeptId,
    select: (r) => r?.data || []
  })

  // Sub-departments cascade query
  const { data: subDeptsData } = useQuery({
    queryKey: ['sub-departments', selectedDeptId],
    queryFn: () => organizationService.getSubDepartments(selectedDeptId),
    enabled: !!selectedDeptId,
    select: (r) => r?.data || []
  })

  // Designation and Salary Watch for Inline validation & Helpers
  const selectedDesignationId = Form.useWatch('designationId', form)
  const enteredMinSalary = Form.useWatch('minSalary', form)
  const enteredMaxSalary = Form.useWatch('maxSalary', form)

  const selectedDesignation = useMemo(() => {
    return (desigsData || []).find(d => d.designationId === selectedDesignationId)
  }, [desigsData, selectedDesignationId])

  const minAllowedSalary = useMemo(() => {
    if (!selectedDesignation) return 0
    return (selectedDesignation.minBasic || 0) * 12
  }, [selectedDesignation])

  const maxAllowedSalary = useMemo(() => {
    if (!selectedDesignation) return 0
    return (selectedDesignation.maxBasic || 0) * 12 * 2.5
  }, [selectedDesignation])

  const designationMinSalaryHelper = useMemo(() => {
    if (!selectedDesignation || !minAllowedSalary) return null
    return (
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
        Minimum allowed salary for {selectedDesignation.title}: <strong>₹{minAllowedSalary.toLocaleString()}/year</strong>
      </span>
    )
  }, [selectedDesignation, minAllowedSalary])

  const designationMaxSalaryHelper = useMemo(() => {
    if (!selectedDesignation || !maxAllowedSalary) return null
    return (
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
        Maximum allowed salary limit for {selectedDesignation.title}: <strong>₹{maxAllowedSalary.toLocaleString()}/year</strong>
      </span>
    )
  }, [selectedDesignation, maxAllowedSalary])

  const isSalaryInvalid = useMemo(() => {
    return enteredMinSalary !== undefined && enteredMinSalary !== null && minAllowedSalary > 0 && enteredMinSalary < minAllowedSalary
  }, [enteredMinSalary, minAllowedSalary])

  const isMaxSalaryInvalid = useMemo(() => {
    return enteredMaxSalary !== undefined && enteredMaxSalary !== null && maxAllowedSalary > 0 && enteredMaxSalary > maxAllowedSalary
  }, [enteredMaxSalary, maxAllowedSalary])

  // Initialize form if editing
  useEffect(() => {
    if (reqDetail && !isInitializedRef.current) {
      isInitializedRef.current = true
      setSelectedDeptId(reqDetail.deptId)
      setSelectedVacancyType(reqDetail.vacancyType || 'New')
      if (reqDetail.justification) {
        setJustificationWordCount(reqDetail.justification.trim().split(/\s+/).filter(Boolean).length)
      }
      form.setFieldsValue({
        ...reqDetail,
        targetDate: reqDetail.targetDate ? dayjs(reqDetail.targetDate) : null
      })
    }
  }, [reqDetail, form])

  const createMutation = useMutation({
    mutationFn: recruitmentService.createRequisition,
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['requisitions'] })
        queryClient.invalidateQueries({ queryKey: ['requisition-detail'] })
      } else {
        message.error(res.message || 'Failed to create requisition.')
      }
    },
    onError: (err) => {
      const errMsg = err?.response?.data?.message || err?.message || 'Error creating requisition.'
      notification.error({ message: 'Draft Save Failed', description: errMsg })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => recruitmentService.updateRequisition(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['requisitions'] })
        queryClient.invalidateQueries({ queryKey: ['requisition-detail'] })
      } else {
        message.error(res.message || 'Failed to update requisition.')
      }
    },
    onError: (err) => {
      const errMsg = err?.response?.data?.message || err?.message || 'Error updating requisition.'
      notification.error({ message: 'Draft Update Failed', description: errMsg })
    }
  })

  const submitMutation = useMutation({
    mutationFn: recruitmentService.submitRequisition,
    onSuccess: (res, variables) => {
      if (res.success) {
        localStorage.removeItem(`mrf-draft-step-${variables}`)
        notification.success({ message: 'MRF Submitted', description: 'Requisition sent for reviews.' })
        queryClient.invalidateQueries({ queryKey: ['requisitions'] })
        queryClient.invalidateQueries({ queryKey: ['requisition-detail'] })
        navigate('/recruitment')
      } else {
        message.error(res.message || 'Failed to submit requisition.')
      }
    },
    onError: (err) => {
      const errMsg = err?.response?.data?.message || err?.message || 'Error submitting requisition.'
      notification.error({ message: 'Submission Failed', description: errMsg })
    }
  })

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields([
          'jobTitle', 'noOfPositions', 'deptId', 'subDeptId', 'designationId', 'gradeId', 'hiringManagerId', 'priority', 'vacancyType', 'replacingEmployeeId'
        ])
      } else if (currentStep === 1) {
        await form.validateFields([
          'minExperience', 'maxExperience', 'skillsRequired', 'jobDescription', 'targetDate'
        ])
      } else if (currentStep === 2) {
        await form.validateFields([
          'minSalary', 'maxSalary', 'sourcingPreference', 'justification'
        ])
      }
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      saveCurrentStep(nextStep)
    } catch (err) {
      message.error('Please resolve validation errors before continuing.')
    }
  }

  const handlePrev = () => {
    const prevStep = currentStep - 1
    setCurrentStep(prevStep)
    saveCurrentStep(prevStep)
  }

  const handleSaveDraft = async () => {
    const values = form.getFieldsValue(true)
    const payload = {
      ...values,
      targetDate: values.targetDate ? (dayjs.isDayjs(values.targetDate) ? values.targetDate.format('YYYY-MM-DD') : values.targetDate) : null
    }

    console.log("Draft Id =", draftId)
    console.log("Current Step =", currentStep)
    console.log("isEdit =", !!draftId)
    console.log("Payload =", payload)

    if (draftId) {
      console.log("Saving draft... Calling: PUT /api/v1/job-requisitions/" + draftId)
      isInitializedRef.current = true
      saveCurrentStep(currentStep)
      updateMutation.mutate({ id: draftId, payload }, {
        onSuccess: (res) => {
          if (res.success) {
            notification.success({ message: 'MRF Updated', description: 'Requisition draft updated successfully.' })
          }
        }
      })
    } else {
      console.log("Saving draft... Calling: POST /api/v1/job-requisitions")
      createMutation.mutate(payload, {
        onSuccess: (res) => {
          if (res.success && res.data) {
            isInitializedRef.current = true
            setDraftId(res.data.reqId)
            saveCurrentStep(currentStep, res.data.reqId)
            notification.success({ message: 'MRF Created', description: 'Requisition draft saved successfully.' })
            navigate(`/recruitment/mrf/${res.data.reqId}/edit`, { replace: true, state: { currentStep } })
          }
        }
      })
    }
  }

  const handleSubmit = async () => {
    try {
      await form.validateFields()
      const values = form.getFieldsValue(true)
      const payload = {
        ...values,
        targetDate: values.targetDate ? (dayjs.isDayjs(values.targetDate) ? values.targetDate.format('YYYY-MM-DD') : values.targetDate) : null
      }

      console.log("Draft Id =", draftId)
      console.log("Current Step =", currentStep)
      console.log("isEdit =", !!draftId)
      console.log("Payload =", payload)

      // Submit immediately: Save then trigger submission
      if (draftId) {
        console.log("Submitting... Calling: PUT /api/v1/job-requisitions/" + draftId + " then POST /api/v1/job-requisitions/" + draftId + "/submit")
        updateMutation.mutate({ id: draftId, payload }, {
          onSuccess: (res) => {
            if (res.success) {
              console.log("Saving draft succeeded. Calling submit API: POST /api/v1/job-requisitions/" + draftId + "/submit")
              submitMutation.mutate(draftId)
            }
          }
        })
      } else {
        console.log("Submitting... Calling: POST /api/v1/job-requisitions then POST /api/v1/job-requisitions/{id}/submit")
        createMutation.mutate(payload, {
          onSuccess: (res) => {
            if (res.success && res.data) {
              const newId = res.data.reqId
              setDraftId(newId)
              console.log("Creating draft succeeded. Calling submit API: POST /api/v1/job-requisitions/" + newId + "/submit")
              submitMutation.mutate(newId)
            }
          }
        })
      }
    } catch (err) {
      message.error('Please complete all validation rules first.')
    }
  }

  // Generate Replacing Employee options
  const allEmployeesOptions = useMemo(() => {
    return (employeesData || []).map(e => ({
      value: e.employeeId,
      label: (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
          <span style={{ fontWeight: 600 }}>{e.firstName} {e.lastName} ({e.employeeCode})</span>
          <span style={{ fontSize: 11, color: '#888' }}>{e.designationTitle || 'No Designation'}</span>
        </div>
      ),
      searchText: `${e.firstName} ${e.lastName} ${e.employeeCode}`
    }))
  }, [employeesData])

  // Generate Hiring Manager options
  const hiringManagerOptions = useMemo(() => {
    if (!selectedDeptId) return []
    return (deptEmployeesData || []).map(e => ({
      value: e.employeeId,
      label: (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
          <span style={{ fontWeight: 600 }}>{e.firstName} {e.lastName} ({e.employeeCode})</span>
          <span style={{ fontSize: 11, color: '#888' }}>{e.designationTitle || 'No Designation'}</span>
        </div>
      ),
      searchText: `${e.firstName} ${e.lastName} ${e.employeeCode}`
    }))
  }, [deptEmployeesData, selectedDeptId])

  if (id && isLoadingDetail) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="Loading requisition details..." />
      </div>
    )
  }

  const stepsItems = [
    { title: 'Position Details' },
    { title: 'Hiring Requirements' },
    { title: 'Budget & Business Details' },
    { title: 'Review & Submit' }
  ]

  const values = form.getFieldsValue()
  const isProcessing = createMutation.isPending || updateMutation.isPending || submitMutation.isPending

  return (
    <div style={{ padding: '0 8px 80px 8px' }}>
      <PageHeader 
        title={id ? 'Edit Manpower Requisition' : 'Raise New Manpower Requisition'}
        subtitle="Step-by-step enterprise workforce deployment wizard"
      />

      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12, marginBottom: 24 }}>
            <Steps current={currentStep} items={stepsItems} style={{ maxWidth: 800, margin: '0 auto 24px auto' }} />
          </Card>

          <Form form={form} layout="vertical" preserve={true} initialValues={{ priority: 'Medium', vacancyType: 'New', sourcingPreference: 'All' }}>
            {/* Step 1: Position Details */}
            <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
              <Card title="Step 1 — Position Details" bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="MRF Number (Auto Generated)">
                      <Input value={reqDetail?.mrfNumber || 'Draft Sequence Code'} disabled style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Requested By">
                      <Input value={reqDetail?.raisedByUserName || `${user?.firstName || ''} ${user?.lastName || ''} (${user?.username || ''})`} disabled style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="jobTitle" label="Position Title / Job Title" rules={[{ required: true, message: 'Job title is required' }]}>
                      <Input style={{ borderRadius: 8 }} placeholder="e.g. Senior Software Engineer" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="noOfPositions" label="Number of Positions" rules={[{ required: true, message: 'Positions count is required' }]}>
                      <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="deptId" label="Department" rules={[{ required: true, message: 'Department is required' }]}>
                      <Select 
                        placeholder="Select department" 
                        onChange={(v) => {
                          setSelectedDeptId(v)
                          form.setFieldsValue({ subDeptId: undefined, hiringManagerId: undefined })
                        }}
                        options={(deptsData || []).map(d => ({ value: d.deptId, label: d.deptName }))} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="subDeptId" label="Sub-Department">
                      <Select 
                        placeholder="Select sub-department" 
                        allowClear
                        notFoundContent="No sub-departments found"
                        options={(subDeptsData || []).map(sd => ({ value: sd.subDeptId, label: sd.name }))} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="designationId" label="Designation" rules={[{ required: true, message: 'Designation is required' }]}>
                      <Select placeholder="Select designation" options={(desigsData || []).map(d => ({ value: d.designationId, label: d.title }))} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="gradeId" label="Grade" rules={[{ required: true, message: 'Grade is required' }]}>
                      <Select placeholder="Select grade" options={(gradesData || []).map(g => ({ value: g.gradeId, label: g.name }))} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="hiringManagerId" label="Hiring Manager" rules={[{ required: true, message: 'Hiring manager is required' }]}>
                      <Select 
                        showSearch
                        placeholder={selectedDeptId ? "Search & select hiring manager" : "Select Department first"} 
                        disabled={!selectedDeptId}
                        filterOption={(input, option) =>
                          (option?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        notFoundContent={isLoadingDeptEmployees ? <Spin size="small" tip="Loading department employees..." /> : "No eligible employees found."}
                        options={hiringManagerOptions} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="priority" label="Priority" rules={[{ required: true, message: 'Priority is required' }]}>
                      <Select placeholder="Select priority">
                        <Select.Option value="Critical">🚨 Critical</Select.Option>
                        <Select.Option value="High">🔴 High</Select.Option>
                        <Select.Option value="Medium">🟡 Medium</Select.Option>
                        <Select.Option value="Low">🟢 Low</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="vacancyType" label="Vacancy / Position Type" rules={[{ required: true, message: 'Vacancy type is required' }]}>
                      <Select placeholder="Select type" onChange={(v) => setSelectedVacancyType(v)}>
                        <Select.Option value="New">New Position</Select.Option>
                        <Select.Option value="Replacement">Replacement</Select.Option>
                        <Select.Option value="Expansion">Expansion</Select.Option>
                        <Select.Option value="ProjectBased">Project Based</Select.Option>
                        <Select.Option value="Contract">Contract</Select.Option>
                        <Select.Option value="Internship">Internship</Select.Option>
                        <Select.Option value="Temporary">Temporary</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    {selectedVacancyType === 'Replacement' && (
                      <Form.Item name="replacingEmployeeId" label="Replacing Employee" rules={[{ required: true, message: 'Select employee being replaced' }]}>
                        <Select 
                          showSearch
                          placeholder="Search & select replaced employee" 
                          filterOption={(input, option) =>
                            (option?.searchText ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                          notFoundContent="No eligible employees found."
                          options={allEmployeesOptions} 
                        />
                      </Form.Item>
                    )}
                  </Col>
                </Row>
              </Card>
            </div>

            {/* Step 2: Hiring Requirements */}
            <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
              <Card title="Step 2 — Hiring Requirements" bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="minExperience" label="Min Experience (Years)">
                      <InputNumber min={0} style={{ width: '100%', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="maxExperience" label="Max Experience (Years)">
                      <InputNumber min={0} style={{ width: '100%', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="targetDate" 
                      label="Expected DOJ / Target Date"
                      rules={[
                        { required: true, message: 'Target date is required' },
                        {
                          validator: (_, value) => {
                            if (value && value.isBefore(dayjs(), 'day')) {
                              return Promise.reject(new Error('Expected DOJ cannot be in the past'));
                            }
                            return Promise.resolve();
                          }
                        }
                      ]}
                    >
                      <DatePicker style={{ width: '100%', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="skillsRequired" label="Skills Required (Comma separated)">
                      <Input placeholder="e.g. Java, Spring Boot, Microservices" style={{ borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="jobDescription" label="Detailed Job Description (JD)">
                  <Input.TextArea rows={6} style={{ borderRadius: 8 }} placeholder="Describe roles, responsibilities, daily objectives..." />
                </Form.Item>
              </Card>
            </div>

            {/* Step 3: Budget & Business Details */}
            <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
              <Card title="Step 3 — Budget & Business Details" bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="minSalary" 
                      label="Min Salary Budget (Annual CTC in INR)"
                      extra={designationMinSalaryHelper}
                      rules={[
                        {
                          validator: (_, value) => {
                            if (value !== undefined && value !== null && minAllowedSalary > 0 && value < minAllowedSalary) {
                              return Promise.reject(new Error(`Minimum salary must be at least ₹${minAllowedSalary.toLocaleString()}/year`))
                            }
                            return Promise.resolve()
                          }
                        }
                      ]}
                    >
                      <InputNumber min={0} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\₹\s?|(,*)/g, '')} style={{ width: '100%', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name="maxSalary" 
                      label="Max Salary Budget (Annual CTC in INR)"
                      extra={designationMaxSalaryHelper}
                      rules={[
                        {
                          validator: (_, value) => {
                            if (value !== undefined && value !== null && maxAllowedSalary > 0 && value > maxAllowedSalary) {
                              return Promise.reject(new Error(`Maximum Salary budget cannot exceed the designation maximum basic limit (₹${maxAllowedSalary.toLocaleString()} per annum).`))
                            }
                            return Promise.resolve()
                          }
                        }
                      ]}
                    >
                      <InputNumber min={0} formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\₹\s?|(,*)/g, '')} style={{ width: '100%', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="sourcingPreference" label="Sourcing Preference">
                      <Select placeholder="Select sourcing mode">
                        <Select.Option value="IJP">Internal Job Posting (IJP)</Select.Option>
                        <Select.Option value="Referral">Employee Referral</Select.Option>
                        <Select.Option value="Portal">Recruitment Portals</Select.Option>
                        <Select.Option value="Campus">Campus Placement</Select.Option>
                        <Select.Option value="All">All Sources</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item 
                  name="justification" 
                  label={`Business Justification (Required - Current: ${justificationWordCount} words)`}
                  rules={[
                    { required: true, message: 'Justification is mandatory' },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const words = value.trim().split(/\s+/).filter(Boolean);
                        if (words.length < 10) {
                          return Promise.reject(new Error('Business justification must be at least 10 words'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input.TextArea 
                    rows={4} 
                    style={{ borderRadius: 8 }} 
                    placeholder="Describe the business need for this role..." 
                    onChange={(e) => {
                      const count = e.target.value.trim().split(/\s+/).filter(Boolean).length
                      setJustificationWordCount(count)
                    }}
                  />
                </Form.Item>
              </Card>
            </div>

            {/* Step 4: Review & Submit */}
            {currentStep === 3 && (
              <Card title="Step 4 — Review & Verify Details" bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
                <Row gutter={16}>
                  <Col span={24}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color-base)', paddingBottom: 8 }}>Position Overview</h3>
                  </Col>
                  <Col span={8}><strong>Job Title:</strong> {form.getFieldValue('jobTitle')}</Col>
                  <Col span={8}><strong>Positions:</strong> {form.getFieldValue('noOfPositions')}</Col>
                  <Col span={8}><strong>Priority:</strong> {form.getFieldValue('priority')}</Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={8}><strong>Vacancy Type:</strong> {form.getFieldValue('vacancyType')}</Col>
                  <Col span={8}><strong>Expected DOJ:</strong> {form.getFieldValue('targetDate')?.format('YYYY-MM-DD')}</Col>
                  <Col span={8}><strong>Sourcing Preference:</strong> {form.getFieldValue('sourcingPreference')}</Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 24 }}>
                  <Col span={24}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color-base)', paddingBottom: 8 }}>Organizational Mapping</h3>
                  </Col>
                  <Col span={8}><strong>Department:</strong> {(deptsData || []).find(d => d.deptId === form.getFieldValue('deptId'))?.deptName || '-'}</Col>
                  <Col span={8}><strong>Sub-Department:</strong> {(subDeptsData || []).find(sd => sd.subDeptId === form.getFieldValue('subDeptId'))?.name || 'None'}</Col>
                  <Col span={8}><strong>Designation:</strong> {(desigsData || []).find(d => d.designationId === form.getFieldValue('designationId'))?.title || '-'}</Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={8}><strong>Grade:</strong> {(gradesData || []).find(g => g.gradeId === form.getFieldValue('gradeId'))?.name || '-'}</Col>
                  <Col span={8}><strong>Hiring Manager:</strong> {(() => {
                    const hm = (employeesData || []).find(e => e.employeeId === form.getFieldValue('hiringManagerId'));
                    return hm ? `${hm.firstName} ${hm.lastName} (${hm.employeeCode})` : '-';
                  })()}</Col>
                  {form.getFieldValue('vacancyType') === 'Replacement' && (
                    <Col span={8}><strong>Replacing Employee:</strong> {(() => {
                      const re = (employeesData || []).find(e => e.employeeId === form.getFieldValue('replacingEmployeeId'));
                      return re ? `${re.firstName} ${re.lastName} (${re.employeeCode})` : '-';
                    })()}</Col>
                  )}
                </Row>
                <Row gutter={16} style={{ marginTop: 24 }}>
                  <Col span={24}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color-base)', paddingBottom: 8 }}>Compensation & Experience</h3>
                  </Col>
                  <Col span={12}>
                    <strong>Salary Range:</strong> ₹{form.getFieldValue('minSalary')?.toLocaleString() || '0'} to ₹{form.getFieldValue('maxSalary')?.toLocaleString() || '0'}
                  </Col>
                  <Col span={12}>
                    <strong>Experience required:</strong> {form.getFieldValue('minExperience') || '0'} - {form.getFieldValue('maxExperience') || 'Any'} Years
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 24 }}>
                  <Col span={24}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color-base)', paddingBottom: 8 }}>Business Justification</h3>
                  </Col>
                  <Col span={24} style={{ whiteSpace: 'pre-wrap', fontStyle: 'italic', background: 'var(--color-bg-elevated)', padding: 12, borderRadius: 8 }}>
                    {form.getFieldValue('justification')}
                  </Col>
                </Row>
              </Card>
            )}
          </Form>
        </Col>
      </Row>

      {/* Sticky footer for navigation and trigger choices */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          left: 0,
          background: 'var(--color-bg-container)',
          borderTop: '1px solid var(--border-color-split)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -4px 10px rgba(0,0,0,0.05)',
          zIndex: 1000
        }}
      >
        <Button onClick={() => navigate('/recruitment')} disabled={isProcessing} style={{ borderRadius: 8 }}>
          Cancel
        </Button>

        <Space>
          {currentStep > 0 && (
            <Button onClick={handlePrev} disabled={isProcessing} style={{ borderRadius: 8 }}>
              Previous
            </Button>
          )}

          {currentStep < 3 ? (
            <Button type="primary" onClick={handleNext} disabled={isProcessing || (currentStep === 2 && (isSalaryInvalid || isMaxSalaryInvalid))} style={{ borderRadius: 8 }}>
              Next
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              disabled={isProcessing || isSalaryInvalid || isMaxSalaryInvalid}
              style={{ background: '#22C55E', borderColor: '#22C55E', color: '#fff', borderRadius: 8 }}
              loading={isProcessing}
            >
              Submit Requisition
            </Button>
          )}

          <Button 
            onClick={handleSaveDraft} 
            disabled={isProcessing}
            loading={createMutation.isPending || updateMutation.isPending}
            style={{ borderRadius: 8 }}
          >
            Save Draft
          </Button>
        </Space>
      </div>
    </div>
  )
}
