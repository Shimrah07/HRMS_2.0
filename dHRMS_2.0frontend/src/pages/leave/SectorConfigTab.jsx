import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, Row, Col, Space,
  Statistic, Alert, Switch, message, Tooltip, Segmented, Divider, Popconfirm
} from 'antd'
import {
  ToolOutlined, AuditOutlined, BlockOutlined, PlusOutlined,
  CheckCircleOutlined, InfoCircleOutlined, SafetyOutlined, BuildOutlined
} from '@ant-design/icons'
import useUIStore from '../../store/uiStore'

export default function SectorConfigTab() {
  const { isDarkMode } = useUIStore()
  const [sectorConfigs, setSectorConfigs] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeSector, setActiveSector] = useState('Manufacturing')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [form] = Form.useForm()

  // Factories Act Interactive Simulator State
  const [daysWorked, setDaysWorked] = useState(260)
  const [factoriesCalcResult, setFactoriesCalcResult] = useState(null)

  const defaultConfigs = [
    { sectorConfigId: 'sc-1', industryType: 'Manufacturing', ruleKey: 'FactoriesAct_240DayRule', ruleValue: 'Minimum 240 days worked required in year', isActive: true },
    { sectorConfigId: 'sc-2', industryType: 'Manufacturing', ruleKey: 'FactoriesAct_LeaveAccrualRate', ruleValue: '1 day Earned Leave per 20 days worked', isActive: true },
    { sectorConfigId: 'sc-3', industryType: 'IT', ruleKey: 'Flexi_WFH_Overlay', ruleValue: 'Up to 4 WFH days per month allowed during leave', isActive: true },
    { sectorConfigId: 'sc-4', industryType: 'Retail', ruleKey: 'Blackout_DiwaliSeason', ruleValue: '2026-11-01 to 2026-11-15 (Peak Shopping)', isActive: true },
    { sectorConfigId: 'sc-5', industryType: 'Retail', ruleKey: 'Blackout_YearEndAudit_OverrideAllowed', ruleValue: '2026-12-24 to 2026-12-31 (Inventory Audit)', isActive: true }
  ]

  useEffect(() => {
    fetchSectorConfigs()
    runFactoriesCalc(260)
  }, [activeSector])

  const fetchSectorConfigs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/leave/sector/configs')
      if (res.ok) {
        const data = await res.json()
        setSectorConfigs(data.length > 0 ? data : defaultConfigs)
      } else {
        setSectorConfigs(defaultConfigs)
      }
    } catch (err) {
      setSectorConfigs(defaultConfigs)
    } finally {
      setLoading(false)
    }
  }

  const runFactoriesCalc = async (val) => {
    setDaysWorked(val)
    try {
      const res = await fetch(`/api/v1/leave/sector/factories-act/accrual?employeeId=11111111-1111-1111-1111-111111111111&daysWorked=${val}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setFactoriesCalcResult(data)
      } else {
        const meets = val >= 240
        const accrued = meets ? Math.floor(val / 20) : 0
        setFactoriesCalcResult({
          daysWorkedInYear: val,
          meets240DaysEligibility: meets,
          earnedLeaveAccrued: accrued,
          ruleDescription: meets ? `Eligible under Factories Act 1948 Sec 79 (${val} days worked >= 240 day cap). Accrued ${accrued} Earned Leave days (1 per 20 worked).` : `Ineligible under Factories Act 1948 Sec 79 (${val} days worked is below 240 day minimum threshold).`
        })
      }
    } catch (err) {
      const meets = val >= 240
      const accrued = meets ? Math.floor(val / 20) : 0
      setFactoriesCalcResult({
        daysWorkedInYear: val,
        meets240DaysEligibility: meets,
        earnedLeaveAccrued: accrued,
        ruleDescription: meets ? `Eligible under Factories Act 1948 Sec 79 (${val} days worked >= 240 day cap). Accrued ${accrued} Earned Leave days (1 per 20 worked).` : `Ineligible under Factories Act 1948 Sec 79 (${val} days worked is below 240 day minimum threshold).`
      })
    }
  }

  const handleAddConfig = async (values) => {
    const newCfg = {
      sectorConfigId: `sc-${Date.now()}`,
      industryType: activeSector,
      ruleKey: values.ruleKey,
      ruleValue: values.ruleValue,
      isActive: true
    }

    setSectorConfigs([...sectorConfigs, newCfg])
    message.success(`Added sector rule '${values.ruleKey}' for ${activeSector} sector.`)
    setIsAddModalOpen(false)
    form.resetFields()
  }

  const filteredConfigs = sectorConfigs.filter(c => c.industryType === activeSector)

  const columns = [
    {
      title: 'Industry Sector',
      dataIndex: 'industryType',
      key: 'industryType',
      render: (v) => <Tag color={v === 'Manufacturing' ? 'orange' : v === 'IT' ? 'blue' : 'magenta'} style={{ fontWeight: 700 }}>{v}</Tag>
    },
    {
      title: 'Rule Key / Compliance Identifier',
      dataIndex: 'ruleKey',
      key: 'ruleKey',
      render: (v) => <strong style={{ color: 'var(--color-text-primary)' }}>{v}</strong>
    },
    {
      title: 'Rule Parameters & Value',
      dataIndex: 'ruleValue',
      key: 'ruleValue',
      render: (v) => <Tag style={{ borderRadius: 6 }}>{v}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v) => <Tag color={v ? 'success' : 'default'}>{v ? 'Active Enforced' : 'Disabled'}</Tag>
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 18 }}>
        <Space>
          <Segmented
            options={['Manufacturing', 'IT', 'Retail']}
            value={activeSector}
            onChange={setActiveSector}
            style={{ fontWeight: 700 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)} style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8, fontWeight: 700 }}>
            Add Sector Rule
          </Button>
        </Space>
      </div>

      {activeSector === 'Manufacturing' && (
        <Card style={{ borderRadius: 14, border: '1px solid #F59E0B', background: isDarkMode ? '#1e1910' : '#FFFBEB', marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#D97706', fontWeight: 800 }}>
            <BuildOutlined /> Factories Act 1948 (Section 79) Earned Leave Compliance Simulator
          </h4>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-primary)' }}>
                Enter Total Days Worked in Calendar Year:
              </label>
              <InputNumber
                value={daysWorked}
                min={0}
                max={365}
                onChange={runFactoriesCalc}
                style={{ width: '100%' }}
              />
            </Col>
            {factoriesCalcResult && (
              <>
                <Col span={8}>
                  <Statistic
                    title="240-Day Eligibility Cap"
                    value={factoriesCalcResult.meets240DaysEligibility ? "ELIGIBLE (>= 240 Days)" : "INELIGIBLE (< 240 Days)"}
                    valueStyle={{ color: factoriesCalcResult.meets240DaysEligibility ? '#10B981' : '#EF4444', fontSize: 16, fontWeight: 800 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Accrued Earned Leave (1 Day per 20 Worked)"
                    value={factoriesCalcResult.earnedLeaveAccrued}
                    suffix="Days"
                    valueStyle={{ color: '#F59E0B', fontWeight: 800 }}
                  />
                </Col>
              </>
            )}
          </Row>
          {factoriesCalcResult && (
            <Alert
              type={factoriesCalcResult.meets240DaysEligibility ? "success" : "error"}
              showIcon
              message={factoriesCalcResult.ruleDescription}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>
      )}

      {activeSector === 'Retail' && (
        <Alert
          type="warning"
          showIcon
          message="Retail & Hospitality Festival Blackout Window Protection Active"
          description="Leave applications falling in Blackout Periods (Diwali Season 1-15 Nov, Year-End Inventory Audit 24-31 Dec) require explicit HR Manager override."
          style={{ marginBottom: 20 }}
        />
      )}

      {activeSector === 'IT' && (
        <Alert
          type="info"
          showIcon
          message="IT / ITeS Sector Flexible Work & Project Blackout Policies Enforced"
          description="Enforces maximum 4 Work-From-Home overlays per month and project release blackout dates."
          style={{ marginBottom: 20 }}
        />
      )}

      <Card style={{ borderRadius: 14, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <h4 style={{ margin: '0 0 16px 0', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Active Rules Matrix for {activeSector} Sector
        </h4>
        <Table columns={columns} dataSource={filteredConfigs} loading={loading} pagination={false} rowKey="sectorConfigId" />
      </Card>

      {/* Add Sector Rule Modal */}
      <Modal
        title={`Add Custom Sector Rule for ${activeSector}`}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddConfig}>
          <Form.Item name="ruleKey" label="Rule Identifier / Key" rules={[{ required: true }]}>
            <Input placeholder="e.g. Blackout_Q4Release or FactoriesAct_YoungPersonRate" />
          </Form.Item>
          <Form.Item name="ruleValue" label="Rule Parameters / Values" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Describe rule values or date ranges..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
