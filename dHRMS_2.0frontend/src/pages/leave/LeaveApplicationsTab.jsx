import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Input, DatePicker, Select, Switch,
  Row, Col, Space, Tooltip, message, Badge, Alert, Avatar, Popconfirm
} from 'antd'
import {
  PlusOutlined, CheckOutlined, CloseOutlined, StopOutlined, UserOutlined,
  FileTextOutlined, WarningOutlined, UploadOutlined, TeamOutlined, CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import useUIStore from '../../store/uiStore'

export default function LeaveApplicationsTab() {
  const { isDarkMode } = useUIStore()
  const [activeTabKey, setActiveTabKey] = useState('all')
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [calculatedDays, setCalculatedDays] = useState(0)
  const [overlapPct, setOverlapPct] = useState(0)
  const [form] = Form.useForm()
  const [rejectForm] = Form.useForm()

  const defaultApplications = [
    { leaveAppId: 'app-1', employeeName: 'Rohan Sharma', departmentName: 'Engineering', leaveTypeName: 'Paid Leave', leaveCode: 'PL', fromDate: dayjs().add(2, 'day').format('YYYY-MM-DD'), toDate: dayjs().add(4, 'day').format('YYYY-MM-DD'), totalDays: 3, isHalfDay: false, reason: 'Family event', backupEmployeeName: 'Ankit Patel', status: 'Pending', appliedAt: dayjs().subtract(1, 'day').toISOString() },
    { leaveAppId: 'app-2', employeeName: 'Priya Iyer', departmentName: 'HR & Operations', leaveTypeName: 'Sick Leave', leaveCode: 'SL', fromDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), toDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), totalDays: 2, isHalfDay: false, reason: 'Viral Fever', backupEmployeeName: 'Meera Nair', status: 'Approved', appliedAt: dayjs().subtract(3, 'day').toISOString() },
    { leaveAppId: 'app-3', employeeName: 'Vikram Verma', departmentName: 'Product Management', leaveTypeName: 'Earned Leave', leaveCode: 'EL', fromDate: dayjs().add(10, 'day').format('YYYY-MM-DD'), toDate: dayjs().add(17, 'day').format('YYYY-MM-DD'), totalDays: 8, isHalfDay: false, reason: 'Annual Leave', backupEmployeeName: 'Sanjay Dutt', status: 'Level1Approved', appliedAt: dayjs().subtract(1, 'day').toISOString() }
  ]

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/leave/applications/pending?managerId=11111111-1111-1111-1111-111111111111')
      if (res.ok) {
        const data = await res.json()
        setApplications(data.length > 0 ? data : defaultApplications)
      } else {
        setApplications(defaultApplications)
      }
    } catch (err) {
      setApplications(defaultApplications)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      const start = dates[0]
      const end = dates[1]
      const diff = end.diff(start, 'day') + 1
      setCalculatedDays(diff)
      // Check mock overlap
      setOverlapPct(diff >= 5 ? 35 : 12)
    } else {
      setCalculatedDays(0)
      setOverlapPct(0)
    }
  }

  const handleApplyLeave = (values) => {
    const fromDate = values.dateRange[0].format('YYYY-MM-DD')
    const toDate = values.dateRange[1].format('YYYY-MM-DD')
    const days = values.isHalfDay ? 0.5 : calculatedDays

    const newApp = {
      leaveAppId: `app-${Date.now()}`,
      employeeName: 'Current User (You)',
      departmentName: 'Engineering',
      leaveTypeName: values.leaveType === 'SL' ? 'Sick Leave' : values.leaveType === 'CL' ? 'Casual Leave' : 'Paid Leave',
      leaveCode: values.leaveType,
      fromDate,
      toDate,
      totalDays: days,
      isHalfDay: values.isHalfDay || false,
      halfDayType: values.halfDayType,
      reason: values.reason,
      backupEmployeeName: values.backupEmployee || 'Team Handover',
      status: 'Pending',
      appliedAt: new Date().toISOString()
    }

    setApplications([newApp, ...applications])
    message.success(`Applied for ${days} day(s) of ${values.leaveType}. Manager approval pending.`)
    setIsApplyModalOpen(false)
    form.resetFields()
  }

  const handleApprove = (record) => {
    const updated = applications.map(a => {
      if (a.leaveAppId === record.leaveAppId) {
        if (a.totalDays > 5 && a.status === 'Pending') {
          return { ...a, status: 'Level1Approved' }
        }
        return { ...a, status: 'Approved' }
      }
      return a
    })
    setApplications(updated)
    if (record.totalDays > 5 && record.status === 'Pending') {
      message.info(`Level 1 approved for ${record.employeeName}. Escalated to HOD (Level 2).`)
    } else {
      message.success(`Approved leave application for ${record.employeeName}`)
    }
  }

  const handleRejectSubmit = (values) => {
    if (!selectedApp) return
    const updated = applications.map(a =>
      a.leaveAppId === selectedApp.leaveAppId ? { ...a, status: 'Rejected', rejectionReason: values.remarks } : a
    )
    setApplications(updated)
    message.warning(`Rejected leave request for ${selectedApp.employeeName}`)
    setIsRejectModalOpen(false)
    rejectForm.resetFields()
  }

  const handleCancel = (record) => {
    setApplications(applications.filter(a => a.leaveAppId !== record.leaveAppId))
    message.info(`Cancelled leave application #${record.leaveAppId}`)
  }

  const filteredData = activeTabKey === 'all'
    ? applications
    : applications.filter(a => a.status.toLowerCase() === activeTabKey)

  const columns = [
    {
      title: 'Employee & Dept',
      key: 'employee',
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: '#7C3AED', fontWeight: 700 }}>{r.employeeName[0]}</Avatar>
          <div>
            <strong style={{ color: 'var(--color-text-primary)', fontSize: 13 }}>{r.employeeName}</strong>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.departmentName}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Leave Details',
      key: 'type',
      render: (_, r) => (
        <div>
          <Space>
            <Tag color="#7C3AED" style={{ fontWeight: 800 }}>{r.leaveCode}</Tag>
            <span style={{ fontWeight: 600 }}>{r.leaveTypeName}</span>
          </Space>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {r.fromDate} to {r.toDate}
          </div>
        </div>
      )
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, r) => (
        <div>
          <Tag style={{ borderRadius: 6, fontWeight: 700 }}>{r.totalDays} Days</Tag>
          {r.totalDays > 5 && <Tag color="volcano" style={{ fontSize: 10 }}>2-Level Esc.</Tag>}
        </div>
      )
    },
    {
      title: 'Reason & Handover',
      key: 'reason',
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 12, fontWeight: 500 }}>"{r.reason}"</div>
          {r.backupEmployeeName && (
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              <TeamOutlined style={{ marginRight: 4 }} /> Handover: {r.backupEmployeeName}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        if (v === 'Approved') return <Tag color="success" style={{ fontWeight: 700 }}>Approved</Tag>
        if (v === 'Level1Approved') return <Tag color="processing" style={{ fontWeight: 700 }}>L1 Approved (HOD Pending)</Tag>
        if (v === 'Rejected') return <Tag color="error" style={{ fontWeight: 700 }}>Rejected</Tag>
        return <Tag color="warning" style={{ fontWeight: 700 }}>Pending Approval</Tag>
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          {(r.status === 'Pending' || r.status === 'Level1Approved') && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(r)} style={{ background: '#10B981', borderColor: '#10B981', borderRadius: 6 }}>
                Approve
              </Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => { setSelectedApp(r); setIsRejectModalOpen(true) }} style={{ borderRadius: 6 }}>
                Reject
              </Button>
            </>
          )}
          {r.status === 'Pending' && (
            <Popconfirm title="Cancel this application?" onConfirm={() => handleCancel(r)}>
              <Button size="small" type="text" icon={<StopOutlined />} danger />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      {/* Leave Quota Balance Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }} styles={{ body: { padding: '14px 18px' } }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Earned / Paid Leave (PL)</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#7C3AED', marginTop: 4 }}>14 / 18 <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Days</span></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }} styles={{ body: { padding: '14px 18px' } }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Casual Leave (CL)</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}>6.5 / 10 <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Days</span></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }} styles={{ body: { padding: '14px 18px' } }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Sick Leave (SL)</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#EF4444', marginTop: 4 }}>6.0 / 8 <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Days</span></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }} styles={{ body: { padding: '14px 18px' } }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Compensatory Off (CO)</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#10B981', marginTop: 4 }}>2.0 <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Days</span></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={4.8}>
          <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }} styles={{ body: { padding: '14px 18px' } }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Pending Approvals</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#3B82F6', marginTop: 4 }}>{applications.filter(a => a.status === 'Pending').length} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Requests</span></div>
          </Card>
        </Col>
      </Row>

      {/* Filter Chips & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space wrap>
          {[
            { key: 'all', label: 'All Requests' },
            { key: 'pending', label: 'Pending Approval' },
            { key: 'level1approved', label: 'L1 Approved (HOD Pending)' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' }
          ].map(item => (
            <Button
              key={item.key}
              size="small"
              type={activeTabKey === item.key ? 'primary' : 'default'}
              onClick={() => setActiveTabKey(item.key)}
              style={{ borderRadius: 16, fontSize: 12, fontWeight: activeTabKey === item.key ? 700 : 500 }}
            >
              {item.label}
            </Button>
          ))}
        </Space>

        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsApplyModalOpen(true)} style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8, fontWeight: 700 }}>
          New Leave Request
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Table columns={columns} dataSource={filteredData} loading={loading} pagination={{ pageSize: 8 }} rowKey="leaveAppId" />
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        title="Apply for Leave (Workflow Validated)"
        open={isApplyModalOpen}
        onCancel={() => setIsApplyModalOpen(false)}
        onOk={() => form.submit()}
        width={650}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleApplyLeave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="leaveType" label="Leave Type" rules={[{ required: true, message: 'Required' }]}>
                <Select placeholder="Select leave code">
                  <Select.Option value="PL">Earned / Paid Leave (PL)</Select.Option>
                  <Select.Option value="CL">Casual Leave (CL)</Select.Option>
                  <Select.Option value="SL">Sick Leave (SL)</Select.Option>
                  <Select.Option value="ML">Maternity Leave (ML)</Select.Option>
                  <Select.Option value="PTL">Paternity Leave (PTL)</Select.Option>
                  <Select.Option value="CO">Compensatory Off (Comp-Off)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dateRange" label="Date Range (Enforces LWD Boundaries)" rules={[{ required: true, message: 'Required' }]}>
                <DatePicker.RangePicker
                  style={{ width: '100%' }}
                  onChange={handleDateChange}
                  disabledDate={(current) => {
                    // Check if employee has an active LWD set
                    const exitLwd = localStorage.getItem('user_confirmed_lwd')
                    if (exitLwd && current && current.isAfter(dayjs(exitLwd), 'day')) {
                      return true
                    }
                    return false
                  }}
                />
              </Form.Item>

            </Col>
          </Row>

          {calculatedDays > 0 && (
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <Tag color="purple" style={{ padding: '6px 12px', fontSize: 13, fontWeight: 700, borderRadius: 8 }}>
                  <CalendarOutlined style={{ marginRight: 6 }} /> Duration: {calculatedDays} Day(s)
                </Tag>
              </Col>
              <Col span={12}>
                {overlapPct >= 30 ? (
                  <Tag color="warning" style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8 }}>
                    <WarningOutlined style={{ marginRight: 6 }} /> Team Overlap: {overlapPct}% (Alert Logged)
                  </Tag>
                ) : (
                  <Tag color="success" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8 }}>
                    Team Overlap: Low ({overlapPct}%)
                  </Tag>
                )}
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isHalfDay" label="Half Day Request?" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="halfDayType" label="Half Day Session">
                <Select placeholder="Select session if half-day">
                  <Select.Option value="FirstHalf">First Half (Morning Session)</Select.Option>
                  <Select.Option value="SecondHalf">Second Half (Afternoon Session)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="reason" label="Reason for Leave" rules={[{ required: true, message: 'Please describe leave reason' }]}>
            <Input.TextArea rows={3} placeholder="Provide details for manager review..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="backupEmployee" label="Handover / Backup Employee">
                <Input placeholder="e.g. Ankit Patel" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPhone" label="Emergency Phone">
                <Input placeholder="+91 98765 43210" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={`Reject Leave Request — ${selectedApp?.employeeName}`}
        open={isRejectModalOpen}
        onCancel={() => setIsRejectModalOpen(false)}
        onOk={() => rejectForm.submit()}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleRejectSubmit}>
          <Form.Item name="remarks" label="Rejection Reason / Remarks" rules={[{ required: true, message: 'Rejection reason is required' }]}>
            <Input.TextArea rows={4} placeholder="State reason for rejecting application..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
