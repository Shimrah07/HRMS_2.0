import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Select, Tag, Space, Row, Col, Typography, message, Steps, Statistic, Alert } from 'antd'
import { CheckOutlined, CloseOutlined, BankOutlined, MoneyCollectOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { travelExpenseService } from '../../services/travelExpenseService'

const { Text } = Typography

export const ApprovalsReimbursementTab = () => {
  const [pendingClaims, setPendingClaims] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  const [form] = Form.useForm()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const claims = await travelExpenseService.getExpenseClaims()
      setPendingClaims(claims.filter(c => c.status === 'Submitted' || c.status === 'ManagerApproved'))

      const batchList = await travelExpenseService.getReimbursementBatches()
      setBatches(batchList)
    } catch (err) {
      console.error(err)
      // Fallback demo data
      setPendingClaims([
        { claimId: '1', claimCode: 'CLM-202608-0001', employeeName: 'Amit EngEmp1', totalAmount: 18500, advanceAdjusted: 15000, netPayable: 3500, status: 'Submitted' },
        { claimId: '2', claimCode: 'CLM-202608-0002', employeeName: 'Sneha HRAdmin', totalAmount: 85000, advanceAdjusted: 50000, netPayable: 35000, status: 'ManagerApproved' }
      ])
      setBatches([
        { batchId: '1', batchCode: 'BAT-202607-0001', runDate: '2026-07-31', totalClaims: 14, totalAmount: 142500, disbursementMode: 'Payroll' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (record, roleLevel) => {
    try {
      await travelExpenseService.approveExpenseClaim(record.claimId, { roleLevel, isApproved: true })
      message.success(`Expense claim approved by ${roleLevel}!`)
      fetchData()
    } catch (err) {
      console.error(err)
      message.error('Failed to approve claim')
    }
  }

  const handleReject = async (record, roleLevel) => {
    try {
      await travelExpenseService.approveExpenseClaim(record.claimId, { roleLevel, isApproved: false, rejectionReason: 'Policy violation' })
      message.success(`Expense claim rejected by ${roleLevel}`)
      fetchData()
    } catch (err) {
      console.error(err)
      message.error('Failed to reject claim')
    }
  }

  const handleCreateBatch = async () => {
    try {
      const values = await form.validateFields()
      await travelExpenseService.createReimbursementBatch({
        claimIds: selectedRowKeys,
        disbursementMode: values.disbursementMode
      })
      message.success('Reimbursement payout batch executed successfully!')
      setBatchModalVisible(false)
      setSelectedRowKeys([])
      fetchData()
    } catch (err) {
      console.error(err)
      message.error('Failed to execute reimbursement batch')
    }
  }

  const columns = [
    {
      title: 'Claim Code',
      dataIndex: 'claimCode',
      key: 'claimCode',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName'
    },
    {
      title: 'Total Claim',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val) => `₹ ${val?.toLocaleString()}`
    },
    {
      title: 'Advance Offset',
      dataIndex: 'advanceAdjusted',
      key: 'advanceAdjusted',
      render: (val) => `₹ ${val?.toLocaleString()}`
    },
    {
      title: 'Net Payable',
      dataIndex: 'netPayable',
      key: 'netPayable',
      render: (val) => <Text strong style={{ color: '#3f8600' }}>₹ {val?.toLocaleString()}</Text>
    },
    {
      title: 'Approval Stage',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold'
        if (status === 'Submitted') color = 'gold'
        if (status === 'ManagerApproved') color = 'blue'
        return <Tag color={color}>{status === 'Submitted' ? 'Awaiting Manager (L1)' : 'Awaiting Finance (L2)'}</Tag>
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'Submitted' && (
            <>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record, 'Manager')}>
                Manager Approve
              </Button>
              <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleReject(record, 'Manager')}>
                Reject
              </Button>
            </>
          )}
          {record.status === 'ManagerApproved' && (
            <>
              <Button type="primary" size="small" style={{ background: '#52c41a', borderColor: '#52c41a' }} icon={<CheckOutlined />} onClick={() => handleApprove(record, 'Finance')}>
                Finance Approve
              </Button>
              <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleReject(record, 'Finance')}>
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  const batchColumns = [
    { title: 'Batch Code', dataIndex: 'batchCode', key: 'batchCode', render: (text) => <strong>{text}</strong> },
    { title: 'Run Date', dataIndex: 'runDate', key: 'runDate' },
    { title: 'Total Claims', dataIndex: 'totalClaims', key: 'totalClaims' },
    { title: 'Total Disbursed', dataIndex: 'totalAmount', key: 'totalAmount', render: (val) => `₹ ${val?.toLocaleString()}` },
    { title: 'Disbursement Mode', dataIndex: 'disbursementMode', key: 'disbursementMode', render: (mode) => <Tag color="blue">{mode}</Tag> }
  ]

  return (
    <div style={{ padding: '16px 0' }}>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={24}>
          <Card title="T&E Claim Approval Lifecycle Stepper">
            <Steps
              current={1}
              items={[
                { title: 'Employee Submitted', description: 'Claim compiled' },
                { title: 'Manager Review (L1)', description: 'Business justification' },
                { title: 'Finance Review (L2)', description: 'High value / policy check' },
                { title: 'Reimbursement Payout', description: 'Payroll / Bank transfer' }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <MoneyCollectOutlined style={{ color: '#1890ff' }} />
            <span>Pending Manager & Finance Approval Queue</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<BankOutlined />}
            disabled={selectedRowKeys.length === 0}
            onClick={() => setBatchModalVisible(true)}
          >
            Run Reimbursement Payout Batch ({selectedRowKeys.length})
          </Button>
        }
        style={{ marginBottom: 20 }}
      >
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys)
          }}
          columns={columns}
          dataSource={pendingClaims}
          rowKey="claimId"
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Card
        title={
          <Space>
            <BankOutlined style={{ color: '#52c41a' }} />
            <span>Executed Reimbursement Batches History</span>
          </Space>
        }
      >
        <Table
          columns={batchColumns}
          dataSource={batches}
          rowKey="batchId"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* Reimbursement Batch Wizard Modal */}
      <Modal
        title="Execute Reimbursement Payout Batch"
        open={batchModalVisible}
        onOk={handleCreateBatch}
        onCancel={() => setBatchModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Alert
            message="Batch Payout Summary"
            description={`Selected Claims: ${selectedRowKeys.length}. Payout will immediately credit net payable amounts.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item name="disbursementMode" label="Disbursement Mode" rules={[{ required: true }]} initialValue="Payroll">
            <Select options={[
              { value: 'Payroll', label: 'Include in Next Salary Payroll Run (Add-on)' },
              { value: 'BankTransfer', label: 'Direct Instant Bank Transfer' }
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
