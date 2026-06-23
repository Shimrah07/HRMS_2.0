import { useState, useEffect } from 'react'
import { Card, Button, Row, Col, Space, Table, Tag, Modal, Form, Input, DatePicker, Select, Progress, message, Tooltip, Avatar, notification } from 'antd'
import { VALIDATORS } from '../../constants/validation'
import {
  CalendarOutlined, PlusOutlined, DeleteOutlined, UserOutlined,
  InfoCircleOutlined, FileTextOutlined, HistoryOutlined, FormOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import useAuthStore from '../../store/authStore'
import EmptyState from '../../components/common/EmptyState'


export default function LeavePage() {
  const { user } = useAuthStore()
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [leaveBalances, setLeaveBalances] = useState({ PL: 12, CL: 4, SL: 5, CompOff: 2 })
  const [requests, setRequests] = useState([])
  const [applyForm] = Form.useForm()

  useEffect(() => {
    const storedBalances = localStorage.getItem(`leave_balances_${user?.id}`)
    const storedRequests = localStorage.getItem(`leave_requests_${user?.id}`)

    if (storedBalances) {
      setLeaveBalances(JSON.parse(storedBalances))
    }
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests))
    } else {
      setRequests([
        { key: '1', type: 'Sick Leave', start: dayjs().subtract(3, 'day').format('DD MMM YYYY'), end: dayjs().subtract(2, 'day').format('DD MMM YYYY'), days: 2, reason: 'Flu recovery', status: 'Approved' },
        { key: '2', type: 'Paid Leave', start: dayjs().add(5, 'day').format('DD MMM YYYY'), end: dayjs().add(7, 'day').format('DD MMM YYYY'), days: 3, reason: 'Family vacation', status: 'Pending' }
      ])
    }
  }, [user])

  const handleApplyLeave = (values) => {
    const start = values.dateRange[0]
    const end = values.dateRange[1]
    const days = end.diff(start, 'day') + 1

    let abbrev = 'PL'
    if (values.type === 'Sick Leave') abbrev = 'SL'
    else if (values.type === 'Casual Leave') abbrev = 'CL'
    else if (values.type === 'Comp Off') abbrev = 'CompOff'

    if (leaveBalances[abbrev] < days) {
      notification.error({
        message: 'Insufficient Balance',
        description: `Insufficient ${values.type} balance! You only have ${leaveBalances[abbrev]} days left.`,
        placement: 'topRight'
      })
      return
    }

    // Deduct balances
    const newBalances = { ...leaveBalances, [abbrev]: leaveBalances[abbrev] - days }
    setLeaveBalances(newBalances)
    localStorage.setItem(`leave_balances_${user?.id}`, JSON.stringify(newBalances))

    // Save request
    const newReq = {
      key: Date.now().toString(),
      type: values.type,
      start: start.format('DD MMM YYYY'),
      end: end.format('DD MMM YYYY'),
      days,
      reason: values.reason,
      status: 'Pending'
    }
    const newList = [...requests, newReq]
    setRequests(newList)
    localStorage.setItem(`leave_requests_${user?.id}`, JSON.stringify(newList))

    setIsApplyModalOpen(false)
    applyForm.resetFields()
    notification.success({
      message: 'Leave Applied',
      description: `Successfully applied for ${days} days of ${values.type}. Approval is pending.`,
      placement: 'topRight'
    })
  }

  const handleCancelRequest = (key, type, days) => {
    let abbrev = 'PL'
    if (type === 'Sick Leave') abbrev = 'SL'
    else if (type === 'Casual Leave') abbrev = 'CL'
    else if (type === 'Comp Off') abbrev = 'CompOff'

    // Return balance
    const newBalances = { ...leaveBalances, [abbrev]: leaveBalances[abbrev] + days }
    setLeaveBalances(newBalances)
    localStorage.setItem(`leave_balances_${user?.id}`, JSON.stringify(newBalances))

    const newList = requests.filter(r => r.key !== key)
    setRequests(newList)
    localStorage.setItem(`leave_requests_${user?.id}`, JSON.stringify(newList))
    notification.info({
      message: 'Request Cancelled',
      description: 'Leave request cancelled and balance restored.',
      placement: 'topRight'
    })
  }

  const columns = [
    { title: 'Leave Type', dataIndex: 'type', key: 'type', render: (v) => <strong style={{ color: 'var(--color-text-primary)' }}>{v}</strong> },
    { title: 'Start Date', dataIndex: 'start', key: 'start' },
    { title: 'End Date', dataIndex: 'end', key: 'end' },
    { title: 'Duration', dataIndex: 'days', key: 'days', render: (v) => <Tag style={{ borderRadius: 6, fontWeight: 700 }}>{v} Days</Tag> },
    { title: 'Reason', dataIndex: 'reason', key: 'reason' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => v === 'Approved' ? <Tag color="success">Approved</Tag> : v === 'Pending' ? <Tag color="warning">Pending</Tag> : <Tag color="error">Rejected</Tag> },
    {
      title: '',
      key: 'action',
      render: (_, r) => r.status === 'Pending' ? (
        <Button size="small" type="link" danger onClick={() => handleCancelRequest(r.key, r.type, r.days)}>
          Cancel
        </Button>
      ) : null
    }
  ]

  const balancesData = [
    { label: 'Paid Leave', key: 'PL', max: 18, color: '#10113F' },
    { label: 'Casual Leave', key: 'CL', max: 8, color: '#FAA71A' },
    { label: 'Sick Leave', key: 'SL', max: 6, color: '#861630' },
    { label: 'Comp Off', key: 'CompOff', max: 2, color: '#4D1B3B' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Leave Management"
        subtitle="View leave balances, apply for leave, and view historical request logs"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Leave' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsApplyModalOpen(true)} style={{ borderRadius: 8 }}>
            Apply for Leave
          </Button>
        }
      />

      {/* Leave Balances Circular Gauges */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {balancesData.map((bal) => {
          const val = leaveBalances[bal.key] || 0
          const percent = Math.round((val / bal.max) * 100)
          return (
            <Col xs={12} sm={6} key={bal.key}>
              <Card
                style={{
                  borderRadius: 16,
                  border: 'var(--border-glass)',
                  background: 'var(--color-card-bg)',
                  boxShadow: 'var(--shadow-subtle)',
                  textAlign: 'center',
                }}
                bodyStyle={{ padding: '20px 16px' }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  {bal.label}
                </div>
                <Progress
                  type="circle"
                  percent={percent}
                  strokeColor={bal.color}
                  format={() => (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>{val}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>/ {bal.max}</div>
                    </div>
                  )}
                  width={90}
                />
              </Card>
            </Col>
          )
        })}
      </Row>

      <Row gutter={[20, 20]}>
        {/* Left - Out of Office today */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <UserOutlined style={{ color: '#FAA71A' }} />
                <span>Out of Office Today</span>
              </Space>
            }
            style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)', height: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { name: 'Rohan Sharma', dept: 'Engineering', type: 'Sick Leave', initial: 'RS' },
                { name: 'Priya Iyer', dept: 'HR & Operations', type: 'Paid Leave', initial: 'PI' },
              ].map((member, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--color-surface)', borderRadius: 10, border: 'var(--border-glass)' }}>
                  <Avatar style={{ background: '#10113F', fontWeight: 700 }}>{member.initial}</Avatar>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{member.dept}</div>
                  </div>
                  <Tag color="orange" style={{ margin: 0, fontSize: 9 }}>{member.type}</Tag>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right - Leave History */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: '#FAA71A' }} />
                <span>Leave Applications</span>
              </Space>
            }
            style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)', overflow: 'hidden' }}
          >
            <Table columns={columns} dataSource={requests} pagination={{ pageSize: 5 }} locale={{ emptyText: <EmptyState variant="leave" action={() => setIsApplyModalOpen(true)} /> }} />
          </Card>
        </Col>
      </Row>

      {/* Apply Leave Modal */}
      <Modal
        title="Apply for Leave"
        open={isApplyModalOpen}
        onCancel={() => setIsApplyModalOpen(false)}
        onOk={() => applyForm.submit()}
        destroyOnClose
      >
        <Form form={applyForm} layout="vertical" onFinish={handleApplyLeave} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
          <Form.Item name="type" label="Leave Type" rules={[VALIDATORS.requiredSelect('Leave Type')]}>
            <Select placeholder="Select leave type" style={{ borderRadius: 8 }}>
              <Select.Option value="Paid Leave">Paid Leave (PL)</Select.Option>
              <Select.Option value="Casual Leave">Casual Leave (CL)</Select.Option>
              <Select.Option value="Sick Leave">Sick Leave (SL)</Select.Option>
              <Select.Option value="Comp Off">Compensatory Off (Comp-Off)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="Date Range" rules={[VALIDATORS.requiredSelect('Date Range')]}>
            <DatePicker.RangePicker style={{ width: '100%', borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason for Leave" rules={[VALIDATORS.required('Reason for Leave')]}>
            <Input.TextArea rows={3} placeholder="Please describe the reason for your leave..." style={{ borderRadius: 8 }} />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
