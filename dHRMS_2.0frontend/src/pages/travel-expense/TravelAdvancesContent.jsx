import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Row, Col, Statistic, Alert, message } from 'antd'
import { DollarOutlined, AlertOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons'
import { travelExpenseService } from '../../services/travelExpenseService'

export const TravelAdvancesContent = ({ requestModalOpen, setRequestModalOpen }) => {
  const [advances, setAdvances] = useState([])
  const [loading, setLoading] = useState(false)
  const [disburseModalVisible, setDisburseModalVisible] = useState(false)
  const [selectedAdvance, setSelectedAdvance] = useState(null)

  const [form] = Form.useForm()
  const [disburseForm] = Form.useForm()

  useEffect(() => {
    fetchAdvances()
  }, [])

  const fetchAdvances = async () => {
    setLoading(true)
    try {
      const data = await travelExpenseService.getAdvances()
      setAdvances(data)
    } catch (err) {
      console.error(err)
      setAdvances([
        { advanceId: '1', advanceCode: 'ADV-202608-0001', employeeName: 'Amit EngEmp1', travelCode: 'TR-202608-0001', estimatedTripCost: 20000, amountRequested: 15000, amountDisbursed: 15000, disbursementMode: 'Bank Transfer', expectedSettlementDate: '2026-08-25', status: 'Disbursed', agingDays: 12, agingBadgeColor: 'green' },
        { advanceId: '2', advanceCode: 'ADV-202608-0002', employeeName: 'Vikram FinEmp1', travelCode: 'TR-202608-0003', estimatedTripCost: 30000, amountRequested: 24000, amountDisbursed: 0, disbursementMode: 'Bank Transfer', expectedSettlementDate: '2026-09-01', status: 'Pending', agingDays: 0, agingBadgeColor: 'green' },
        { advanceId: '3', advanceCode: 'ADV-202607-0045', employeeName: 'Suresh OpsEmp1', travelCode: 'TR-202607-0089', estimatedTripCost: 25000, amountRequested: 20000, amountDisbursed: 20000, disbursementMode: 'Bank Transfer', expectedSettlementDate: '2026-07-20', status: 'OverdueRecovery', agingDays: 34, agingBadgeColor: 'red' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAdvance = async () => {
    try {
      const values = await form.validateFields()
      await travelExpenseService.requestAdvance(values)
      message.success('Travel advance requested successfully!')
      if (setRequestModalOpen) setRequestModalOpen(false)
      form.resetFields()
      fetchAdvances()
    } catch (err) {
      console.error(err)
      message.error(err.response?.data?.message || 'Failed to request advance')
    }
  }

  const handleDisburseAdvance = async () => {
    try {
      const values = await disburseForm.validateFields()
      await travelExpenseService.disburseAdvance(selectedAdvance.advanceId, values)
      message.success('Travel advance disbursed & ledger entry created!')
      setDisburseModalVisible(false)
      disburseForm.resetFields()
      fetchAdvances()
    } catch (err) {
      console.error(err)
      message.error('Failed to disburse advance')
    }
  }

  const openDisburseModal = (record) => {
    setSelectedAdvance(record)
    disburseForm.setFieldsValue({
      amountDisbursed: record.amountRequested,
      disbursementMode: record.disbursementMode || 'Bank Transfer'
    })
    setDisburseModalVisible(true)
  }

  const columns = [
    {
      title: 'Advance Code',
      dataIndex: 'advanceCode',
      key: 'advanceCode',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName'
    },
    {
      title: 'Travel Request',
      dataIndex: 'travelCode',
      key: 'travelCode'
    },
    {
      title: 'Requested',
      dataIndex: 'amountRequested',
      key: 'amountRequested',
      render: (val) => `₹ ${val?.toLocaleString()}`
    },
    {
      title: 'Disbursed',
      dataIndex: 'amountDisbursed',
      key: 'amountDisbursed',
      render: (val) => `₹ ${val?.toLocaleString()}`
    },
    {
      title: 'Settlement Deadline',
      dataIndex: 'expectedSettlementDate',
      key: 'expectedSettlementDate'
    },
    {
      title: 'Aging Tracker',
      key: 'aging',
      render: (_, record) => {
        let color = 'green'
        if (record.agingDays > 30) color = 'red'
        else if (record.agingDays > 15) color = 'orange'
        return <Tag color={color}>{record.agingDays} Days Elapsed</Tag>
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold'
        if (status === 'Disbursed') color = 'blue'
        if (status === 'Settled') color = 'green'
        if (status === 'OverdueRecovery') color = 'red'
        return <Tag color={color}>{status}</Tag>
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'Pending' && (
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => openDisburseModal(record)}>
              Disburse
            </Button>
          )}
          {record.status === 'OverdueRecovery' && (
            <Tag color="error"><AlertOutlined /> Auto Payroll Recovery</Tag>
          )}
        </Space>
      )
    }
  ]

  const totalOutstanding = advances.reduce((acc, curr) => acc + (curr.amountDisbursed || 0), 0)
  const overdueCount = advances.filter(a => a.agingDays > 30 || a.status === 'OverdueRecovery').length

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic title="Total Active Advances Disbursed" value={totalOutstanding} prefix="₹" precision={2} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic title="Pending Advance Requests" value={advances.filter(a => a.status === 'Pending').length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic title="Overdue Advances (>30 Days)" value={overdueCount} valueStyle={{ color: overdueCount > 0 ? '#cf1322' : '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      <Alert
        message="Travel Advance Control Rules"
        description="Employees cannot request a new travel advance until all prior advances are 100% settled. Advances exceeding 30 days without claim settlement trigger auto-deduction from the next payroll cycle."
        type="warning"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table
          columns={columns}
          dataSource={advances}
          rowKey="advanceId"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Request Advance Modal */}
      <Modal
        title="Request Travel Advance"
        open={requestModalOpen}
        onOk={handleRequestAdvance}
        onCancel={() => setRequestModalOpen && setRequestModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="travelRequestId" label="Linked Travel Request ID" rules={[{ required: true }]}>
            <Input placeholder="TR-202608-0001" />
          </Form.Item>
          <Form.Item name="estimatedTripCost" label="Estimated Trip Cost (₹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="25000" />
          </Form.Item>
          <Form.Item name="amountRequested" label="Advance Requested (Max 80% ₹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="20000" />
          </Form.Item>
          <Form.Item name="disbursementMode" label="Disbursement Mode" rules={[{ required: true }]}>
            <Select options={[
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Cash', label: 'Cash Disbursement' }
            ]} />
          </Form.Item>
          <Form.Item name="expectedSettlementDate" label="Expected Settlement Deadline" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Disburse Modal */}
      <Modal
        title={`Disburse Advance ${selectedAdvance?.advanceCode}`}
        open={disburseModalVisible}
        onOk={handleDisburseAdvance}
        onCancel={() => setDisburseModalVisible(false)}
      >
        <Form form={disburseForm} layout="vertical">
          <Form.Item name="amountDisbursed" label="Approved Amount to Disburse (₹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="disbursementMode" label="Payment Mode" rules={[{ required: true }]}>
            <Select options={[
              { value: 'Bank Transfer', label: 'Direct Bank Transfer' },
              { value: 'Cash', label: 'Cash' }
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TravelAdvancesContent
