import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Input, InputNumber,
  Select, Switch, Row, Col, Space, Tooltip, message, Popconfirm, Divider
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined,
  CheckCircleOutlined, InfoCircleOutlined, SafetyCertificateOutlined
} from '@ant-design/icons'
import useUIStore from '../../store/uiStore'

export default function LeavePolicyTab() {
  const { isDarkMode } = useUIStore()
  const [leaveTypes, setLeaveTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [form] = Form.useForm()

  // Default seed list matching BRD Section 3.0
  const defaultSeedTypes = [
    { key: '1', leaveTypeId: '1', leaveTypeName: 'Earned Leave / Privilege Leave', leaveCode: 'EL', maxDaysPerYear: 18, maxDaysPerApplication: 15, accrualFrequency: 'Monthly', accrualRate: 1.5, isCarryForward: true, maxCarryForwardDays: 45, isEncashable: true, encashmentRule: 'YearEnd', isPaidLeave: true, applicableGender: 'All', minNoticeDays: 3, sandwichRuleApplicable: true, proRataForMidYear: true },
    { key: '2', leaveTypeId: '2', leaveTypeName: 'Casual Leave', leaveCode: 'CL', maxDaysPerYear: 10, maxDaysPerApplication: 3, accrualFrequency: 'Yearly', accrualRate: 10, isCarryForward: false, maxCarryForwardDays: 0, isEncashable: false, encashmentRule: 'None', isPaidLeave: true, applicableGender: 'All', minNoticeDays: 1, sandwichRuleApplicable: false, proRataForMidYear: true },
    { key: '3', leaveTypeId: '3', leaveTypeName: 'Sick Leave / Medical Leave', leaveCode: 'SL', maxDaysPerYear: 8, maxDaysPerApplication: 5, accrualFrequency: 'Yearly', accrualRate: 8, isCarryForward: false, maxCarryForwardDays: 0, isEncashable: false, encashmentRule: 'None', isPaidLeave: true, applicableGender: 'All', minNoticeDays: 0, sandwichRuleApplicable: false, proRataForMidYear: true },
    { key: '4', leaveTypeId: '4', leaveTypeName: 'Maternity Leave', leaveCode: 'ML', maxDaysPerYear: 182, maxDaysPerApplication: 182, accrualFrequency: 'Event', accrualRate: 182, isCarryForward: false, maxCarryForwardDays: 0, isEncashable: false, encashmentRule: 'None', isPaidLeave: true, applicableGender: 'Female', minNoticeDays: 30, sandwichRuleApplicable: false, proRataForMidYear: false },
    { key: '5', leaveTypeId: '5', leaveTypeName: 'Paternity Leave', leaveCode: 'PTL', maxDaysPerYear: 10, maxDaysPerApplication: 10, accrualFrequency: 'Event', accrualRate: 10, isCarryForward: false, maxCarryForwardDays: 0, isEncashable: false, encashmentRule: 'None', isPaidLeave: true, applicableGender: 'Male', minNoticeDays: 7, sandwichRuleApplicable: false, proRataForMidYear: false },
    { key: '6', leaveTypeId: '6', leaveTypeName: 'Compensatory Off', leaveCode: 'CO', maxDaysPerYear: 12, maxDaysPerApplication: 2, accrualFrequency: 'Event', accrualRate: 1, isCarryForward: false, maxCarryForwardDays: 0, isEncashable: true, encashmentRule: 'YearEnd', isPaidLeave: true, applicableGender: 'All', minNoticeDays: 1, sandwichRuleApplicable: false, proRataForMidYear: false },
    { key: '7', leaveTypeId: '7', leaveTypeName: 'Loss of Pay', leaveCode: 'LOP', maxDaysPerYear: 365, maxDaysPerApplication: 90, accrualFrequency: 'Event', accrualRate: 0, isCarryForward: false, maxCarryForwardDays: 0, isEncashable: false, encashmentRule: 'None', isPaidLeave: false, applicableGender: 'All', minNoticeDays: 0, sandwichRuleApplicable: false, proRataForMidYear: false }
  ]

  useEffect(() => {
    fetchLeaveTypes()
  }, [])

  const fetchLeaveTypes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/leave/types')
      if (res.ok) {
        const data = await res.json()
        setLeaveTypes(data.length > 0 ? data : defaultSeedTypes)
      } else {
        setLeaveTypes(defaultSeedTypes)
      }
    } catch (err) {
      setLeaveTypes(defaultSeedTypes)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (record = null) => {
    setEditingType(record)
    if (record) {
      form.setFieldsValue(record)
    } else {
      form.resetFields()
      form.setFieldsValue({
        accrualFrequency: 'Monthly',
        applicableGender: 'All',
        isPaidLeave: true,
        isCarryForward: false,
        isEncashable: false,
        proRataForMidYear: true,
        sandwichRuleApplicable: false,
        minNoticeDays: 3
      })
    }
    setIsModalOpen(true)
  }

  const handleSaveLeaveType = async (values) => {
    try {
      if (editingType) {
        const updated = leaveTypes.map(t => t.leaveCode === editingType.leaveCode ? { ...t, ...values } : t)
        setLeaveTypes(updated)
        message.success(`Updated policy for ${values.leaveTypeName}`)
      } else {
        const newType = { key: Date.now().toString(), leaveTypeId: Date.now().toString(), ...values }
        setLeaveTypes([...leaveTypes, newType])
        message.success(`Created new leave type: ${values.leaveTypeName}`)
      }
      setIsModalOpen(false)
    } catch (err) {
      message.error('Failed to save leave policy')
    }
  }

  const handleDelete = (code) => {
    setLeaveTypes(leaveTypes.filter(t => t.leaveCode !== code))
    message.success(`Deactivated leave type ${code}`)
  }

  const columns = [
    {
      title: 'Leave Code & Name',
      key: 'name',
      render: (_, r) => (
        <div>
          <Space>
            <Tag color="#7C3AED" style={{ fontWeight: 800, fontSize: 11 }}>{r.leaveCode}</Tag>
            <strong style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>{r.leaveTypeName}</strong>
          </Space>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {r.isPaidLeave ? <span style={{ color: '#10B981', fontWeight: 600 }}>Paid Leave</span> : <span style={{ color: '#EF4444', fontWeight: 600 }}>Unpaid (LOP)</span>} • {r.applicableGender} Employees
          </div>
        </div>
      )
    },
    {
      title: 'Annual Quota',
      dataIndex: 'maxDaysPerYear',
      key: 'maxDaysPerYear',
      render: (v, r) => (
        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--color-text-primary)' }}>
          {v} Days <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', fontWeight: 500 }}>({r.accrualFrequency})</span>
        </span>
      )
    },
    {
      title: 'Max Per App',
      dataIndex: 'maxDaysPerApplication',
      key: 'maxDaysPerApplication',
      render: (v) => <Tag style={{ borderRadius: 6 }}>Max {v} days</Tag>
    },
    {
      title: 'Carry Forward',
      key: 'carryForward',
      render: (_, r) => r.isCarryForward ? (
        <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700 }}>Max {r.maxCarryForwardDays} Days</Tag>
      ) : (
        <Tag color="default" style={{ borderRadius: 6 }}>Lapses</Tag>
      )
    },
    {
      title: 'Encashment',
      key: 'encashment',
      render: (_, r) => r.isEncashable ? (
        <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>Encashable ({r.encashmentRule})</Tag>
      ) : (
        <Tag color="default" style={{ borderRadius: 6 }}>No</Tag>
      )
    },
    {
      title: 'Sandwich Rule',
      dataIndex: 'sandwichRuleApplicable',
      key: 'sandwichRuleApplicable',
      render: (v) => v ? <Tag color="warning" style={{ fontWeight: 700 }}>Applicable</Tag> : <Tag color="default">Off</Tag>
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, r) => (
        <Space>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleOpenModal(r)} />
          <Popconfirm title={`Deactivate ${r.leaveCode}?`} onConfirm={() => handleDelete(r.leaveCode)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8, fontWeight: 700 }}>
          Configure New Leave Type
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Table columns={columns} dataSource={leaveTypes} loading={loading} pagination={false} rowKey="leaveCode" />
      </Card>

      {/* Policy Drawer / Modal */}
      <Modal
        title={editingType ? `Edit Policy — ${editingType.leaveTypeName}` : 'Configure New Leave Type'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveLeaveType}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="leaveTypeName" label="Leave Type Name" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. Earned Leave / Privilege Leave" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="leaveCode" label="Leave Code" rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder="e.g. EL" uppercase style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="maxDaysPerYear" label="Annual Quota (Days)" rules={[{ required: true }]}>
                <InputNumber min={0} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxDaysPerApplication" label="Max Days Per Request">
                <InputNumber min={1} max={365} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="accrualFrequency" label="Accrual Frequency">
                <Select>
                  <Select.Option value="Monthly">Monthly</Select.Option>
                  <Select.Option value="Quarterly">Quarterly</Select.Option>
                  <Select.Option value="Yearly">Yearly (Upfront)</Select.Option>
                  <Select.Option value="Event">Event-based</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="applicableGender" label="Applicable Gender">
                <Select>
                  <Select.Option value="All">All Employees</Select.Option>
                  <Select.Option value="Female">Female Only (ML)</Select.Option>
                  <Select.Option value="Male">Male Only (PTL)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="minNoticeDays" label="Min Prior Notice (Days)">
                <InputNumber min={0} max={60} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="encashmentRule" label="Encashment Policy">
                <Select>
                  <Select.Option value="YearEnd">Year-End & Exit</Select.Option>
                  <Select.Option value="ExitOnly">Exit Only</Select.Option>
                  <Select.Option value="None">Non-Encashable</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="isCarryForward" label="Carry Forward?" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="maxCarryForwardDays" label="Max Carry Cap">
                <InputNumber min={0} max={180} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isEncashable" label="Is Encashable?" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sandwichRuleApplicable" label="Sandwich Rule?" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="proRataForMidYear" label="Pro-Rata for Joiners?" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isPaidLeave" label="Is Paid Leave?" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
