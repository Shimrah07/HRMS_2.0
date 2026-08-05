import { useState, useEffect, useCallback } from "react"
import { Row, Col, Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Steps, Statistic, Alert, Divider, Typography, Drawer, Tooltip, message, Popconfirm } from "antd"
import {
  PlayCircleOutlined, LockOutlined, CalculatorOutlined, AuditOutlined, CheckCircleOutlined,
  BankOutlined, RocketOutlined, EyeOutlined, DownloadOutlined, WarningOutlined, PlusOutlined, HistoryOutlined
} from "@ant-design/icons"
import { motion } from "framer-motion"
import PageHeader from "../../components/common/PageHeader"
import PayrollSubNav from "../../components/payroll/PayrollSubNav"
import { payrollService } from "../../services/payrollService"

const { Title, Text, Paragraph } = Typography

const STEPS = [
  { key: "Draft", title: "1. Draft", desc: "Run created" },
  { key: "InputsLocked", title: "2. Inputs Locked", desc: "Attendance & variable pay frozen" },
  { key: "Calculated", title: "3. Calculated", desc: "Gross, deductions & net calculated" },
  { key: "UnderReview", title: "4. Under Review", desc: "Variance checked by Finance" },
  { key: "Approved", title: "5. Approved", desc: "Approved by Finance Head" },
  { key: "Locked", title: "6. Locked", desc: "Ready for bank file" },
  { key: "Disbursed", title: "7. Disbursed", desc: "Bank payout completed" },
  { key: "Closed", title: "8. Closed", desc: "Archived" },
]

