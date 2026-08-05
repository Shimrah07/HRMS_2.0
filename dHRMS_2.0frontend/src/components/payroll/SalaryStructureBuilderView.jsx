import { useState, useEffect, useCallback } from 'react'
import {
  Card, Form, InputNumber, Select, Table, Checkbox, Radio, Button,
  Tag, Space, Row, Col, Typography, Alert, Divider, message, Spin, Tooltip, Badge, Modal, Input
} from 'antd'
import {
  CalculatorOutlined, CheckCircleOutlined, WarningOutlined,
  SaveOutlined, DollarOutlined, SafetyCertificateOutlined,
  ThunderboltOutlined, InfoCircleOutlined, PlusOutlined, AppstoreOutlined
} from '@ant-design/icons'
import api from '../../lib/axios'

const { Text, Title, Paragraph } = Typography
const { Option } = Select

export default function SalaryStructureBuilderView({ onSaveSuccess }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [employees, setEmployees] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState(null)
  const [selectedEmpName, setSelectedEmpName] = useState('')

  const [annualCTC, setAnnualCTC] = useState(300000) // Default 3 LPA as requested
  const [viewMode, setViewMode] = useState('Yearly') // 'Monthly' | 'Yearly'
  const [components, setComponents] = useState([])
  const [calcResult, setCalcResult] = useState(null)

  // Master catalog management inline
  const [compModalOpen, setCompModalOpen] = useState(false)
  const [compForm] = Form.useForm()
  const [savingComp, setSavingComp] = useState(false)

  // Fetch employees list on mount
  useEffect(() => {
    api.get('/employees').then(res => {
      const list = res.data?.data?.items || res.data?.data || []
      setEmployees(list)
      if (list.length > 0) {
        const first = list[0]
        setSelectedEmpId(first.employeeId)
        setSelectedEmpName(`${first.firstName} ${first.lastName}`.trim())
      }
    }).catch(err => console.error(err))
  }, [])

  // Load catalog / employee structure when employee changes
  useEffect(() => {
    if (selectedEmpId) {
      setLoading(true)
      api.get(`/payroll/salary-builder/employee/${selectedEmpId}`)
        .then(res => {
          const data = res.data?.data
          if (data) {
            setAnnualCTC(data.annualCTC || 300000)
            if (data.breakdown) {
              const allComps = [
                ...(data.breakdown.salaryStructureComponents || []),
                ...(data.breakdown.benefitComponents || [])
              ].map(c => ({
                componentId: c.componentId,
                componentName: c.componentName,
                group: c.group === 'Benefit' || c.group === 2 ? 2 : 1,
                calculationBasis: c.calculationBasis === 'PercentOfBasic' || c.calculationBasis === 2 ? 2
                                  : c.calculationBasis === 'FixedAmount' || c.calculationBasis === 3 ? 3
                                  : c.calculationBasis === 'BalancingFigure' || c.calculationBasis === 4 ? 4 : 1,
                inputMode: c.inputMode === 'FixedAmount' || c.inputMode === 2 ? 2 : 1,
                percentage: c.percentage,
                fixedAmount: c.inputMode === 2 ? c.annualAmount : 0,
                isBalancingComponent: c.isBalancingComponent || false,
                isStatutory: c.isStatutory || false,
                isTaxable: c.isTaxable || true,
                isIncluded: c.isIncluded !== false
              }))
              setComponents(allComps)
              setCalcResult(data.breakdown)
            }
          }
        })
        .catch(() => message.error("Failed to load employee structure."))
        .finally(() => setLoading(false))
    }
  }, [selectedEmpId])

  // Recalculate helper
  const triggerRecalculate = useCallback((ctcVal, compList) => {
    if (!ctcVal || compList.length === 0) return

    api.post('/payroll/salary-builder/calculate', {
      annualCTC: ctcVal,
      components: compList
    }).then(res => {
      if (res.data?.data) {
        setCalcResult(res.data.data)
      }
    }).catch(err => console.error("Recalculate error", err))
  }, [])

  const handleCTCChange = (val) => {
    const newCTC = val || 0
    setAnnualCTC(newCTC)
    triggerRecalculate(newCTC, components)
  }

  const handlePresetCTC = (presetVal) => {
    setAnnualCTC(presetVal)
    triggerRecalculate(presetVal, components)
  }

  const handleComponentToggle = (index) => {
    const updated = [...components]
    updated[index].isIncluded = !updated[index].isIncluded
    setComponents(updated)
    triggerRecalculate(annualCTC, updated)
  }

  const handleInputModeChange = (index, mode) => {
    const updated = [...components]
    updated[index].inputMode = mode
    setComponents(updated)
    triggerRecalculate(annualCTC, updated)
  }

  const handleValueChange = (index, val) => {
    const updated = [...components]
    if (updated[index].inputMode === 1) { // Percent
      updated[index].percentage = val
    } else { // FixedAmount
      updated[index].fixedAmount = val
    }
    setComponents(updated)
    triggerRecalculate(annualCTC, updated)
  }

  const handleSave = async () => {
    if (!selectedEmpId) return
    setSaving(true)
    try {
      const res = await api.post(`/payroll/salary-builder/employee/${selectedEmpId}`, {
        annualCTC,
        components
      })
      message.success(`Salary structure saved for ${selectedEmpName}!`)
      if (onSaveSuccess) onSaveSuccess(res.data?.data)
    } catch (err) {
      message.error(err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Failed to save structure.")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNewComponent = async () => {
    try {
      const values = await compForm.validateFields()
      setSavingComp(true)
      const res = await api.post('/payroll/components', values)
      const created = res.data?.data
      message.success(`Component "${values.componentName}" created successfully!`)
      setCompModalOpen(false)
      compForm.resetFields()

      // Reload employee structure or append to current components
      if (created) {
        const isBenefitGroup = values.group === 'Benefit' || values.componentType === 'EmployerContribution' || values.componentType === 'Statutory'
        const newComp = {
          componentId: created.componentId || Guid.NewGuid(),
          componentName: values.componentName,
          group: isBenefitGroup ? 2 : 1,
          calculationBasis: values.calculationType === 'Percentage' ? 1 : 3,
          inputMode: values.calculationType === 'Percentage' ? 1 : 2,
          percentage: values.defaultPercentage || 0,
          fixedAmount: 0,
          isBalancingComponent: values.isBalancingComponent || false,
          isStatutory: values.isStatutory || false,
          isTaxable: values.isTaxable !== false,
          isIncluded: true
        }
        const updatedList = [...components, newComp]
        setComponents(updatedList)
        triggerRecalculate(annualCTC, updatedList)
      }
    } catch (err) {
      if (err?.errorFields) return
      const errMsg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || err?.message || "Failed to create component."
      message.error(errMsg)
    } finally {
      setSavingComp(false)
    }
  }

  const handleBalancingToggle = (index) => {
    const updated = [...components]
    const target = updated[index]
    const newBalancingState = !target.isBalancingComponent

    // If turning ON balancing for this component, turn OFF balancing for all other components
    if (newBalancingState) {
      updated.forEach(c => { c.isBalancingComponent = false })
    }

    target.isBalancingComponent = newBalancingState
    target.calculationBasis = newBalancingState ? 4 : (target.inputMode === 2 ? 3 : 1)
    
    setComponents(updated)
    triggerRecalculate(annualCTC, updated)
  }

  const renderGroupTable = (groupType) => {
    const groupItems = components
      .map((c, idx) => ({ ...c, originalIndex: idx }))
      .filter(c => c.group === groupType)

    return (
      <Table
        dataSource={groupItems}
        rowKey="originalIndex"
        pagination={false}
        size="small"
        columns={[
          {
            title: 'Include',
            dataIndex: 'isIncluded',
            width: 70,
            render: (inc, record) => (
              <Checkbox
                checked={inc}
                onChange={() => handleComponentToggle(record.originalIndex)}
              />
            )
          },
          {
            title: 'Component Name',
            dataIndex: 'componentName',
            render: (name, record) => (
              <Space wrap>
                <Text strong={record.isBalancingComponent}>{name}</Text>
                {record.isStatutory && <Tag color="orange"><SafetyCertificateOutlined /> Statutory</Tag>}
                <Tooltip title="Check to set as auto-balancing CTC difference component">
                  <Tag
                    color={record.isBalancingComponent ? "blue" : "default"}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleBalancingToggle(record.originalIndex)}
                  >
                    {record.isBalancingComponent ? "✓ Auto-Balancing" : "+ Set as Balancing"}
                  </Tag>
                </Tooltip>
              </Space>
            )
          },
          {
            title: 'Basis / Mode',
            width: 170,
            render: (_, record) => {
              if (record.isBalancingComponent) return <Text type="secondary">CTC Difference</Text>
              return (
                <Radio.Group
                  size="small"
                  value={record.inputMode}
                  onChange={(e) => handleInputModeChange(record.originalIndex, e.target.value)}
                >
                  <Radio.Button value={1}>%</Radio.Button>
                  <Radio.Button value={2}>₹ Fixed</Radio.Button>
                </Radio.Group>
              )
            }
          },
          {
            title: 'Configured Value',
            width: 160,
            render: (_, record) => {
              if (record.isBalancingComponent) {
                return (
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" italic style={{ fontSize: 12 }}>(Auto-computed)</Text>
                    <Button
                      size="xs"
                      type="link"
                      style={{ fontSize: 11, padding: 0 }}
                      onClick={() => handleBalancingToggle(record.originalIndex)}
                    >
                      Make Editable ✎
                    </Button>
                  </Space>
                )
              }
              return record.inputMode === 1 ? (
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  precision={2}
                  suffix="%"
                  value={record.percentage}
                  onChange={(val) => handleValueChange(record.originalIndex, val)}
                  style={{ width: 110 }}
                />
              ) : (
                <InputNumber
                  size="small"
                  min={0}
                  prefix="₹"
                  precision={0}
                  value={record.fixedAmount}
                  onChange={(val) => handleValueChange(record.originalIndex, val)}
                  style={{ width: 120 }}
                />
              )
            }
          },
          {
            title: viewMode === 'Monthly' ? 'Monthly Amount (₹)' : 'Yearly Amount (₹)',
            width: 170,
            align: 'right',
            render: (_, record) => {
              const calcItem = [
                ...(calcResult?.salaryStructureComponents || []),
                ...(calcResult?.benefitComponents || [])
              ].find(c => c.componentName === record.componentName)

              if (!calcItem) return '—'
              const amount = viewMode === 'Monthly' ? calcItem.monthlyAmount : calcItem.annualAmount
              return <Text strong style={{ color: record.isBalancingComponent ? '#1890ff' : 'inherit' }}>₹{amount?.toLocaleString('en-IN')}</Text>
            }
          }
        ]}
      />
    )
  }

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        {/* Main Salary Structure Form */}
        <Col span={16}>
          <Card
            title={
              <Space>
                <CalculatorOutlined style={{ color: '#10b981', fontSize: 20 }} />
                <span>Configure Employee Salary & Beneficiary Structure</span>
              </Space>
            }
            extra={
              <Space>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setCompModalOpen(true)}
                  style={{ borderRadius: 8 }}
                >
                  Add Custom Component
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  disabled={calcResult && !calcResult.matchesCTC}
                  onClick={handleSave}
                  style={{ background: '#10b981', borderColor: '#10b981', borderRadius: 8 }}
                >
                  Save Employee Structure
                </Button>
              </Space>
            }
            style={{ borderRadius: 12, border: 'var(--border-glass)' }}
          >
            {/* Header Form Controls */}
            <Row gutter={16} align="middle" style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong type="secondary">Select Employee:</Text>
                <Select
                  showSearch
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Select employee..."
                  value={selectedEmpId}
                  onChange={(val, option) => {
                    setSelectedEmpId(val)
                    setSelectedEmpName(option.label)
                  }}
                  options={employees.map(e => ({
                    value: e.employeeId,
                    label: `${e.firstName} ${e.lastName} (${e.employeeCode || e.employeeId.slice(0, 8)})`
                  }))}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </Col>

              <Col span={8}>
                <Text strong type="secondary">Annual CTC (₹):</Text>
                <InputNumber
                  size="large"
                  style={{ width: '100%', marginTop: 4, fontWeight: 'bold' }}
                  prefix="₹"
                  min={100000}
                  max={100000000}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  value={annualCTC}
                  onChange={handleCTCChange}
                />
              </Col>

              <Col span={4} style={{ textAlign: 'right' }}>
                <Text strong type="secondary">Display View:</Text>
                <div style={{ marginTop: 6 }}>
                  <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} size="small">
                    <Radio.Button value="Monthly">Monthly</Radio.Button>
                    <Radio.Button value="Yearly">Yearly</Radio.Button>
                  </Radio.Group>
                </div>
              </Col>
            </Row>

            {/* Quick CTC Presets */}
            <div style={{ marginBottom: 16, background: '#f8fafc', padding: '8px 12px', borderRadius: 8 }}>
              <Space align="center">
                <Text type="secondary" style={{ fontSize: 13 }}><ThunderboltOutlined /> Quick Presets:</Text>
                <Button size="small" type={annualCTC === 300000 ? 'primary' : 'default'} onClick={() => handlePresetCTC(300000)}>₹3 LPA (3,00,000)</Button>
                <Button size="small" type={annualCTC === 600000 ? 'primary' : 'default'} onClick={() => handlePresetCTC(600000)}>₹6 LPA (6,00,000)</Button>
                <Button size="small" type={annualCTC === 1200000 ? 'primary' : 'default'} onClick={() => handlePresetCTC(1200000)}>₹12 LPA (12,00,000)</Button>
                <Button size="small" type={annualCTC === 2400000 ? 'primary' : 'default'} onClick={() => handlePresetCTC(2400000)}>₹24 LPA (24,00,000)</Button>
              </Space>
            </div>

            {/* Group 1: Salary Structure */}
            <Card
              size="small"
              title={<Text strong style={{ color: '#1e293b' }}>── Salary Structure (Shown on Payslip)</Text>}
              extra={<Text type="secondary">Subtotal: ₹{(viewMode === 'Monthly' ? calcResult?.salaryStructureSubtotalMonthly : calcResult?.salaryStructureSubtotalAnnual)?.toLocaleString('en-IN') || 0} / {viewMode === 'Monthly' ? 'mo' : 'yr'}</Text>}
              style={{ marginBottom: 16 }}
            >
              {renderGroupTable(1)}
            </Card>

            {/* Group 2: Benefits */}
            <Card
              size="small"
              title={<Text strong style={{ color: '#1e293b' }}>── Benefits (Employer Statutory & Contributions)</Text>}
              extra={<Text type="secondary">Subtotal: ₹{(viewMode === 'Monthly' ? calcResult?.benefitsSubtotalMonthly : calcResult?.benefitsSubtotalAnnual)?.toLocaleString('en-IN') || 0} / {viewMode === 'Monthly' ? 'mo' : 'yr'}</Text>}
            >
              {renderGroupTable(2)}
            </Card>

            {/* Live Status Bar */}
            <Divider style={{ margin: '16px 0' }} />
            {calcResult && (
              <Alert
                type={calcResult.matchesCTC ? 'success' : 'warning'}
                showIcon
                icon={calcResult.matchesCTC ? <CheckCircleOutlined /> : <WarningOutlined />}
                message={
                  <Row align="middle" justify="space-between">
                    <Col>
                      <Text strong>{calcResult.statusMessage}</Text>
                      <span style={{ marginLeft: 16 }}>
                        Total Allocated: <strong>₹{calcResult.totalAllocatedAnnual?.toLocaleString('en-IN')}</strong> / Target CTC: <strong>₹{calcResult.targetAnnualCTC?.toLocaleString('en-IN')}</strong>
                      </span>
                    </Col>
                    <Col>
                      <Tag color={calcResult.matchesCTC ? 'green' : 'volcano'}>
                        {calcResult.matchesCTC ? 'CTC Reconciled' : 'Discrepancy Detected'}
                      </Tag>
                    </Col>
                  </Row>
                }
              />
            )}
          </Card>
        </Col>

        {/* Live Example & Allocation Breakdown Card */}
        <Col span={8}>
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#3b82f6' }} />
                <span>Live CTC Division Example</span>
              </Space>
            }
            style={{ borderRadius: 12, border: 'var(--border-glass)', background: '#f8fafc' }}
          >
            <Title level={5} style={{ marginTop: 0 }}>
              CTC: ₹{annualCTC?.toLocaleString('en-IN')} / yr <Text type="secondary" style={{ fontSize: 13 }}>(₹{Math.round(annualCTC / 12)?.toLocaleString('en-IN')}/mo)</Text>
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              Division breakdown for configured percentages:
            </Text>

            <Divider style={{ margin: '8px 0' }} />

            <Title level={5} style={{ fontSize: 13, color: '#475569' }}>Salary Structure (Payslip Earnings)</Title>
            {calcResult?.salaryStructureComponents?.map((c, i) => (
              <Row key={i} justify="space-between" style={{ padding: '3px 0' }}>
                <Col span={14}>
                  <Text style={{ fontSize: 13 }}>{c.componentName}</Text>
                  {c.isBalancingComponent && <Tag color="blue" style={{ fontSize: 10, marginLeft: 4 }}>Balancing</Tag>}
                </Col>
                <Col span={10} style={{ textAlign: 'right' }}>
                  <Text strong style={{ fontSize: 13 }}>₹{c.annualAmount?.toLocaleString('en-IN')}</Text>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>₹{c.monthlyAmount?.toLocaleString('en-IN')}/mo</Text>
                </Col>
              </Row>
            ))}
            <Row justify="space-between" style={{ padding: '6px 0', borderTop: '1px dashed #cbd5e1', marginTop: 4 }}>
              <Text strong style={{ fontSize: 13 }}>Payslip Subtotal</Text>
              <Text strong style={{ color: '#059669', fontSize: 13 }}>₹{calcResult?.salaryStructureSubtotalAnnual?.toLocaleString('en-IN')}/yr</Text>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Title level={5} style={{ fontSize: 13, color: '#475569' }}>Benefits (Employer Statutory)</Title>
            {calcResult?.benefitComponents?.map((c, i) => (
              <Row key={i} justify="space-between" style={{ padding: '3px 0' }}>
                <Col span={14}>
                  <Text style={{ fontSize: 13 }}>{c.componentName}</Text>
                </Col>
                <Col span={10} style={{ textAlign: 'right' }}>
                  <Text strong style={{ fontSize: 13 }}>₹{c.annualAmount?.toLocaleString('en-IN')}</Text>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>₹{c.monthlyAmount?.toLocaleString('en-IN')}/mo</Text>
                </Col>
              </Row>
            ))}
            <Row justify="space-between" style={{ padding: '6px 0', borderTop: '1px dashed #cbd5e1', marginTop: 4 }}>
              <Text strong style={{ fontSize: 13 }}>Benefits Subtotal</Text>
              <Text strong style={{ color: '#2563eb', fontSize: 13 }}>₹{calcResult?.benefitsSubtotalAnnual?.toLocaleString('en-IN')}/yr</Text>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Card size="small" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', borderRadius: 8 }}>
              <Row justify="space-between" align="middle">
                <Text strong style={{ color: '#065f46' }}>Total Cost to Company</Text>
                <Text strong style={{ color: '#047857', fontSize: 16 }}>₹{calcResult?.totalAllocatedAnnual?.toLocaleString('en-IN')}</Text>
              </Row>
            </Card>
          </Card>
        </Col>
      </Row>

      {/* Inline Create Component Modal */}
      <Modal
        title="Add Salary or Beneficiary Component"
        open={compModalOpen}
        onCancel={() => setCompModalOpen(false)}
        onOk={handleCreateNewComponent}
        confirmLoading={savingComp}
        okText="Create Component"
        width={500}
        destroyOnClose
      >
        <Form form={compForm} layout="vertical" initialValues={{ isStatutory: false, isTaxable: true, group: 'SalaryStructure', calculationType: 'Percentage', componentType: 'Earning' }}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="componentName" label="Component Name" rules={[{ required: true, message: 'Name is required' }]}>
                <Input placeholder="e.g. Health Insurance Allowance" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="componentCode" label="Short Code" tooltip="Short code must be unique (e.g. HRA_ALLOW, HRA_CUSTOM)" rules={[{ required: true, message: 'Unique short code is required' }]}>
                <Input placeholder="e.g. HRA_CUSTOM" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="group" label="Component Classification" rules={[{ required: true }]}>
                <Select>
                  <Option value="SalaryStructure">Salary Structure (Payslip)</Option>
                  <Option value="Benefit">Beneficiary / Benefits (Employer)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="componentType" label="Component Type" rules={[{ required: true }]}>
                <Select>
                  <Option value="Earning">Earning</Option>
                  <Option value="Deduction">Deduction</Option>
                  <Option value="Statutory">Statutory</Option>
                  <Option value="EmployerContribution">Employer Contribution</Option>
                  <Option value="Reimbursement">Reimbursement</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="calculationType" label="Calculation Type">
                <Select>
                  <Option value="Percentage">% of CTC / Basic</Option>
                  <Option value="Fixed">Fixed Amount</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultPercentage" label="Default Allocation (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} suffix="%" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Spin>
  )
}
