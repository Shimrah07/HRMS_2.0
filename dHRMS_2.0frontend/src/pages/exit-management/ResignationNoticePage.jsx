import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Row, Col, Statistic, Space, Drawer, Typography, message, Alert, Tooltip, Descriptions, Divider, Badge } from 'antd'
import { PlusOutlined, FileTextOutlined, CalendarOutlined, CheckCircleOutlined, SyncOutlined, UserOutlined, UndoOutlined, CalculatorOutlined, InfoCircleOutlined, DollarOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import exitService from '../../services/exitService'
import dayjs from 'dayjs'

const { Option } = Select
const { Text, Title, Paragraph } = Typography

export default function ResignationNoticePage() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  const [statusFilter, setStatusFilter] = useState(null)
  
  const [resignationModalOpen, setResignationModalOpen] = useState(false)
  const [confirmLwdModalOpen, setConfirmLwdModalOpen] = useState(false)
  const [withdrawDrawerOpen, setWithdrawDrawerOpen] = useState(false)
  const [noticeCalcDrawerOpen, setNoticeCalcDrawerOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [myNoticeCalc, setMyNoticeCalc] = useState(null)

  const [resignationForm] = Form.useForm()
  const [lwdForm] = Form.useForm()
  const [withdrawForm] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await exitService.getExitRecords({ page: pagination.page, pageSize: pagination.pageSize, status: statusFilter })
      setRecords(res.items || [])
      setPagination(prev => ({ ...prev, total: res.totalCount || 0 }))
    } catch (err) {
      console.error(err)
      message.error('Failed to load exit records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.page, statusFilter])

  const handleFetchNoticePeriodCalc = async (empId) => {
    setNoticeCalcDrawerOpen(true)
    try {
      const calc = await exitService.calculateNoticePeriod(empId || '00000000-0000-0000-0000-000000000000')
      setMyNoticeCalc(calc)
    } catch (err) {
      console.error(err)
    }
  }


  const handleResignationSubmit = async (values) => {
    try {
      await exitService.submitResignation({
        exitType: values.exitType,
        proposedLwd: values.proposedLwd.format('YYYY-MM-DD'),
        primaryReason: values.primaryReason,
        additionalComments: values.additionalComments
      })
      message.success('Resignation submitted successfully. Reporting Manager & HR notified.')
      setResignationModalOpen(false)
      resignationForm.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error(err.response?.data?.message || 'Failed to submit resignation')
    }
  }

  const handleConfirmLwd = async (values) => {
    if (!selectedRecord) return
    try {
      await exitService.confirmLastWorkingDay(selectedRecord.exitId, {
        confirmedLwd: values.confirmedLwd.format('YYYY-MM-DD'),
        earlyReleaseApproved: values.earlyReleaseApproved || false,
        buyoutAllowed: values.buyoutAllowed || false,
        buyoutAmount: parseFloat(values.buyoutAmount || 0),
        remarks: values.remarks
      })
      message.success('Last working day confirmed & employee moved to Notice Period stage')
      setConfirmLwdModalOpen(false)
      lwdForm.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to confirm last working day')
    }
  }

  const handleWithdrawResignation = async (values) => {
    if (!selectedRecord) return
    try {
      await exitService.withdrawResignation(selectedRecord.exitId, {
        withdrawalReason: values.withdrawalReason
      })
      message.success('Resignation withdrawal processed. Employee status restored to Active.')
      setWithdrawDrawerOpen(false)
      withdrawForm.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to withdraw resignation')
    }
  }

  const getStatusTag = (status) => {
    switch (status) {
      case 'ResignationSubmitted': return <Tag color="orange">Resignation Submitted</Tag>
      case 'NoticePeriod': return <Tag color="processing">Serving Notice</Tag>
      case 'ClearanceInProgress': return <Tag color="purple">Clearance In Progress</Tag>
      case 'FFSProcessing': return <Tag color="cyan">FFS Processing</Tag>
      case 'Closed': return <Tag color="success">Exit Closed</Tag>
      case 'Withdrawn': return <Tag color="default">Withdrawn</Tag>
      default: return <Tag>{status}</Tag>
    }
  }

  const columns = [
    {
      title: 'Employee Details',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text || 'Employee'}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.employeeCode} · {record.departmentName}</div>
          <div style={{ fontSize: 12, color: '#595959' }}>Designation: {record.designationTitle || 'N/A'}</div>
        </div>
      )
    },
    {
      title: 'Exit Type',
      dataIndex: 'exitType',
      key: 'exitType',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Resignation Date',
      dataIndex: 'resignationDate',
      key: 'resignationDate',
      render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-'
    },
    {
      title: 'Policy Notice',
      dataIndex: 'noticePeriodDays',
      key: 'noticePeriodDays',
      render: (days) => <Tag color="gold">{days} Days</Tag>
    },
    {
      title: 'Proposed LWD',
      dataIndex: 'proposedLwd',
      key: 'proposedLwd',
      render: (date, record) => (
        <div>
          <div>{date ? dayjs(date).format('DD MMM YYYY') : '-'}</div>
          {record.earlyReleaseRequested && <Badge status="warning" text="Early Release Requested" />}
        </div>
      )
    },
    {
      title: 'Confirmed LWD',
      dataIndex: 'confirmedLwd',
      key: 'confirmedLwd',
      render: (date) => date ? <Text type="success" style={{ fontWeight: 600 }}>{dayjs(date).format('DD MMM YYYY')}</Text> : <Text type="secondary">Pending HR</Text>
    },
    {
      title: 'Reason for Leaving',
      dataIndex: 'primaryReason',
      key: 'primaryReason',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'ResignationSubmitted' && (
            <Button size="small" type="primary" onClick={() => { setSelectedRecord(record); setConfirmLwdModalOpen(true); }}>
              Confirm LWD
            </Button>
          )}
          {record.status !== 'Closed' && record.status !== 'Withdrawn' && (
            <Button size="small" danger icon={<UndoOutlined />} onClick={() => { setSelectedRecord(record); setWithdrawDrawerOpen(true); }}>
              Withdraw
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Resignation & Notice Period Engine"
        subtitle="Grade-based policy notice duration engine, early release approval, shortfall buyout estimation, and resignation lifecycle management"
        breadcrumbs={[
          { title: 'Home', href: '/dashboard' },
          { title: 'Exit Management' },
          { title: 'Resignation & Notice' }
        ]}
        extra={
          <Space>
            <Button icon={<CalculatorOutlined />} onClick={() => handleFetchNoticePeriodCalc()}>
              Notice Policy Calculator
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setResignationModalOpen(true)}>
              Submit Resignation
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card">
            <Statistic title="Total Exit Applications" value={records.length} prefix={<FileTextOutlined style={{ color: '#FAA71A' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card">
            <Statistic title="Serving Notice Period" value={records.filter(r => r.status === 'NoticePeriod').length} prefix={<CalendarOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card">
            <Statistic title="Clearance In Progress" value={records.filter(r => r.status === 'ClearanceInProgress').length} prefix={<SyncOutlined spin style={{ color: '#722ed1' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="glass-card">
            <Statistic title="Resignations Withdrawn" value={records.filter(r => r.status === 'Withdrawn').length} prefix={<UndoOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
      </Row>

      <Card title="Resignation & Exit Applications Master Pipeline" extra={
        <Select allowClear placeholder="Filter Exit Status" style={{ width: 220 }} onChange={setStatusFilter}>
          <Option value="ResignationSubmitted">Resignation Submitted</Option>
          <Option value="NoticePeriod">Serving Notice Period</Option>
          <Option value="ClearanceInProgress">Clearance In Progress</Option>
          <Option value="FFSProcessing">FFS Processing</Option>
          <Option value="Closed">Exit Closed</Option>
          <Option value="Withdrawn">Resignation Withdrawn</Option>
        </Select>
      }>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="exitId"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, page, pageSize }))
          }}
        />
      </Card>

      {/* Resignation Submission Modal */}
      <Modal
        title="Submit Resignation Application"
        open={resignationModalOpen}
        onCancel={() => setResignationModalOpen(false)}
        onOk={() => resignationForm.submit()}
      >
        <Alert message="Important: Resignation submission will initiate formal offboarding notice period tracking and alert your reporting manager and HR Admin." type="warning" showIcon style={{ marginBottom: 16 }} />
        <Form form={resignationForm} layout="vertical" onFinish={handleResignationSubmit}>
          <Form.Item name="exitType" label="Separation / Exit Type" rules={[{ required: true, message: 'Please select exit type' }]}>
            <Select placeholder="Select Exit Type">
              <Option value="Voluntary">Voluntary Resignation</Option>
              <Option value="Retirement">Retirement</Option>
              <Option value="ContractEnd">Contract Expiry</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="proposedLwd"
            label="Proposed Last Working Day"
            rules={[
              { required: true, message: 'Proposed last working day is required' },
              () => ({
                validator(_, value) {
                  if (!value || value.isAfter(dayjs().subtract(1, 'day'))) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Proposed last working day cannot be in the past'))
                }
              })
            ]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="primaryReason" label="Primary Reason for Resignation" rules={[{ required: true, message: 'Please select primary reason' }]}>
            <Select placeholder="Select Primary Reason">
              <Option value="Better Opportunity / Career Growth">Better Opportunity / Career Growth</Option>
              <Option value="Compensation">Compensation & Benefits</Option>
              <Option value="Relocation">Relocation</Option>
              <Option value="Higher Studies">Higher Studies</Option>
              <Option value="Personal/Family Reasons">Personal/Family Reasons</Option>
              <Option value="Work Environment">Work Environment / Culture</Option>
            </Select>
          </Form.Item>
          <Form.Item name="additionalComments" label="Additional Context & Transition Notes">
            <Input.TextArea rows={3} placeholder="Provide details regarding transition plan, current projects, or reasons" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirm LWD & Early Release Modal */}
      <Modal
        title={`Confirm Last Working Day — ${selectedRecord?.employeeName || ''}`}
        open={confirmLwdModalOpen}
        onCancel={() => setConfirmLwdModalOpen(false)}
        onOk={() => lwdForm.submit()}
      >
        <Form form={lwdForm} layout="vertical" onFinish={handleConfirmLwd} initialValues={{ confirmedLwd: selectedRecord?.proposedLwd ? dayjs(selectedRecord.proposedLwd) : dayjs() }}>
          <Form.Item name="confirmedLwd" label="Confirmed Last Working Day" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="earlyReleaseApproved" label="Early Release Approval" valuePropName="checked">
            <Select placeholder="Early Release Status">
              <Option value={true}>Approved (Waiver of shortfall days)</Option>
              <Option value={false}>Not Approved (Must serve full policy days or buyout)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="buyoutAllowed" label="Notice Shortfall Buyout">
            <Select placeholder="Shortfall Buyout Status">
              <Option value={true}>Allowed (Deduct notice shortfall in FFS)</Option>
              <Option value={false}>Not Allowed</Option>
            </Select>
          </Form.Item>
          <Form.Item name="buyoutAmount" label="Notice Shortfall Buyout Amount (₹)">
            <Input type="number" placeholder="Enter calculated buyout recovery amount" />
          </Form.Item>
          <Form.Item name="remarks" label="HR Acknowledgement Remarks">
            <Input.TextArea rows={2} placeholder="Enter official HR confirmation notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Withdrawal Request Drawer */}
      <Drawer
        title="Withdraw Resignation Application"
        width={420}
        open={withdrawDrawerOpen}
        onClose={() => setWithdrawDrawerOpen(false)}
      >
        <Alert message="Withdrawing your resignation will cancel all pending offboarding tasks and restore your active employee profile status." type="info" showIcon style={{ marginBottom: 16 }} />
        <Form form={withdrawForm} layout="vertical" onFinish={handleWithdrawResignation}>
          <Form.Item name="withdrawalReason" label="Reason for Resignation Withdrawal" rules={[{ required: true, message: 'Reason for withdrawal is required' }]}>
            <Input.TextArea rows={4} placeholder="State why you are requesting to withdraw your resignation (e.g. Counter offer accepted, career change decision)" />
          </Form.Item>
          <Button type="primary" danger block onClick={() => withdrawForm.submit()}>
            Submit Resignation Withdrawal
          </Button>
        </Form>
      </Drawer>

      {/* Notice Period Policy Rule Calculator Drawer */}
      <Drawer
        title="Grade-wise Notice Period Policy Engine Rules"
        width={500}
        open={noticeCalcDrawerOpen}
        onClose={() => setNoticeCalcDrawerOpen(false)}
      >
        <Title level={5}>Company Standard Policy Matrix</Title>
        <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Probationers (PROB)">15 Calendar Days (Manager Approval)</Descriptions.Item>
          <Descriptions.Item label="Band A & B (Junior / Executive)">30 Calendar Days (Manager + HR Approval)</Descriptions.Item>
          <Descriptions.Item label="Band C (Manager / Lead)">60 Calendar Days (HOD + HR Approval)</Descriptions.Item>
          <Descriptions.Item label="Band D & E (Senior Mgmt / Leadership)">90 Calendar Days (CHRO & CEO Approval mandatory)</Descriptions.Item>
        </Descriptions>

        {myNoticeCalc && (
          <Card title="Calculated Rules for Employee" size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <p><strong>Required Policy Notice:</strong> {myNoticeCalc.policyDays} Days</p>
            <p><strong>Calculated Last Working Day:</strong> {myNoticeCalc.calculatedLwd}</p>
            <p><strong>Early Release Waiver:</strong> {myNoticeCalc.earlyReleaseAllowed ? 'Allowed with approval' : 'Not allowed'}</p>
            <p><strong>Buyout Allowed:</strong> {myNoticeCalc.buyoutAllowed ? 'Yes (Pro-rata Basic + DA)' : 'No'}</p>
            <p><strong>Required Approvals:</strong> <Text type="danger">{myNoticeCalc.requiredApprovals}</Text></p>
          </Card>
        )}
      </Drawer>
    </div>
  )
}
