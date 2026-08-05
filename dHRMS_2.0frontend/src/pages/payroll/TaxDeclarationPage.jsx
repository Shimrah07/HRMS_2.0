import { useState, useEffect, useCallback } from "react"
import { Row, Col, Card, Form, InputNumber, Radio, Button, Table, Tag, Alert, Divider, Typography, Space, message, Spin } from "antd"
import { FileTextOutlined, CheckCircleOutlined, CalculatorOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { motion } from "framer-motion"
import PageHeader from "../../components/common/PageHeader"
import PayrollSubNav from "../../components/payroll/PayrollSubNav"
import { payrollService } from "../../services/payrollService"

const { Title, Text, Paragraph } = Typography

export default function TaxDeclarationPage() {
  const [loading, setLoading] = useState(false)
  const [projection, setProjection] = useState(null)
  const [form] = Form.useForm()

  const loadDeclaration = useCallback(async () => {
    setLoading(true)
    try {
      const res = await payrollService.getMyDeclarations()
      if (res?.data) {
        form.setFieldsValue(res.data)
      }
    } catch {
      /* handled */
    } finally {
      setLoading(false)
    }
  }, [form])

  useEffect(() => { loadDeclaration() }, [loadDeclaration])

  const handleCalculateTds = async () => {
    try {
      const values = form.getFieldsValue()
      // Call TDS projection endpoint for current user
      const empId = "00000000-0000-0000-0000-000000000000" // current user placeholder
      const res = await payrollService.getTDSProjection(empId, "2025-2026")
      setProjection(res?.data)
      message.success("TDS projection computed!")
    } catch {
      message.error("Failed to compute TDS projection.")
    }
  }

  const handleSubmitDeclaration = async (values) => {
    setLoading(true)
    try {
      await payrollService.submitDeclaration(values)
      message.success("Form 12BB Investment Declaration submitted for approval!")
      loadDeclaration()
    } catch (err) {
      message.error(err?.response?.data?.message || "Submission failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="TDS & Tax Regime Management (Form 12BB)"
        subtitle="Declare tax-saving investments (80C, 80D, HRA, Home Loan) and compare New vs Old Tax Regime savings."
        breadcrumbs={[{ label: "Home", path: "/dashboard" }, { label: "Payroll", path: "/payroll" }, { label: "Tax Declaration" }]}
        extra={<PayrollSubNav activeKey="tax-declaration" />}
      />

      <Row gutter={[24, 24]}>
        {/* Form 12BB Declaration Form */}
        <Col xs={24} lg={14}>
          <Card title={<Space><FileTextOutlined /><span>Form 12BB Investment Declaration</span></Space>} style={{ borderRadius: 16, border: "var(--border-glass)", background: "var(--color-card-bg)" }}>
            <Form form={form} layout="vertical" onFinish={handleSubmitDeclaration} initialValues={{ taxRegime: "New", section80C: 0, section80D: 0, hraClaimAmount: 0, homeLoanInterest: 0 }}>
              <Form.Item name="taxRegime" label="Select Preferred Tax Regime" rules={[{ required: true }]}>
                <Radio.Group buttonStyle="solid" size="large">
                  <Radio.Button value="New">New Tax Regime (FY 2025-26 Default - Lower Slabs, No Deductions)</Radio.Button>
                  <Radio.Button value="Old">Old Tax Regime (Higher Slabs + Deductions)</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Divider style={{ margin: "16px 0" }}>Chapter VI-A Deductions (Old Regime Only)</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="section80C" label="Section 80C (PPF, ELSS, EPF, LIC)" help="Capped at ₹1,50,000">
                    <InputNumber style={{ width: "100%" }} prefix="₹" min={0} max={150000} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="section80D" label="Section 80D (Health Insurance)" help="Self & Dependents (Max ₹25k - ₹50k)">
                    <InputNumber style={{ width: "100%" }} prefix="₹" min={0} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="hraClaimAmount" label="Annual Rent Paid (HRA Exemption)">
                    <InputNumber style={{ width: "100%" }} prefix="₹" min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="homeLoanInterest" label="Section 24 (Home Loan Interest)" help="Capped at ₹2,00,000">
                    <InputNumber style={{ width: "100%" }} prefix="₹" min={0} max={200000} />
                  </Form.Item>
                </Col>
              </Row>

              <Space style={{ marginTop: 16 }}>
                <Button type="default" icon={<CalculatorOutlined />} onClick={handleCalculateTds}>
                  Compare New vs Old Regime
                </Button>
                <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />} loading={loading}>
                  Submit Declaration
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        {/* Live Regime Comparison Card */}
        <Col xs={24} lg={10}>
          <Card title={<Space><CalculatorOutlined /><span>Tax Regime Comparison Summary</span></Space>} style={{ borderRadius: 16, border: "var(--border-glass)", background: "var(--color-card-bg)" }}>
            {projection ? (
              <div>
                <Alert
                  type="success"
                  showIcon
                  message={`Recommended: ${projection.recommendedRegime} Tax Regime`}
                  description={`Selecting ${projection.recommendedRegime} regime saves estimated tax for FY.`}
                  style={{ marginBottom: 16, borderRadius: 10 }}
                />

                <Table
                  dataSource={[
                    { metric: "Annual CTC", oldReg: `₹${(projection.annualCTC||0).toLocaleString("en-IN")}`, newReg: `₹${(projection.annualCTC||0).toLocaleString("en-IN")}` },
                    { metric: "Standard Deduction", oldReg: "₹50,000", newReg: "₹75,000" },
                    { metric: "Estimated Taxable Income", oldReg: `₹${(projection.oldRegimeTaxableIncome||0).toLocaleString("en-IN")}`, newReg: `₹${(projection.newRegimeTaxableIncome||0).toLocaleString("en-IN")}` },
                    { metric: "Annual Tax Liability", oldReg: `₹${(projection.oldRegimeTax||0).toLocaleString("en-IN")}`, newReg: `₹${(projection.newRegimeTax||0).toLocaleString("en-IN")}` },
                    { metric: "Monthly TDS Deduction", oldReg: `₹${(projection.oldRegimeTax/12||0).toFixed(2)}`, newReg: `₹${(projection.newRegimeTax/12||0).toFixed(2)}` },
                  ]}
                  columns={[
                    { title: "Metric", dataIndex: "metric", key: "m", render: v => <Text strong>{v}</Text> },
                    { title: "Old Regime", dataIndex: "oldReg", key: "old" },
                    { title: "New Regime", dataIndex: "newReg", key: "new", render: v => <Text type="success">{v}</Text> },
                  ]}
                  pagination={false}
                  size="small"
                />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <InfoCircleOutlined style={{ fontSize: 36, color: "#6366f1", marginBottom: 12 }} />
                <Paragraph type="secondary">
                  Fill in your investment amounts and click "Compare New vs Old Regime" to see live tax breakdown.
                </Paragraph>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </motion.div>
  )
}
