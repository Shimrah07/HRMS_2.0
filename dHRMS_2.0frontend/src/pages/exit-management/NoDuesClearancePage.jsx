import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Row, Col, Statistic, Space, Progress, Drawer, message, Tooltip, Badge } from 'antd'
import { CheckCircleOutlined, SyncOutlined, ClockCircleOutlined, ExclamationCircleOutlined, FilterOutlined, HistoryOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import exitService from '../../services/exitService'

const { Option } = Select

const DEPARTMENTS = [
  { key: 'Manager', label: 'Reporting Manager', desc: 'Knowledge transfer & project sign-off', slaDays: 2 },
  { key: 'HR', label: 'HR Department', desc: 'Personal file, NDAs & policy sign-off', slaDays: 3 },
  { key: 'IT', label: 'IT Department', desc: 'System access, email, VPN & software licenses', slaDays: 2 },
  { key: 'Finance', label: 'Finance Department', desc: 'Advances, loans, travel expenses & corporate card', slaDays: 5 },
  { key: 'Admin', label: 'Admin Department', desc: 'Vehicle, parking pass & library books', slaDays: 2 },
  { key: 'Security', label: 'Facility & Security', desc: 'Building access badge & biometric deactivation', slaDays: 1 },
  { key: 'Asset', label: 'Asset Management', desc: 'Laptop, ID card, mobile & accessories', slaDays: 3 },
]

export default function NoDuesClearancePage() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [clearanceModalOpen, setClearanceModalOpen] = useState(false)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedDept, setSelectedDept] = useState(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await exitService.getExitRecords({ page: 1, pageSize: 50, status: statusFilter || undefined })
      setRecords(res.items || [])
    } catch (err) {
      console.error(err)
      message.error('Failed to load clearance status matrix')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleApproveClearance = async (values) => {
    if (!selectedRecord || !selectedDept) return
    try {
      await exitService.approveClearance(selectedRecord.exitId, selectedDept, {
        status: values.status,
        duesAmount: parseFloat(values.duesAmount || 0),
        duesDetails: values.duesDetails,
        remarks: values.remarks
      })
      message.success(`${selectedDept} clearance updated successfully`)
      setClearanceModalOpen(false)
      form.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to update clearance')
    }
  }

  const getDeptStatusTag = (clearances, deptKey) => {
    const item = clearances?.find(c => c.department === deptKey)
    if (!item) return <Tag color="warning">Pending</Tag>
    switch (item.status) {
      case 'Cleared':
        return <Tag color="success">Cleared</Tag>
      case 'DuesPending':
        return <Tag color="error">Dues ₹{item.duesAmount || 0}</Tag>
      case 'NA':
        return <Tag color="default">N/A</Tag>
      default:
        return <Tag color="warning">Pending</Tag>
    }
  }

  const calculateClearancePercent = (clearances) => {
    if (!clearances || clearances.length === 0) return 0
    const clearedCount = DEPARTMENTS.filter(d => {
      const c = clearances.find(x => x.department === d.key)
      return c && (c.status === 'Cleared' || c.status === 'NA')
    }).length
    return Math.round((clearedCount / DEPARTMENTS.length) * 100)
  }

  const columns = [
    {
      title: 'Employee Details',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 200,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.employeeCode} · {record.departmentName}</div>
        </div>
      )
    },
    ...DEPARTMENTS.map(d => ({
      title: (
        <div>
          <div>{d.label}</div>
          <div style={{ fontSize: 10, fontWeight: 'normal', color: '#8c8c8c' }}>SLA: {d.slaDays}d</div>
        </div>
      ),
      key: d.key,
      width: 140,
      render: (_, record) => (
        <Tooltip title={`${d.label}: ${d.desc}`}>
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedRecord(record)
              setSelectedDept(d.key)
              const existing = record.clearances?.find(c => c.department === d.key)
              form.setFieldsValue({
                status: existing?.status || 'Cleared',
                duesAmount: existing?.duesAmount || 0,
                duesDetails: existing?.duesDetails || '',
                remarks: existing?.remarks || ''
              })
              setClearanceModalOpen(true)
            }}
          >
            {getDeptStatusTag(record.clearances, d.key)}
          </div>
        </Tooltip>
      )
    })),
    {
      title: 'Clearance Progress',
      key: 'progress',
      width: 180,
      render: (_, record) => {
        const pct = calculateClearancePercent(record.clearances)
        return (
          <div style={{ width: 140 }}>
            <Progress percent={pct} size="small" status={pct === 100 ? 'success' : 'active'} />
            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
              {pct === 100 ? 'All 7 Depts Cleared' : `${pct}% Completed`}
            </div>
          </div>
        )
      }
    },
    {
      title: 'Actions',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => {
            setSelectedRecord(record)
            setHistoryDrawerOpen(true)
          }}
        >
          Details
        </Button>
      )
    }
  ]

  const clearedRecordsCount = records.filter(r => {
    if (!r.clearances || r.clearances.length === 0) return false
    return DEPARTMENTS.every(d => {
      const c = r.clearances.find(x => x.department === d.key)
      return c && (c.status === 'Cleared' || c.status === 'NA')
    })
  }).length

  const duesPendingCount = records.filter(r => r.clearances?.some(c => c.status === 'DuesPending')).length

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Multi-Department No-Dues Clearance Engine"
        subtitle="Operational clearance tracking across Reporting Manager, HR, IT, Finance, Admin, Security, and Asset Management"
        breadcrumbs={[
          { title: 'Home', href: '/dashboard' },
          { title: 'Exit Management' },
          { title: 'No Dues Clearance' }
        ]}
      />

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Total Exit Applications" value={records.length} prefix={<SyncOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Fully Cleared (100%)" value={clearedRecordsCount} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Outstanding Dues Flagged" value={duesPendingCount} prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Dept SLA Target" value={2.0} suffix="Days" prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />} />
          </Card>
        </Col>
      </Row>

      {/* Main Clearance Matrix */}
      <Card
        title="Multi-Department Clearance Sign-Off Matrix"
        extra={
          <Space>
            <FilterOutlined style={{ color: '#8c8c8c' }} />
            <Select
              placeholder="Filter by Exit Status"
              allowClear
              style={{ width: 220 }}
              value={statusFilter || undefined}
              onChange={(val) => setStatusFilter(val || '')}
            >
              <Option value="Submitted">Submitted</Option>
              <Option value="NoticePeriod">Notice Period</Option>
              <Option value="ClearanceInProgress">Clearance In Progress</Option>
              <Option value="FFSProcessing">FFS Processing</Option>
            </Select>
          </Space>
        }
      >
        <Table columns={columns} dataSource={records} rowKey="exitId" loading={loading} scroll={{ x: 1500 }} />
      </Card>

      {/* Update Clearance Modal */}
      <Modal
        title={`Update ${selectedDept} Clearance — ${selectedRecord?.employeeName || ''}`}
        open={clearanceModalOpen}
        onCancel={() => setClearanceModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleApproveClearance}>
          <Form.Item name="status" label="Clearance Sign-off Status" rules={[{ required: true, message: 'Please select clearance status' }]}>
            <Select placeholder="Select Status">
              <Option value="Cleared">Cleared (No Dues)</Option>
              <Option value="DuesPending">Dues Pending / Financial Recovery Flagged</Option>
              <Option value="NA">Not Applicable (N/A)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="duesAmount" label="Outstanding Dues Amount (₹)">
            <Input type="number" placeholder="Enter recovery amount (e.g. 5000)" />
          </Form.Item>
          <Form.Item name="duesDetails" label="Dues / Asset Item Description">
            <Input placeholder="e.g. Unreturned MacBook charger / Travel advance pending" />
          </Form.Item>
          <Form.Item name="remarks" label="Department Sign-off Remarks">
            <Input.TextArea rows={3} placeholder="Provide verification notes and handover remarks..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detailed Clearance History Drawer */}
      <Drawer
        title={`Clearance Audit History — ${selectedRecord?.employeeName || ''}`}
        width={520}
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4>{selectedRecord.employeeName} ({selectedRecord.employeeCode})</h4>
              <p style={{ color: '#8c8c8c' }}>{selectedRecord.departmentName} · Proposed LWD: {selectedRecord.proposedLwd}</p>
            </div>
            <Card title="Department Sign-Off Checklist" size="small">
              {DEPARTMENTS.map(d => {
                const c = selectedRecord.clearances?.find(x => x.department === d.key)
                return (
                  <div key={d.key} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600 }}>{d.label}</div>
                      <div>{getDeptStatusTag(selectedRecord.clearances, d.key)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>{d.desc}</div>
                    {c && (
                      <div style={{ marginTop: 6, fontSize: 12, background: '#fafafa', padding: 8, borderRadius: 4 }}>
                        {c.duesAmount > 0 && <div style={{ color: '#ff4d4f', fontWeight: 600 }}>Dues Amount: ₹{c.duesAmount} ({c.duesDetails || 'No details'})</div>}
                        {c.remarks && <div>Remarks: {c.remarks}</div>}
                        {c.clearedAt && <div style={{ color: '#8c8c8c', fontSize: 11 }}>Updated: {new Date(c.clearedAt).toLocaleString()}</div>}
                      </div>
                    )}
                  </div>
                )
              })}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  )
}
