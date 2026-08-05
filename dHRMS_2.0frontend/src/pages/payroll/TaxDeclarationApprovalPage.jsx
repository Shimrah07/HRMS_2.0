import { useState, useEffect, useCallback } from 'react'
import {
  Card, Button, Table, Tag, Modal, Form, Input, Select, Space, message,
  Popconfirm, Badge, Tooltip, Row, Col, Statistic, Alert, Divider
} from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  FileTextOutlined, SafetyCertificateOutlined, EyeOutlined, AuditOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import api from '../../lib/axios'

const { Option } = Select

const taxDeclApi = {
  getPending: (fy) => api.get('/payroll/tax-declarations/pending', { params: { financialYear: fy } }).then(r => r.data),
  approve: (id) => api.put(`/payroll/tax-declarations/${id}/approve`).then(r => r.data),
  reject: (id, remarks) => api.put(`/payroll/tax-declarations/${id}/reject`, { remarks }).then(r => r.data),
}

export default function TaxDeclarationApprovalPage() {
  const [declarations, setDeclarations] = useState([])
  const [loading, setLoading] = useState(false)
  const [fy, setFy] = useState('2025-26')
  const [selectedDecl, setSelectedDecl] = useState(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectId, setRejectId] = useState(null)
  const [rejectForm] = Form.useForm()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await taxDeclApi.getPending(fy)
      setDeclarations(res.data || [])
    } catch {
      setDeclarations([])
    } finally {
      setLoading(false)
    }
  }, [fy])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleApprove = async (id) => {
    try {
      await taxDeclApi.approve(id)
      message.success('Tax declaration approved and verified.')
      await loadData()
    } catch (err) {
      message.error(err?.response?.data?.errors?.[0] || 'Approval failed.')
    }
  }

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields()
      await taxDeclApi.reject(rejectId, values.remarks)
      message.info('Tax declaration rejected.')
      setRejectModalOpen(false)
      rejectForm.resetFields()
      await loadData()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.errors?.[0] || 'Rejection failed.')
    }
  }

  const pendingCount = declarations.filter(d => d.status === 'Pending').length
  const approvedCount = declarations.filter(d => d.status === 'Approved').length
  const rejectedCount = declarations.filter(d => d.status === 'Rejected').length

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, r) => (
        <div>
          <strong>{r.employeeName}</strong>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.employeeCode} • {r.departmentName}</div>
        </div>
      )
    },
    {
      title: 'Regime',
      dataIndex: 'taxRegime',
      key: 'taxRegime',
      render: v => <Tag color={v === 'New' ? 'blue' : 'purple'}>{v} Tax Regime</Tag>
    },
    {
      title: 'Section 80C',
      dataIndex: 'section80C',
      key: '80C',
      render: v => `₹${(v || 0).toLocaleString('en-IN')}`
    },
    {
      title: 'Section 80D',
      dataIndex: 'section80D',
      key: '80D',
      render: v => `₹${(v || 0).toLocaleString('en-IN')}`
    },
    {
      title: 'HRA Claimed',
      dataIndex: 'hraClaimed',
      key: 'HRA',
      render: v => `₹${(v || 0).toLocaleString('en-IN')}`
    },
    {
      title: 'Home Loan Int. (24b)',
      dataIndex: 'houseLoanInterest',
      key: '24b',
      render: v => `₹${(v || 0).toLocaleString('en-IN')}`
    },
    {
      title: 'Total Exemptions',
      dataIndex: 'totalExemptions',
      key: 'total',
      render: v => <strong>₹{(v || 0).toLocaleString('en-IN')}</strong>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        if (v === 'Approved') return <Badge status="success" text="Approved" />
        if (v === 'Rejected') return <Badge status="error" text="Rejected" />
        return <Badge status="processing" text="Pending Proof Verification" />
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedDecl(r)}
          >
            Details
          </Button>
          {r.status === 'Pending' && (
            <>
              <Popconfirm
                title="Approve & Verify Tax Declaration?"
                description="This will allow these investment figures to reduce employee monthly TDS liability."
                onConfirm={() => handleApprove(r.declarationId)}
                okText="Approve"
                cancelText="Cancel"
              >
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} style={{ background: '#52c41a' }}>
                  Approve
                </Button>
              </Popconfirm>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => { setRejectId(r.declarationId); setRejectModalOpen(true) }}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Tax Declaration Verification & Approval"
        subtitle="Verify employee IT investment declarations (Section 80C, 80D, HRA, 24b) and approve them for monthly TDS computations."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Payroll', path: '/payroll' }, { label: 'Tax Declaration Queue' }]}
        extra={
          <Select value={fy} onChange={setFy} style={{ width: 140 }}>
            <Option value="2025-26">FY 2025-26</Option>
            <Option value="2024-25">FY 2024-25</Option>
          </Select>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic title="Pending Verification" value={pendingCount} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic title="Approved Declarations" value={approvedCount} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic title="Rejected Declarations" value={rejectedCount} prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />} />
          </Card>
        </Col>
      </Row>

      <Alert
        message="Tax Verification Policy"
        description="Only approved tax declarations will be considered for final TDS tax liability deductions. Declarations marked as 'Pending' fall back to basic regime calculations until proof verification is completed by HR/Admin."
        type="info"
        showIcon
        style={{ marginBottom: 16, borderRadius: 8 }}
      />

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={declarations}
          rowKey="declarationId"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title={`Tax Declaration Details — ${selectedDecl?.employeeName}`}
        open={!!selectedDecl}
        onCancel={() => setSelectedDecl(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedDecl(null)}>Close</Button>,
          selectedDecl?.status === 'Pending' && (
            <Button
              key="approve"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => { handleApprove(selectedDecl.declarationId); setSelectedDecl(null); }}
              style={{ background: '#52c41a' }}
            >
              Approve & Verify
            </Button>
          )
        ]}
      >
        {selectedDecl && (
          <div>
            <p><strong>Employee:</strong> {selectedDecl.employeeName} ({selectedDecl.employeeCode})</p>
            <p><strong>Selected Tax Regime:</strong> <Tag color="blue">{selectedDecl.taxRegime}</Tag></p>
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={16}>
              <Col span={12}><p><strong>Section 80C (PPF/ELSS/EPF):</strong></p></Col>
              <Col span={12}><p>₹{(selectedDecl.section80C || 0).toLocaleString('en-IN')}</p></Col>
              <Col span={12}><p><strong>Section 80D (Health Insurance):</strong></p></Col>
              <Col span={12}><p>₹{(selectedDecl.section80D || 0).toLocaleString('en-IN')}</p></Col>
              <Col span={12}><p><strong>HRA Rent Exemption:</strong></p></Col>
              <Col span={12}><p>₹{(selectedDecl.hraClaimed || 0).toLocaleString('en-IN')}</p></Col>
              <Col span={12}><p><strong>Section 24b (Housing Loan Interest):</strong></p></Col>
              <Col span={12}><p>₹{(selectedDecl.houseLoanInterest || 0).toLocaleString('en-IN')}</p></Col>
              <Col span={12}><p><strong>Other Deductions:</strong></p></Col>
              <Col span={12}><p>₹{(selectedDecl.otherDeductions || 0).toLocaleString('en-IN')}</p></Col>
            </Row>
            <Divider style={{ margin: '12px 0' }} />
            <p><strong>Submitted At:</strong> {new Date(selectedDecl.submittedAt).toLocaleString()}</p>
            <p><strong>Current Status:</strong> <Tag color={selectedDecl.status === 'Approved' ? 'green' : (selectedDecl.status === 'Rejected' ? 'red' : 'orange')}>{selectedDecl.status}</Tag></p>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Tax Declaration"
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); rejectForm.resetFields() }}
        onOk={handleRejectSubmit}
        okText="Submit Rejection"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="remarks"
            label="Rejection Reason / Verification Remarks"
            rules={[{ required: true, message: 'Please provide reason for rejection.' }]}
          >
            <Input.TextArea rows={3} placeholder="e.g. Invalid Form 16 or missing HRA rent receipts." />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