export default function PayrollRunPage() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRun, setSelectedRun] = useState(null)
  const [details, setDetails] = useState([])
  const [variance, setVariance] = useState(null)
  const [audit, setAudit] = useState([])
  const [initModal, setInitModal] = useState(false)
  const [varModal, setVarModal] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [form] = Form.useForm()
  const [varForm] = Form.useForm()

  const loadRuns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await payrollService.getRuns()
      setRuns(res?.data || [])
    } catch {
      message.error("Failed to load payroll runs.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRuns() }, [loadRuns])

  const openRunDetail = async (run) => {
    setSelectedRun(run)
    setDrawerOpen(true)
    try {
      const [dRes, vRes, aRes] = await Promise.allSettled([
        payrollService.getRunDetails(run.runId),
        payrollService.getVarianceReport(run.runId),
        payrollService.getAuditTrail(run.runId)
      ])
      if (dRes.status === "fulfilled") setDetails(dRes.value?.data || [])
      if (vRes.status === "fulfilled") setVariance(vRes.value?.data || null)
      if (aRes.status === "fulfilled") setAudit(aRes.value?.data || [])
    } catch {
      /* handled */
    }
  }

  const handleStepAction = async (actionFn, msg) => {
    if (!selectedRun) return
    setActionLoading(true)
    try {
      await actionFn(selectedRun.runId)
      message.success(msg)
      await loadRuns()
      setDrawerOpen(false)
    } catch (err) {
      message.error(err?.response?.data?.message || "Action failed.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleInitiate = async (values) => {
    setActionLoading(true)
    try {
      await payrollService.initiateRun(values)
      message.success("Payroll run initiated!")
      setInitModal(false)
      form.resetFields()
      loadRuns()
    } catch (err) {
      message.error(err?.response?.data?.message || "Initiation failed.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddVariableInput = async (values) => {
    if (!selectedRun) return
    setActionLoading(true)
    try {
      await payrollService.submitVariableInput({ ...values, runId: selectedRun.runId })
      message.success("Variable pay input added!")
      setVarModal(false)
      varForm.resetFields()
      openRunDetail(selectedRun)
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to add variable pay.")
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    { title: "Period", key: "period", render: r => <Text strong>{r.month}/{r.year}</Text> },
    { title: "Type", dataIndex: "runType", key: "type", render: v => <Tag color="purple">{v}</Tag> },
    { title: "Status", dataIndex: "status", key: "status", render: s => {
      const colors = { Draft: "default", InputsLocked: "orange", Calculated: "processing", UnderReview: "warning", Approved: "success", Locked: "magenta", Disbursed: "green", Closed: "default" }
      return <Tag color={colors[s] || "default"}>{s}</Tag>
    }},
    { title: "Employees", dataIndex: "totalEmployees", key: "emp" },
    { title: "Total Gross", dataIndex: "totalGross", key: "gross", render: v => `₹${(v||0).toLocaleString("en-IN")}` },
    { title: "Total Net Pay", dataIndex: "totalNetPay", key: "net", render: v => <Text type="success" strong>₹{(v||0).toLocaleString("en-IN")}</Text> },
    { title: "Attendance", dataIndex: "attendanceFrozen", key: "att", render: v => <Tag color={v ? "green" : "volcano"}>{v ? "Frozen" : "Open"}</Tag> },
    { title: "Actions", key: "act", render: r => (
      <Space>
        <Button size="small" type="primary" ghost icon={<EyeOutlined />} onClick={() => openRunDetail(r)}>Manage Step →</Button>
      </Space>
    )}
  ]

  const detailColumns = [
    { title: "Emp Code", dataIndex: "employeeCode", key: "code" },
    { title: "Employee Name", dataIndex: "name", key: "name", render: v => <Text strong>{v}</Text> },
    { title: "Paid / LWP", key: "days", render: d => `${d.paidDays} / ${d.lwpDays}d` },
    { title: "Gross", dataIndex: "grossEarnings", key: "gross", render: v => `₹${(v||0).toLocaleString("en-IN")}` },
    { title: "PF (Emp)", dataIndex: "pfEmployee", key: "pf", render: v => `₹${v||0}` },
    { title: "ESI (Emp)", dataIndex: "esiEmployee", key: "esi", render: v => `₹${v||0}` },
    { title: "PT", dataIndex: "professionalTax", key: "pt", render: v => `₹${v||0}` },
    { title: "Total Ded.", dataIndex: "totalDeductions", key: "ded", render: v => `₹${(v||0).toLocaleString("en-IN")}` },
    { title: "Net Pay", dataIndex: "netPay", key: "net", render: v => <Text type="success" strong>₹{(v||0).toLocaleString("en-IN")}</Text> },
  ]

  const getNextActionButton = () => {
    if (!selectedRun) return null
    const s = selectedRun.status
    if (s === "Draft") {
      return (
        <Popconfirm title="Lock attendance & variable inputs?" onConfirm={() => handleStepAction(payrollService.lockInputs, "Inputs locked!")}>
          <Button type="primary" icon={<LockOutlined />} loading={actionLoading}>Lock Inputs</Button>
        </Popconfirm>
      )
    }
    if (s === "InputsLocked") {
      return (
        <Button type="primary" style={{ background: "#10b981", borderColor: "#10b981" }} icon={<CalculatorOutlined />} loading={actionLoading} onClick={() => handleStepAction(payrollService.calculate, "Payroll calculated!")}>
          Calculate Payroll Engine
        </Button>
      )
    }
    if (s === "Calculated") {
      return (
        <Button type="primary" icon={<AuditOutlined />} loading={actionLoading} onClick={() => handleStepAction(payrollService.submitForReview, "Submitted for Finance Review!")}>
          Submit for Finance Review
        </Button>
      )
    }
    if (s === "UnderReview") {
      return (
        <Popconfirm title="Approve this payroll run?" onConfirm={() => handleStepAction(payrollService.approve, "Payroll approved by Finance!")}>
          <Button type="primary" style={{ background: "#059669", borderColor: "#059669" }} icon={<CheckCircleOutlined />} loading={actionLoading}>
            Approve Payroll (Finance Head)
          </Button>
        </Popconfirm>
      )
    }
    if (s === "Approved") {
      return (
        <Popconfirm title="Lock payroll to enable bank file generation?" onConfirm={() => handleStepAction(payrollService.lock, "Payroll locked for bank file!")}>
          <Button type="primary" danger icon={<LockOutlined />} loading={actionLoading}>Lock Payroll Cycle</Button>
        </Popconfirm>
      )
    }
    if (s === "Disbursed") {
      return (
        <Popconfirm title="Close & archive this payroll cycle?" onConfirm={() => handleStepAction(payrollService.close, "Payroll cycle closed!")}>
          <Button type="default" icon={<CheckCircleOutlined />} loading={actionLoading}>Close Cycle</Button>
        </Popconfirm>
      )
    }
    return <Tag color="green">Cycle Complete</Tag>
  }

  const currentStepIdx = STEPS.findIndex(st => st.key === selectedRun?.status) ?? 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Payroll Processing Engine"
        subtitle="20-step state machine with automated statutory calculations, LOP deduction, and variance checks."
        breadcrumbs={[{ label: "Home", path: "/dashboard" }, { label: "Payroll", path: "/payroll" }, { label: "Runs Engine" }]}
        extra={
          <Space>
            <PayrollSubNav activeKey="runs" />
            <Button type="primary" style={{ background: "#6366f1", borderColor: "#6366f1" }} icon={<PlusOutlined />} onClick={() => setInitModal(true)}>
              Initiate New Payroll Run
            </Button>
          </Space>
        }
      />

      <Card style={{ borderRadius: 16, border: "var(--border-glass)", background: "var(--color-card-bg)" }}>
        <Table dataSource={runs} columns={columns} rowKey="runId" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Drawer: Detailed State Machine Controller */}
      <Drawer title={`Payroll Run: ${selectedRun?.month}/${selectedRun?.year} (${selectedRun?.runType})`} width={920} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {selectedRun && (
          <div>
            {/* Stepper */}
            <Card style={{ borderRadius: 12, marginBottom: 20, background: "#f8fafc" }}>
              <Steps current={currentStepIdx} size="small" items={STEPS.map(s => ({ title: s.title, description: s.desc }))} />
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space>
                  <Tag color="blue">{selectedRun.status}</Tag>
                  <Text type="secondary">Employees: {selectedRun.totalEmployees}</Text>
                </Space>
                <Space>
                  <Button size="small" icon={<PlusOutlined />} onClick={() => setVarModal(true)}>Add Variable Pay</Button>
                  {getNextActionButton()}
                </Space>
              </div>
            </Card>

            {/* Run Totals */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={8}><Card><Statistic title="Total Gross" value={selectedRun.totalGross} prefix="₹" precision={2} /></Card></Col>
              <Col span={8}><Card><Statistic title="Total Deductions" value={selectedRun.totalDeductions} prefix="₹" precision={2} valueStyle={{ color: "#ef4444" }} /></Card></Col>
              <Col span={8}><Card><Statistic title="Total Net Payout" value={selectedRun.totalNetPay} prefix="₹" precision={2} valueStyle={{ color: "#10b981" }} /></Card></Col>
            </Row>

            {/* Variance Alert */}
            {variance?.variance && (
              <Alert
                type={variance.variance.flaggedCount > 0 ? "warning" : "info"}
                showIcon
                message={`Variance vs Previous Month (${variance.variance.previousMonth}): Net Change ₹${variance.variance.variance?.toLocaleString("en-IN")}`}
                description={`${variance.variance.flaggedCount} employees flagged with >20% net pay variation.`}
                style={{ marginBottom: 20, borderRadius: 10 }}
              />
            )}

            {/* Calculated Employee Details Table */}
            <Title level={5}>Employee Payout Breakdown ({details.length})</Title>
            <Table dataSource={details} columns={detailColumns} rowKey="employeeId" pagination={{ pageSize: 8 }} size="small" />

            {/* Audit Trail */}
            <Divider style={{ margin: "24px 0" }} />
            <Title level={5}><HistoryOutlined /> Audit Trail</Title>
            <Table
              dataSource={audit}
              columns={[
                { title: "Timestamp", dataIndex: "performedAt", render: v => new Date(v).toLocaleString("en-IN") },
                { title: "Action", dataIndex: "action", render: v => <Tag color="blue">{v}</Tag> },
                { title: "Details", dataIndex: "details" },
              ]}
              rowKey="performedAt"
              size="small"
              pagination={false}
            />
          </div>
        )}
      </Drawer>

      {/* Modal: Initiate New Run */}
      <Modal title="Initiate New Payroll Run" open={initModal} onCancel={() => setInitModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleInitiate} initialValues={{ month: new Date().getMonth() + 1, year: new Date().getFullYear(), runType: "Regular" }}>
          <Form.Item name="month" label="Pay Month" rules={[{ required: true }]}>
            <Select options={[1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Month ${m}` }))} />
          </Form.Item>
          <Form.Item name="year" label="Pay Year" rules={[{ required: true }]}>
            <Select options={[2025, 2026, 2027].map(y => ({ value: y, label: `${y}` }))} />
          </Form.Item>
          <Form.Item name="runType" label="Run Type" rules={[{ required: true }]}>
            <Select options={["Regular", "Supplementary", "Arrears", "FullAndFinal", "Bonus"].map(t => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes / Justification">
            <Input.TextArea rows={3} placeholder="e.g. Monthly regular run for Mumbai HQ" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={actionLoading}>Start Payroll Run</Button>
        </Form>
      </Modal>

      {/* Modal: Add Variable Pay */}
      <Modal title="Add Variable Pay / Incentive Input" open={varModal} onCancel={() => setVarModal(false)} footer={null}>
        <Form form={varForm} layout="vertical" onFinish={handleAddVariableInput}>
          <Form.Item name="employeeId" label="Employee" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select employee" options={details.map(d => ({ value: d.employeeId, label: `${d.name} (${d.employeeCode})` }))} />
          </Form.Item>
          <Form.Item name="inputType" label="Pay Type" rules={[{ required: true }]}>
            <Select options={["Incentive", "Bonus", "OvertimeArrears", "Reimbursement", "PerformancePay"].map(t => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
            <Input type="number" prefix="₹" />
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input placeholder="e.g. Q3 Sales performance bonus" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={actionLoading}>Add to Current Run</Button>
        </Form>
      </Modal>
    </motion.div>
  )
}
