import { useState, useEffect, useCallback } from 'react'
import {
  Modal, Form, InputNumber, Select, Table, Checkbox, Radio, Button,
  Tag, Space, Card, Row, Col, Typography, Alert, Divider, message, Spin, Tooltip
} from 'antd'
import {
  SearchOutlined, DollarOutlined, SafetyCertificateOutlined,
  CalculatorOutlined, CheckCircleOutlined, WarningOutlined, PlusOutlined
} from '@ant-design/icons'
import api from '../../lib/axios'

const { Text, Title } = Typography

export default function SalaryStructureModal({ open, onClose, onSaveSuccess }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [employees, setEmployees] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState(null)
  const [selectedEmpName, setSelectedEmpName] = useState('')

  const [annualCTC, setAnnualCTC] = useState(600000)
  const [viewMode, setViewMode] = useState('Yearly') // 'Monthly' | 'Yearly'
  const [components, setComponents] = useState([])
  const [calcResult, setCalcResult] = useState(null)

  // Fetch employees list on modal open
  useEffect(() => {
    if (open) {
      api.get('/employees').then(res => {
        const list = res.data?.data?.items || res.data?.data || []
        setEmployees(list)
        if (list.length > 0 && !selectedEmpId) {
          const first = list[0]
          setSelectedEmpId(first.employeeId)
          setSelectedEmpName(`${first.firstName} ${first.lastName}`.trim())
        }
      }).catch(err => console.error(err))
    }
  }, [open])

  // Load employee salary structure when employee changes
  useEffect(() => {
    if (open && selectedEmpId) {
      setLoading(true)
      api.get(`/payroll/salary-builder/employee/${selectedEmpId}`)
        .then(res => {
          const data = res.data?.data
          if (data) {
            setAnnualCTC(data.annualCTC || 600000)
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
                isIncluded: true
              }))
              setComponents(allComps)
              setCalcResult(data.breakdown)
            }
          }
        })
        .catch(err => message.error("Failed to load employee salary structure."))
        .finally(() => setLoading(false))
    }
  }, [open, selectedEmpId])

  // Live Recalculate helper
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

  // Handlers for input updates
  const handleCTCChange = (val) => {
    const newCTC = val || 0
    setAnnualCTC(newCTC)
    triggerRecalculate(newCTC, components)
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
      message.success("Salary structure saved successfully!")
      if (onSaveSuccess) onSaveSuccess(res.data?.data)
      onClose()
    } catch (err) {
      message.error(err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Failed to save structure.")
    } finally {
      setSaving(false)
    }
  }

  // Render components table helper
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
                disabled={record.isBalancingComponent}
                onChange={() => handleComponentToggle(record.originalIndex)}
              />
            )
          },
          {
            title: 'Component',
            dataIndex: 'componentName',
            render: (name, record) => (
              <Space>
                <Text strong={record.isBalancingComponent}>{name}</Text>
                {record.isStatutory && <Tag color="orange"><SafetyCertificateOutlined /> Statutory</Tag>}
                {record.isBalancingComponent && <Tag color="blue">Balancing Figure</Tag>}
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
            title: 'Value Input',
            width: 150,
            render: (_, record) => {
              if (record.isBalancingComponent) {
                return <Text type="secondary" italic>(Auto-computed)</Text>
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
            title: viewMode === 'Monthly' ? 'Monthly (₹)' : 'Yearly (₹)',
            width: 140,
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
    <Modal
      title={
        <Space>
          <CalculatorOutlined style={{ color: '#1890ff', fontSize: 20 }} />
          <span>Configure Salary Structure Builder</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={920}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button
          key="save"
          type="primary"
          loading={saving}
          disabled={calcResult && !calcResult.matchesCTC}
          onClick={handleSave}
        >
          Save Structure
        </Button>
      ]}
      destroyOnClose
    >
      <Spin spinning={loading}>
        {/* Employee Search Header */}
        <Card size="small" style={{ marginBottom: 16, background: '#f8fafc' }}>
          <Row gutter={16} align="middle">
            <Col span={12}>
              <Text type="secondary">Employee Search:</Text>
              <Select
                showSearch
                style={{ width: '100%', marginTop: 4 }}
                placeholder="Search employee by name or ID..."
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
              <Text type="secondary">Annual CTC (₹):</Text>
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
              <Text type="secondary">View Display:</Text>
              <div style={{ marginTop: 6 }}>
                <Radio.Group value={viewMode} onChange={e => setViewMode(e.target.value)} size="small">
                  <Radio.Button value="Monthly">Monthly</Radio.Button>
                  <Radio.Button value="Yearly">Yearly</Radio.Button>
                </Radio.Group>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Dual Component Groups */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              size="small"
              title={<Text strong style={{ color: '#1e293b' }}>── Salary Structure (Shown on Payslip)</Text>}
              extra={<Text type="secondary">Subtotal: ₹{(viewMode === 'Monthly' ? calcResult?.salaryStructureSubtotalMonthly : calcResult?.salaryStructureSubtotalAnnual)?.toLocaleString('en-IN') || 0} / {viewMode === 'Monthly' ? 'mo' : 'yr'}</Text>}
            >
              {renderGroupTable(1)}
            </Card>
          </Col>

          <Col span={24}>
            <Card
              size="small"
              title={<Text strong style={{ color: '#1e293b' }}>── Benefits (Employer Statutory & Contributions)</Text>}
              extra={<Text type="secondary">Subtotal: ₹{(viewMode === 'Monthly' ? calcResult?.benefitsSubtotalMonthly : calcResult?.benefitsSubtotalAnnual)?.toLocaleString('en-IN') || 0} / {viewMode === 'Monthly' ? 'mo' : 'yr'}</Text>}
            >
              {renderGroupTable(2)}
            </Card>
          </Col>
        </Row>

        {/* CTC Reconciliation Status Bar */}
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
      </Spin>
    </Modal>
  )
}
