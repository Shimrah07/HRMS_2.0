import { useState, useEffect, useCallback } from "react"
import { Row, Col, Card, Statistic, Tag, Steps, Table, Progress, Alert, Badge, Spin, Button, Divider, Typography, Space, Tooltip } from "antd"
import {
  DollarOutlined, TeamOutlined, CheckCircleOutlined, ClockCircleOutlined,
  WarningOutlined, FileTextOutlined, BankOutlined, SafetyOutlined,
  ArrowUpOutlined, ArrowDownOutlined, CalendarOutlined, ThunderboltOutlined,
  LockOutlined, SendOutlined, RocketOutlined
} from "@ant-design/icons"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import PageHeader from "../../components/common/PageHeader"
import PayrollSubNav from "../../components/payroll/PayrollSubNav"
import { payrollService } from "../../services/payrollService"

const { Title, Text } = Typography

const STATUS_FLOW = [
  { key: "Draft", label: "Draft", icon: <ClockCircleOutlined /> },
  { key: "InputsLocked", label: "Inputs Locked", icon: <LockOutlined /> },
  { key: "Calculated", label: "Calculated", icon: <DollarOutlined /> },
  { key: "UnderReview", label: "Under Review", icon: <FileTextOutlined /> },
  { key: "Approved", label: "Approved", icon: <CheckCircleOutlined /> },
  { key: "Locked", label: "Locked", icon: <LockOutlined /> },
  { key: "Disbursed", label: "Disbursed", icon: <BankOutlined /> },
  { key: "Closed", label: "Closed", icon: <CheckCircleOutlined /> },
]

