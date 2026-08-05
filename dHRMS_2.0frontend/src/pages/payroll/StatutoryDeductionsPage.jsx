import { useState, useEffect, useCallback } from "react"
import { Row, Col, Tabs, Card, Form, Input, Switch, InputNumber, Select, Button, Table, Tag, Space, Divider, Alert, Typography, message } from "antd"
import { SafetyOutlined, SettingOutlined, DownloadOutlined, CalendarOutlined, CheckCircleOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import PageHeader from "../../components/common/PageHeader"
import PayrollSubNav from "../../components/payroll/PayrollSubNav"
import { payrollService } from "../../services/payrollService"

const { Title, Text, Paragraph } = Typography

export default function StatutoryDeductionsPage() {
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState(null)
  const [ptSlabs, setPtSlabs] = useState([])
  const [ecrData, setEcrData] = useState(null)
  const [esiData, setEsiData] = useState(null)
  const [calendar, setCalendar] = useState([])
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [configForm] = Form.useForm()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [cfgRes, ptRes, calRes] = await Promise.allSettled([
        payrollService.getStatutoryConfig(),
        payrollService.getPTSlabs("MH"),
        payrollService.getComplianceCalendar()
      ])
      if (cfgRes.status === "fulfilled") {
        setConfig(cfgRes.value?.data)
        configForm.setFieldsValue(cfgRes.value?.data)
      }
      if (ptRes.status === "fulfilled") setPtSlabs(ptRes.value?.data || [])
      if (calRes.status === "fulfilled") setCalendar(calRes.value?.data || [])
    } catch {
      message.error("Failed to load statutory configuration.")
    } finally {
      setLoading(false)
    }
  }, [configForm])

  useEffect(() => { loadData() }, [loadData])

  const handleSaveConfig = async (values) => {
    setLoading(true)
    try {
      await payrollService.updateStatutoryConfig(values)
      message.success("Statutory config saved successfully!")
      loadData()
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save config.")
    } finally {
      setLoading(false)
    }
  }

  const handleFetchECR = async () => {
    try {
      const res = await payrollService.getPFECR(month, year)
      setEcrData(res?.data)
      message.success("PF ECR report generated!")
    } catch (err) {
      message.error(err?.response?.data?.message || "No locked payroll run found for ECR.")
    }
  }

  const handleFetchESI = async () => {
    try {
      const res = await payrollService.getESIReturn(month, year)
      setEsiData(res?.data)
      message.success("ESI return report generated!")
    } catch (err) {
      message.error(err?.response?.data?.message || "No payroll run found for ESI return.")
    }
  }

  const ptColumns = [
    { title: "State", dataIndex: "stateCode", key: "state", render: v => <Tag color="blue">{v}</Tag> },
    { title: "From Monthly Gross", dataIndex: "fromAmount", key: "from", render: v => `₹${v.toLocaleString("en-IN")}` },
    { title: "To Monthly Gross", dataIndex: "toAmount", key: "to", render: v => v ? `₹${v.toLocaleString("en-IN")}` : "Above (No limit)" },
    { title: "Monthly PT", dataIndex: "monthlyPTAmount", key: "pt", render: v => <Text strong>₹{v}</Text> },
    { title: "Feb Override", dataIndex: "februaryOverride", key: "feb", render: v => v ? <Tag color="gold">₹{v} (Feb)</Tag> : "None" },
  ]

  const tabItems = [
    {
      key: "config",
      label: <span><SettingOutlined /> Rules & Statutory Config</span>,
      children: (
        <Form form={configForm} layout="vertical" onFinish={handleSaveConfig}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Card title="Provident Fund (PF) Settings" style={{ borderRadius: 12, marginBottom: 16 }}>
                <Form.Item name="pfApplicable" label="PF Applicable" valuePropName="checked">
                  <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>
                <Form.Item name="pfHigherBasis" label="PF on Higher Basic (Actual vs Capped)" valuePropName="checked">
                  <Switch checkedChildren="Actual Basic" unCheckedChildren="Capped at ₹15,000" />
                </Form.Item>
                <Form.Item name="pfWageCeiling" label="PF Statutory Wage Ceiling (₹)">
                  <InputNumber style={{ width: "100%" }} prefix="₹" />
                </Form.Item>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="ESIC Settings" style={{ borderRadius: 12, marginBottom: 16 }}>
                <Form.Item name="esiApplicable" label="ESI Applicable" valuePropName="checked">
                  <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>
                <Form.Item name="esiGrossLimit" label="ESI Gross Salary Threshold Limit (₹)">
                  <InputNumber style={{ width: "100%" }} prefix="₹" />
                </Form.Item>
                <Paragraph type="secondary" style={{ fontSize: 12 }}>
                  ESI applies if monthly gross ≤ threshold (Default ₹21,000). Employee contribution: 0.75%, Employer: 3.25%.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Professional Tax (PT) & LWF" style={{ borderRadius: 12, marginBottom: 16 }}>
                <Form.Item name="ptApplicable" label="Professional Tax (PT) Applicable" valuePropName="checked">
                  <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>
                <Form.Item name="workState" label="Primary State for PT Slabs">
                  <Select options={[{ value: "MH", label: "Maharashtra (MH)" }, { value: "KA", label: "Karnataka (KA)" }, { value: "DL", label: "Delhi (DL)" }, { value: "TN", label: "Tamil Nadu (TN)" }]} />
                </Form.Item>
                <Form.Item name="lwfApplicable" label="Labour Welfare Fund (LWF)" valuePropName="checked">
                  <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
                </Form.Item>
                <Form.Item name="lopDivisor" label="LOP Deduction Divisor Policy">
                  <Select options={[{ value: "Fixed30", label: "Fixed 30 Days" }, { value: "ActualDays", label: "Actual Days in Month (28/30/31)" }]} />
                </Form.Item>
              </Card>
            </Col>
          </Row>
          <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />} loading={loading} size="large">
            Save Statutory Configuration
          </Button>
        </Form>
      )
    },
    {
      key: "pt",
      label: <span><SafetyOutlined /> PT Slabs (Statewise)</span>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Title level={5}>Professional Tax Slabs — Maharashtra (MH)</Title>
          <Table dataSource={ptSlabs} columns={ptColumns} rowKey="fromAmount" pagination={false} size="small" />
        </Card>
      )
    },
    {
      key: "pfecr",
      label: <span><DownloadOutlined /> PF ECR Export</span>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Space style={{ marginBottom: 16 }}>
            <Select value={month} onChange={setMonth} options={[1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Month ${m}` }))} />
            <Select value={year} onChange={setYear} options={[2025, 2026, 2027].map(y => ({ value: y, label: `${y}` }))} />
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleFetchECR}>Generate PF ECR File</Button>
          </Space>

          {ecrData && (
            <div>
              <Alert type="success" showIcon message={`PF ECR Generated for Period ${ecrData.month}/${ecrData.year}`} description={`Total Members: ${ecrData.totalMembers} | Total EPF Contribution: ₹${ecrData.totalEPFContribution?.toLocaleString("en-IN")}`} style={{ marginBottom: 16 }} />
              <Table dataSource={ecrData.records} columns={[
                { title: "UAN / Account No", dataIndex: "uan" },
                { title: "Employee Name", dataIndex: "empName" },
                { title: "Gross Wages", dataIndex: "grossWages", render: v => `₹${v?.toLocaleString("en-IN")}` },
                { title: "EPF Base", dataIndex: "epfWages", render: v => `₹${v?.toLocaleString("en-IN")}` },
                { title: "EPF Contribution", dataIndex: "epfContribution", render: v => `₹${v}` },
                { title: "NCP Days", dataIndex: "ncp" }
              ]} rowKey="uan" size="small" pagination={{ pageSize: 8 }} />
            </div>
          )}
        </Card>
      )
    },
    {
      key: "esi",
      label: <span><DownloadOutlined /> ESI Monthly Return</span>,
      children: (
        <Card style={{ borderRadius: 12 }}>
          <Space style={{ marginBottom: 16 }}>
            <Select value={month} onChange={setMonth} options={[1,2,3,4,5,6,7,8,9,10,11,12].map(m => ({ value: m, label: `Month ${m}` }))} />
            <Select value={year} onChange={setYear} options={[2025, 2026, 2027].map(y => ({ value: y, label: `${y}` }))} />
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleFetchESI}>Generate ESI Return</Button>
          </Space>

          {esiData && (
            <div>
              <Alert type="info" showIcon message={`ESI Return Generated for ${esiData.month}/${esiData.year}`} description={`Total ESI Members: ${esiData.totalESIMembers} | Total ESI Deposit: ₹${esiData.totalESIContribution?.toLocaleString("en-IN")}`} style={{ marginBottom: 16 }} />
              <Table dataSource={esiData.records} columns={[
                { title: "ESIC Insurance No", dataIndex: "esicInsuranceNo" },
                { title: "Employee Name", dataIndex: "empName" },
                { title: "Gross Salary", dataIndex: "grossSalary", render: v => `₹${v?.toLocaleString("en-IN")}` },
                { title: "ESI Employee (0.75%)", dataIndex: "esiEmployee" },
                { title: "ESI Employer (3.25%)", dataIndex: "esiEmployer" },
                { title: "Total ESI", dataIndex: "totalESI" }
              ]} rowKey="esicInsuranceNo" size="small" pagination={{ pageSize: 8 }} />
            </div>
          )}
        </Card>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Statutory Deductions & Compliance Management"
        subtitle="Configure company-wide PF, ESI, Professional Tax (PT), and generate monthly statutory filings (ECR, ESI Return)."
        breadcrumbs={[{ label: "Home", path: "/dashboard" }, { label: "Payroll", path: "/payroll" }, { label: "Statutory" }]}
        extra={<PayrollSubNav activeKey="statutory" />}
      />
      <Card style={{ borderRadius: 16, border: "var(--border-glass)", background: "var(--color-card-bg)" }}>
        <Tabs items={tabItems} />
      </Card>
    </motion.div>
  )
}
