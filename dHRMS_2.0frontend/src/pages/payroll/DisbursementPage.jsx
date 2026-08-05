import { useState, useEffect, useCallback } from "react"
import { Row, Col, Card, Table, Tag, Button, Select, Space, Statistic, Alert, Typography, message, Modal, Form, Input } from "antd"
import { BankOutlined, DownloadOutlined, LockOutlined, CheckCircleOutlined, WarningOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import PageHeader from "../../components/common/PageHeader"
import PayrollSubNav from "../../components/payroll/PayrollSubNav"
import { payrollService } from "../../services/payrollService"

const { Title, Text, Paragraph } = Typography

export default function DisbursementPage() {
  const [runs, setRuns] = useState([])
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bankFormat, setBankFormat] = useState("HDFC")

  const loadApprovedRuns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await payrollService.getRuns()
      const approved = (res?.data || []).filter(r => ["Approved", "Locked", "Disbursed"].includes(r.status))
      setRuns(approved)
      if (approved.length > 0 && !selectedRunId) {
        setSelectedRunId(approved[0].runId)
      }
    } catch {
      message.error("Failed to load approved payroll runs.")
    } finally {
      setLoading(false)
    }
  }, [selectedRunId])

  useEffect(() => { loadApprovedRuns() }, [loadApprovedRuns])

  const loadSummary = useCallback(async () => {
    if (!selectedRunId) return
    try {
      const res = await payrollService.getDisbursementSummary(selectedRunId)
      setSummary(res?.data)
    } catch {
      /* handled */
    }
  }, [selectedRunId])

  useEffect(() => { loadSummary() }, [loadSummary])

  const handleDownloadBankFile = async () => {
    if (!selectedRunId) return
    try {
      await payrollService.generateBankFile(selectedRunId, bankFormat)
      message.success(`${bankFormat} Corporate Disbursement File generated!`)
    } catch {
      message.error("Failed to generate bank disbursement file.")
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Payment & Disbursement Gateway"
        subtitle="Corporate banking bulk payout file generation (HDFC, ICICI, SBI) for NEFT/RTGS salary transfer."
        breadcrumbs={[{ label: "Home", path: "/dashboard" }, { label: "Payroll", path: "/payroll" }, { label: "Disbursement" }]}
        extra={<PayrollSubNav activeKey="disbursement" />}
      />

      <Card style={{ borderRadius: 16, marginBottom: 24, border: "var(--border-glass)", background: "var(--color-card-bg)" }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Text strong>Select Approved Payroll Run:</Text>
            <Select
              style={{ width: "100%", marginTop: 4 }}
              value={selectedRunId}
              onChange={setSelectedRunId}
              options={runs.map(r => ({ value: r.runId, label: `${r.month}/${r.year} (${r.runType}) — Net ₹${(r.totalNetPay||0).toLocaleString("en-IN")}` }))}
              placeholder="Select run"
            />
          </Col>
          <Col span={8}>
            <Text strong>Select Corporate Bank Format:</Text>
            <Select
              style={{ width: "100%", marginTop: 4 }}
              value={bankFormat}
              onChange={setBankFormat}
              options={[
                { value: "HDFC", label: "HDFC Bank (CMS Format CSV)" },
                { value: "ICICI", label: "ICICI Bank (CIB Corporate Payout)" },
                { value: "SBI", label: "State Bank of India (CMP Format)" }
              ]}
            />
          </Col>
          <Col span={8} style={{ textAlign: "right", paddingTop: 20 }}>
            <Button
              type="primary"
              size="large"
              style={{ background: "#10b981", borderColor: "#10b981" }}
              icon={<DownloadOutlined />}
              onClick={handleDownloadBankFile}
              disabled={!selectedRunId}
            >
              Generate & Download Bank File
            </Button>
          </Col>
        </Row>
      </Card>

      {summary && (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card style={{ borderRadius: 12 }}><Statistic title="Total Employees" value={summary.totalEmployees} /></Card>
          </Col>
          <Col xs={24} md={6}>
            <Card style={{ borderRadius: 12 }}><Statistic title="Total Net Salary Payout" value={summary.totalNetPay} prefix="₹" precision={2} valueStyle={{ color: "#10b981" }} /></Card>
          </Col>
          <Col xs={24} md={6}>
            <Card style={{ borderRadius: 12 }}><Statistic title="Verified Bank Accounts" value={summary.validBankDetailsCount} valueStyle={{ color: "#3b82f6" }} /></Card>
          </Col>
          <Col xs={24} md={6}>
            <Card style={{ borderRadius: 12 }}><Statistic title="Missing Bank Account Info" value={summary.missingBankDetailsCount} valueStyle={{ color: summary.missingBankDetailsCount > 0 ? "#ef4444" : "#10b981" }} /></Card>
          </Col>
        </Row>
      )}
    </motion.div>
  )
}
