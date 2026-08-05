import { useState, useEffect, useCallback } from 'react'
import {
  Card, Button, Table, Tag, Modal, Form, Input, Select, InputNumber, Switch, Space,
  message, Popconfirm, Badge, Tabs, Row, Col, Statistic, Alert
} from 'antd'
import {
  PlusOutlined, FileDoneOutlined, DollarOutlined, CheckCircleOutlined,
  CloseCircleOutlined, PaperClipOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import api from '../../lib/axios'

const { Option } = Select

const reimbursementApi = {
  getMyClaims: () => api.get('/payroll/reimbursements/me').then(r => r.data),
  getPendingClaims: () => api.get('/payroll/reimbursements/pending').then(r => r.data),
  submitClaim: (data) => api.post('/payroll/reimbursements', data).then(r => r.data),
  approveClaim: (id) => api.put(`/payroll/reimbursements/${id}/approve`).then(r => r.data),
  rejectClaim: (id, remarks) => api.put(`/payroll/reimbursements/${id}/reject`, { remarks }).then(r => r.data),
}

export default function ReimbursementsPage() {
  const [myClaims, setMyClaims] = useState([])
  const [allClaims, setAllClaims] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectId, setRejectId] = useState(null)
  const [form] = Form.useForm()
  const [rejectForm] = Form.useForm()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [myRes, allRes] = await Promise.all([
        reimbursementApi.getMyClaims().catch(() => ({ data: [] })),
        reimbursementApi.getPendingClaims().catch(() => ({ data: [] }))
      ])
      setMyClaims(myRes.data || [])
      setAllClaims(allRes.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSubmitClaim = async () => {
    try {
      const values = await form.validateFields()
      await reimbursementApi.submitClaim(values)
      message.success('Reimbursement claim submitted.')
      setSubmitModalOpen(false)
      form.resetFields()
      await loadData()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.errors?.[0] || 'Submission failed.')
    }
  }

  const handleApprove = async (id) => {
    try {
      await reimbursementApi.approveClaim(id)
      message.success('Claim approved for next payroll payout.')
      await loadData()
    } catch (err) {
      message.error(err?.response?.data?.errors?.[0] || 'Approval failed.')
    }
  }

  const handleRejectSubmit = async () => {
    try {
      const values = await rejectForm.validateFields()
      await reimbursementApi.rejectClaim(rejectId, values.remarks)
      message.info('Claim rejected.')
      setRejectModalOpen(false)
      rejectForm.resetFields()
      await loadData()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.errors?.[0] || 'Rejection failed.')
    }
  }

  const pendingCount = allClaims.filter(c => c.status === 'Pending').length
  const approvedSum = allClaims.filter(c => c.status === 'Approved').reduce((acc, c) => acc + c.amount, 0)

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, r) => (
        <div>
          <strong>{r.employeeName}</strong>
          <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.employeeCode}</div>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: v => <Tag color="blue">{v}</Tag>
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: v => <strong>₹{(v || 0).toLocaleString('en-IN')}</strong>
    },
    {
      title: 'Tax Treatment',
      dataIndex: 'isTaxFree',
      key: 'taxFree',
      render: v => v ? <Tag color="green">Tax-Exempt Reimbursement</Tag> : <Tag color="orange">Taxable</Tag>
    },
    {
      title: 'Submitted Date',
      dataIndex: 'submittedAt',
      key: 'date',
      render: v => new Date(v).toLocaleDateString()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v, r) => {
        if (v === 'Approved') return <Badge status="success" text={`Approved by ${r.approvedBy || 'HR'}`} />
        if (v === 'Rejected') return <Badge status="error" text={`Rejected: ${r.remarks || ''}`} />
        return <Badge status="processing" text="Pending Approval" />
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space wrap>
          {r.status === 'Pending' && (
            <>
              <Popconfirm title="Approve Reimbursement Claim?" onConfirm={() => handleApprove(r.claimId)}>
                <Button size="small" type="primary" icon={<CheckCircleOutlined />} style={{ background: '#52c41a' }}>
                  Approve
                </Button>
              </Popconfirm>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => { setRejectId(r.claimId); setRejectModalOpen(true) }}>
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  const tabs = [
    {
      key: 'all',
      label: 'Approval Queue',
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Table columns={columns} dataSource={allClaims} rowKey="claimId" loading={loading} pagination={{ pageSize: 10 }} size="small" />
        </Card>
      )
    },
    {
      key: 'mine',
      label: 'My Reimbursements',
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Table columns={columns} dataSource={myClaims} rowKey="claimId" loading={loading} pagination={{ pageSize: 10 }} size="small" />
        </Card>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Reimbursements & Expense Claims"
        subtitle="Submit expense claims (Travel, Medical, LTA) with receipt proof and process tax-exempt payouts through payroll."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Payroll', path: '/payroll' }, { label: 'Reimbursements' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setSubmitModalOpen(true)} style={{ borderRadius: 8 }}>
            Submit Claim
          </Button>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic title="Pending Claims in Queue" value={pendingCount} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic title="Approved Payouts Ready for Payroll" value={approvedSum} prefix="₹" precision={2} />
          </Card>
        </Col>
      </Row>

      <Tabs items={tabs} type="card" />

      {/* Submit Claim Modal */}
      <Modal
        title="Submit Reimbursement Expense Claim"
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); form.resetFields() }}
        onOk={handleSubmitClaim}
        okText="Submit Claim"
        width={500}
      >
        <Form form={form} layout="vertical" initialValues={{ category: 'Travel & Conveyance', isTaxFree: true }}>
          <Form.Item name="category" label="Expense Category" rules={[{ required: true }]}>
            <Select>
              <Option value="Travel & Conveyance">Travel & Conveyance</Option>
              <Option value="Medical Reimbursement">Medical Expense</Option>
              <Option value="Leave Travel Allowance (LTA)">Leave Travel Allowance (LTA)</Option>
              <Option value="Client Entertainment / Food">Client Food / Meeting</Option>
              <Option value="Internet / Telephone Allowance">Phone & Internet</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="amount" label="Claim Amount (₹)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} prefix="₹" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="isTaxFree" label="Tax Exempt?" valuePropName="checked">
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Expense Description & Justification" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Describe expenses incurred and attach supporting receipt details." />
          </Form.Item>

          <Form.Item name="receiptUrl" label="Receipt Attachment / File Name">
            <Input prefix={<PaperClipOutlined />} placeholder="e.g. taxi_bill_jan2026.pdf" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Reimbursement Claim"
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); rejectForm.resetFields() }}
        onOk={handleRejectSubmit}
        okText="Reject Claim"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="remarks" label="Rejection Remarks" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Specify reason for rejection (e.g. Missing valid tax invoice or bill)." />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
