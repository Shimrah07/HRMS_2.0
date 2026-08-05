import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Row, Col, Statistic, Space, Descriptions, Divider, message, Typography } from 'antd'
import { CalculatorOutlined, CheckCircleOutlined, DollarOutlined, BankOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import exitService from '../../services/exitService'

const { Text, Title } = Typography

export default function FullFinalSettlementPage() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [ffsData, setFfsData] = useState(null)
  const [calcModalOpen, setCalcModalOpen] = useState(false)
  const [disburseModalOpen, setDisburseModalOpen] = useState(false)

  const [disburseForm] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await exitService.getExitRecords({ page: 1, pageSize: 50 })
      setRecords(res.items || [])
    } catch (err) {
      console.error(err)
      message.error('Failed to load FFS records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCalculateFfs = async (record) => {
    setSelectedRecord(record)
    setLoading(true)
    try {
      const data = await exitService.calculateFFS(record.exitId)
      setFfsData(data)
      setCalcModalOpen(true)
    } catch (err) {
      console.error(err)
      message.error(err.response?.data?.message || 'Failed to calculate FFS')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveFfs = async () => {
    if (!selectedRecord) return
    try {
      await exitService.approveFFS(selectedRecord.exitId, { remarks: 'Approved by Finance Head' })
      message.success('FFS approved by Finance')
      setCalcModalOpen(false)
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to approve FFS')
    }
  }

  const handleDisburseFfs = async (values) => {
    if (!selectedRecord) return
    try {
      await exitService.disburseFFS(selectedRecord.exitId, { paymentReference: values.paymentReference })
      message.success('FFS payment disbursed successfully & Exit Closed')
      setDisburseModalOpen(false)
      disburseForm.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to disburse FFS')
    }
  }

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.employeeCode} · {record.departmentName}</div>
        </div>
      )
    },
    {
      title: 'LWD',
      dataIndex: 'confirmedLwd',
      key: 'confirmedLwd',
      render: (date) => date || 'Pending'
    },
    {
      title: 'Gross Earnings',
      key: 'gross',
      render: (_, record) => record.ffsCalculation ? `₹${record.ffsCalculation.grossPayable?.toLocaleString('en-IN')}` : '-'
    },
    {
      title: 'Total Deductions',
      key: 'deductions',
      render: (_, record) => {
        if (!record.ffsCalculation) return '-'
        const f = record.ffsCalculation
        const total = (f.assetDeduction || 0) + (f.loanDeduction || 0) + (f.noticeShortfallDeduction || 0) + (f.tdsDeduction || 0)
        return <Text type="danger">₹{total.toLocaleString('en-IN')}</Text>
      }
    },
    {
      title: 'Net Payable FFS',
      key: 'net',
      render: (_, record) => record.ffsCalculation ? <Text type="success" style={{ fontWeight: 700 }}>₹{record.ffsCalculation.netPayable?.toLocaleString('en-IN')}</Text> : <Tag>Not Calculated</Tag>
    },
    {
      title: 'FFS Status',
      key: 'status',
      render: (_, record) => {
        const s = record.ffsCalculation?.status
        switch (s) {
          case 'Approved': return <Tag color="blue">Finance Approved</Tag>
          case 'Disbursed': return <Tag color="success">Disbursed & Closed</Tag>
          case 'Calculated': return <Tag color="warning">Review Ready</Tag>
          default: return <Tag color="default">Pending Clearance</Tag>
        }
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" type="primary" icon={<CalculatorOutlined />} onClick={() => handleCalculateFfs(record)}>
            {record.ffsCalculation ? 'View Calculation' : 'Calculate FFS'}
          </Button>
          {record.ffsCalculation?.status === 'Approved' && (
            <Button size="small" type="primary" style={{ background: '#52c41a' }} icon={<BankOutlined />} onClick={() => { setSelectedRecord(record); setDisburseModalOpen(true); }}>
              Disburse Payment
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Full & Final Settlement (FFS)"
        subtitle="Automated final payout calculation including pending salary, leave encashment, gratuity, bonus minus asset/loan/notice recoveries"
        breadcrumbs={[
          { title: 'Home', href: '/dashboard' },
          { title: 'Exit Management' },
          { title: 'Full & Final Settlement' }
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="FFS Under Processing" value={records.filter(r => r.status === 'FFSProcessing').length} prefix={<CalculatorOutlined style={{ color: '#FAA71A' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Finance Approved" value={records.filter(r => r.ffsCalculation?.status === 'Approved').length} prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Settlements Disbursed" value={records.filter(r => r.ffsCalculation?.status === 'Disbursed').length} prefix={<DollarOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
      </Row>

      <Card title="Full & Final Settlement Register">
        <Table columns={columns} dataSource={records} rowKey="exitId" loading={loading} />
      </Card>

      {/* FFS Sheet Modal */}
      <Modal
        title={`FFS Statement Sheet — ${selectedRecord?.employeeName || ''}`}
        width={700}
        open={calcModalOpen}
        onCancel={() => setCalcModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setCalcModalOpen(false)}>Close</Button>,
          ffsData?.status === 'Calculated' && (
            <Button key="approve" type="primary" icon={<CheckCircleOutlined />} onClick={handleApproveFfs}>
              Approve FFS Statement
            </Button>
          )
        ]}
      >
        {ffsData && (
          <div>
            <Descriptions title="Employee Details" bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Employee Code">{selectedRecord?.employeeCode}</Descriptions.Item>
              <Descriptions.Item label="Department">{selectedRecord?.departmentName}</Descriptions.Item>
              <Descriptions.Item label="Resignation Date">{selectedRecord?.resignationDate ? new Date(selectedRecord.resignationDate).toLocaleDateString() : '-'}</Descriptions.Item>
              <Descriptions.Item label="Confirmed LWD">{selectedRecord?.confirmedLwd || '-'}</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ color: '#52c41a' }}>Additions (Dues)</Title>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Pending Salary (Exit Month)">₹{ffsData.pendingSalary?.toLocaleString('en-IN')}</Descriptions.Item>
              <Descriptions.Item label="Leave Encashment">₹{ffsData.leaveEncashment?.toLocaleString('en-IN')}</Descriptions.Item>
              <Descriptions.Item label="Gratuity (Service ≥ 5 yrs)">₹{ffsData.gratuity?.toLocaleString('en-IN')}</Descriptions.Item>
              <Descriptions.Item label="Pro-rata Bonus">₹{ffsData.proRataBonus?.toLocaleString('en-IN')}</Descriptions.Item>
              <Descriptions.Item label="Total Gross Earnings" span={2}>
                <Text type="success" style={{ fontWeight: 700 }}>₹{ffsData.grossPayable?.toLocaleString('en-IN')}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ color: '#ff4d4f' }}>Deductions (Recoveries)</Title>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Asset Deduction">₹{ffsData.assetDeduction?.toLocaleString('en-IN')}</Descriptions.Item>
              <Descriptions.Item label="Outstanding Loan/Advance">₹{ffsData.loanDeduction?.toLocaleString('en-IN')}</Descriptions.Item>
              <Descriptions.Item label="Notice Shortfall Deduction">₹{ffsData.noticeShortfallDeduction?.toLocaleString('en-IN')}</Descriptions.Item>
              <Descriptions.Item label="TDS Deduction">₹{ffsData.tdsDeduction?.toLocaleString('en-IN')}</Descriptions.Item>
            </Descriptions>

            <Divider />
            <Row justify="space-between" align="middle" style={{ background: '#f6ffed', padding: '16px', borderRadius: 8, border: '1px solid #b7eb8f' }}>
              <Col><Text style={{ fontSize: 16, fontWeight: 600 }}>NET FFS PAYABLE</Text></Col>
              <Col><Title level={3} style={{ color: '#52c41a', margin: 0 }}>₹{ffsData.netPayable?.toLocaleString('en-IN')}</Title></Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Disburse Modal */}
      <Modal
        title="Process Final Settlement Disbursement"
        open={disburseModalOpen}
        onCancel={() => setDisburseModalOpen(false)}
        onOk={() => disburseForm.submit()}
      >
        <Form form={disburseForm} layout="vertical" onFinish={handleDisburseFfs}>
          <Form.Item name="paymentReference" label="Bank Transaction Reference / UTR Number" rules={[{ required: true }]}>
            <Input placeholder="e.g. UTR109823908123" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