const KPICard = ({ title, value, prefix, suffix, color, icon, trend, trendVal }) => (
  <motion.div whileHover={{ translateY: -4 }} transition={{ type: "spring", stiffness: 300 }}>
    <Card style={{ borderRadius: 16, background: "var(--color-card-bg)", border: "var(--border-glass)", height: 140 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Text style={{ fontSize: 12, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 1 }}>{title}</Text>
          <div style={{ fontSize: 26, fontWeight: 700, color, marginTop: 4 }}>
            {prefix}{typeof value === "number" ? value.toLocaleString("en-IN") : value}{suffix}
          </div>
          {trendVal !== undefined && (
            <Tag color={trendVal >= 0 ? "green" : "red"} style={{ marginTop: 4, fontSize: 11 }}>
              {trendVal >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trendVal)}%
            </Tag>
          )}
        </div>
        <div style={{ fontSize: 32, color, opacity: 0.25 }}>{icon}</div>
      </div>
    </Card>
  </motion.div>
)

export default function PayrollDashboardPage() {
  const navigate = useNavigate()
  const [runs, setRuns] = useState([])
  const [calendar, setCalendar] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const now = new Date()
      const [runsRes, calRes] = await Promise.allSettled([
        payrollService.getRuns({ year: now.getFullYear() }),
        payrollService.getComplianceCalendar()
      ])
      if (runsRes.status === "fulfilled") setRuns(runsRes.value?.data || [])
      if (calRes.status === "fulfilled") setCalendar(calRes.value?.data || [])
    } catch {
      /* silently handled */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const latestRun = runs[0]
  const statusIdx = STATUS_FLOW.findIndex(s => s.key === latestRun?.status) ?? 0
  const totalGross = runs.reduce((a, r) => a + (r.totalGross || 0), 0)
  const totalNet = runs.reduce((a, r) => a + (r.totalNetPay || 0), 0)
  const totalEmp = latestRun?.totalEmployees || 0
  const overdueCount = calendar.filter(c => c.alertLevel === "Critical").length

  const calColumns = [
    { title: "Filing", dataIndex: "filing", key: "filing", render: v => <Text strong>{v}</Text> },
    { title: "Due Date", dataIndex: "dueDate", key: "due", render: v => new Date(v).toLocaleDateString("en-IN") },
    { title: "Status", dataIndex: "alertLevel", key: "alert", render: v => (
      <Tag color={v === "Critical" ? "red" : v === "Warning" ? "orange" : "green"}>{v}</Tag>
    )},
    { title: "Days Left", dataIndex: "daysRemaining", key: "days", render: d => (
      <Text style={{ color: d <= 5 ? "#ef4444" : d <= 15 ? "#f59e0b" : "#10b981" }}>{d}d</Text>
    )},
  ]

  const runColumns = [
    { title: "Period", key: "period", render: r => `${r.month}/${r.year}` },
    { title: "Type", dataIndex: "runType", key: "type", render: v => <Tag color="blue">{v}</Tag> },
    { title: "Status", dataIndex: "status", key: "status", render: v => {
      const colors = { Draft: "default", InputsLocked: "orange", Calculated: "processing", UnderReview: "warning", Approved: "success", Locked: "magenta", Disbursed: "green", Closed: "default" }
      return <Tag color={colors[v] || "default"}>{v}</Tag>
    }},
    { title: "Employees", dataIndex: "totalEmployees", key: "emp" },
    { title: "Net Payout", dataIndex: "totalNetPay", key: "net", render: v => `₹${(v||0).toLocaleString("en-IN")}` },
    { title: "Action", key: "action", render: r => (
      <Button size="small" type="link" onClick={() => navigate(`/payroll/runs?runId=${r.runId}`)}>Manage →</Button>
    )},
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Payroll Dashboard"
        subtitle="Real-time payroll cycle status, KPI metrics, and compliance calendar."
        breadcrumbs={[{ label: "Home", path: "/dashboard" }, { label: "Payroll", path: "/payroll" }, { label: "Dashboard" }]}
        extra={<PayrollSubNav activeKey="dashboard" />}
      />

      {loading ? <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div> : (
        <>
          {/* KPI Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}><KPICard title="Employees This Cycle" value={totalEmp} icon={<TeamOutlined />} color="#6366f1" /></Col>
            <Col xs={24} sm={12} lg={6}><KPICard title="Total Gross Payout (YTD)" value={totalGross} prefix="₹" icon={<DollarOutlined />} color="#10b981" /></Col>
            <Col xs={24} sm={12} lg={6}><KPICard title="Total Net Pay (YTD)" value={totalNet} prefix="₹" icon={<BankOutlined />} color="#3b82f6" /></Col>
            <Col xs={24} sm={12} lg={6}><KPICard title="Compliance Alerts" value={overdueCount} suffix=" critical" icon={<SafetyOutlined />} color={overdueCount > 0 ? "#ef4444" : "#10b981"} /></Col>
          </Row>

          {/* Current Cycle Status Stepper */}
          {latestRun && (
            <Card title={<Space><ThunderboltOutlined style={{ color: "#FAA71A" }} /><span>Current Cycle: {latestRun.month}/{latestRun.year}</span></Space>}
              style={{ borderRadius: 16, marginBottom: 24, border: "var(--border-glass)", background: "var(--color-card-bg)" }}>
              <Steps current={statusIdx} size="small" items={STATUS_FLOW.map(s => ({ title: s.label, icon: s.icon }))} />
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag color="blue">Employees: {latestRun.totalEmployees}</Tag>
                <Tag color="green">Gross: ₹{(latestRun.totalGross||0).toLocaleString("en-IN")}</Tag>
                <Tag color="purple">Net Pay: ₹{(latestRun.totalNetPay||0).toLocaleString("en-IN")}</Tag>
                <Tag color={latestRun.attendanceFrozen ? "success" : "warning"}>
                  Attendance: {latestRun.attendanceFrozen ? "Frozen ✓" : "Not Frozen"}
                </Tag>
              </div>
            </Card>
          )}

          <Row gutter={[16, 16]}>
            {/* Runs History */}
            <Col xs={24} lg={14}>
              <Card title={<Space><CalendarOutlined /><span>Payroll Runs (This Year)</span></Space>}
                style={{ borderRadius: 16, border: "var(--border-glass)", background: "var(--color-card-bg)" }}>
                <Table
                  dataSource={runs}
                  columns={runColumns}
                  rowKey="runId"
                  pagination={{ pageSize: 6 }}
                  size="small"
                />
              </Card>
            </Col>

            {/* Compliance Calendar */}
            <Col xs={24} lg={10}>
              <Card title={<Space><SafetyOutlined /><span>Compliance Calendar</span></Space>}
                style={{ borderRadius: 16, border: "var(--border-glass)", background: "var(--color-card-bg)" }}>
                <Table
                  dataSource={calendar}
                  columns={calColumns}
                  rowKey="filing"
                  pagination={false}
                  size="small"
                />
                <Divider />
                <Button block type="dashed" onClick={() => navigate("/payroll/statutory")}>
                  Configure Statutory Settings →
                </Button>
              </Card>
            </Col>
          </Row>

          {/* Quick Action Buttons */}
          <Card style={{ borderRadius: 16, marginTop: 16, border: "var(--border-glass)", background: "var(--color-card-bg)" }}>
            <Text strong style={{ display: "block", marginBottom: 12, color: "var(--color-text-secondary)", textTransform: "uppercase", fontSize: 11 }}>Quick Actions</Text>
            <Space wrap>
              <Button icon={<RocketOutlined />} type="primary" style={{ background: "#6366f1", borderColor: "#6366f1" }} onClick={() => navigate("/payroll/runs")}>Payroll Runs</Button>
              <Button icon={<SafetyOutlined />} onClick={() => navigate("/payroll/statutory")}>Statutory Config</Button>
              <Button icon={<FileTextOutlined />} onClick={() => navigate("/payroll/tax-declaration")}>Tax Declarations</Button>
              <Button icon={<BankOutlined />} onClick={() => navigate("/payroll/disbursement")}>Disbursement</Button>
              <Button icon={<DollarOutlined />} onClick={() => navigate("/payroll/salary-config")}>Salary Structure Builder</Button>
            </Space>
          </Card>
        </>
      )}
    </motion.div>
  )
}
