import { useState, useEffect, useCallback } from 'react'
import {
  Card, Button, Table, Tag, Modal, Form, Input, Select, InputNumber, Space,
  message, Popconfirm, Badge, Row, Col, Statistic, Progress, Divider
} from 'antd'
import {
  PlusOutlined, BankOutlined, DollarOutlined, CheckCircleOutlined,
  CloseCircleOutlined, AuditOutlined, FieldNumberOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import api from '../../lib/axios'

const { Option } = Select

const loanApi = {
  getMyLoans: () => api.get('/payroll/loans/me').then(r => r.data),
  getAllLoans: (status) => api.get('/payroll/loans', { params: { status } }).then(r => r.data),
  createLoan: (data) => api.post('/payroll/loans', data).then(r => r.data),
  deductEmi: (id, customAmount) => api.put(`/payroll/loans/${id}/deduct-emi`, null, { params: { customAmount } }).then(r => r.data),
  closeLoan: (id, reason) => api.put(`/payroll/loans/${id}/close`, { reason }).then(r => r.data),
}

export default function EmployeeLoansPage() {
  const [loans, setLoans] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [form] = Form.useForm()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await loanApi.getAllLoans()
      setLoans(res.data || [])
    } catch {
      setLoans([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    // Fetch employees for dropdown selection
    api.get('/employees?pageSize=50').then(r => setEmployees(r.data?.data?.items || r.data?.data || [])).catch(() => {})
  }, [loadData])

  const handleCreateLoan = async () => {
    try {
      const values = await form.validateFields()
      await loanApi.createLoan(values)
      message.success('Loan issued and EMI recovery schedule created.')
      setCreateModalOpen(false)
      form.resetFields()
      await loadData()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.errors?.[0] || 'Failed to create loan.')
    }
  }

  const handleDeductEmi = async (loanId) => {
    try {
      const res = await loanApi.deductEmi(loanId)
      message.success(res.message || 'EMI recovery processed.')
      await loadData()
    } catch (err) {
      message.error(err?.response?.data?.errors?.[0] || 'EMI deduction failed.')
    }
  }

  const totalOutstanding = loans.filter(l => l.status === 'Active').reduce((acc, l) => acc + (l.outstandingBalance || 0), 0)
  const activeCount = loans.filter(l => l.status === 'Active').length
  const closedCount = loans.filter(l => l.status.startsWith('Closed')).length

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
      title: 'Type',
      dataIndex: 'loanType',
      key: 'loanType',
      render: v => <Tag color={v === 'Salary Advance' ? 'gold' : 'blue'}>{v}</Tag>
    },
    {
      title: 'Principal',
      dataIndex: 'principalAmount',
      key: 'principal',
      render: v => `₹${(v || 0).toLocaleString('en-IN')}`
    },
    {
      title: 'Tenure & Rate',
      key: 'tenure',
      render: (_, r) => `${r.tenureMonths} mos @ ${r.interestRate}%`
    },
    {
      title: 'Monthly EMI',
      dataIndex: 'monthlyEMI',
      key: 'emi',
      render: v => <strong style={{ color: '#FAA71A' }}>₹{(v || 0).toLocaleString('en-IN')}</strong>
    },
    {
      title: 'Outstanding Balance',
      dataIndex: 'outstandingBalance',
      key: 'balance',
      render: (v, r) => (
        <div>
          <span style={{ fontWeight: 600 }}>₹{(v || 0).toLocaleString('en-IN')}</span>
          <Progress
            percent={Math.min(100, Math.round(((r.principalAmount - v) / (r.principalAmount || 1)) * 100))}
            size="small"
            status={r.status === 'Closed' ? 'success' : 'active'}
          />
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => <Badge status={v === 'Active' ? 'processing' : 'success'} text={v} />
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space wrap>
          {r.status === 'Active' && (
            <Popconfirm
              title="Deduct Monthly EMI?"
              description={`Recover ₹${r.monthlyEMI?.toLocaleString('en-IN')} from payroll/salary.`}
              onConfirm={() => handleDeductEmi(r.loanId)}
              okText="Recover EMI"
            >
              <Button size="small" type="primary" style={{ borderRadius: 6 }}>
                Recover EMI
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Employee Loans & Salary Advances"
        subtitle="Issue loans, configure monthly EMI recovery schedules, and track outstanding balances through payroll deductions."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Payroll', path: '/payroll' }, { label: 'Loans' }]}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)} style={{ borderRadius: 8 }}>
            Issue New Loan
          </Button>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic title="Total Active Outstanding" value={totalOutstanding} prefix="₹" precision={2} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic title="Active Loans" value={activeCount} prefix={<BankOutlined style={{ color: '#FAA71A' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic title="Closed Loans" value={closedCount} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={loans}
          rowKey="loanId"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* Create Loan Modal */}
      <Modal
        title="Issue Employee Loan / Salary Advance"
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields() }}
        onOk={handleCreateLoan}
        okText="Issue Loan"
        width={500}
      >
        <Form form={form} layout="vertical" initialValues={{ loanType: 'Salary Advance', interestRate: 0, tenureMonths: 6 }}>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true, message: 'Select employee' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Select Employee">
              {employees.map(e => (
                <Option key={e.employeeId} value={e.employeeId} label={`${e.firstName} ${e.lastName}`}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="loanType" label="Loan Type" rules={[{ required: true }]}>
                <Select>
                  <Option value="Salary Advance">Salary Advance (0% Int)</Option>
                  <Option value="Personal Loan">Personal Loan</Option>
                  <Option value="Emergency Advance">Emergency Advance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="principalAmount" label="Principal Amount (₹)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1000} step={1000} prefix="₹" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tenureMonths" label="Tenure (Months)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1} max={60} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="interestRate" label="Interest Rate (% p.a.)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={24} precision={1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </motion.div>
  )
}
