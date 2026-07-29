import { useState } from 'react'
import { Card, Row, Col, Button, Select, Space, message, Tag } from 'antd'
import {
  DownloadOutlined, PieChartOutlined, HeartOutlined, FileExcelOutlined,
  SolutionOutlined, CalendarOutlined, SafetyOutlined
} from '@ant-design/icons'

export default function LeaveReportsTab() {
  const [selectedYear, setSelectedYear] = useState(2026)

  const handleExportReport = (reportType, reportName) => {
    window.open(`/api/v1/leave/analytics/reports/${reportType}/export?year=${selectedYear}`, '_blank')
    message.success(`Downloading Enterprise Report: ${reportName} (${selectedYear})...`)
  }

  const reportsList = [
    {
      type: 'balance-summary',
      name: 'Employee Balance & Accrual Ledger Statement',
      desc: 'Complete breakdown of Opening, Accrued, Taken, Encashed, Lapsed, and Closing Balances per employee.',
      icon: <PieChartOutlined style={{ color: '#7C3AED', fontSize: 28 }} />,
      tag: 'Audit Ready'
    },
    {
      type: 'statutory-maternity',
      name: 'Statutory Maternity & Paternity Compliance Report',
      desc: 'Legal audit log under Maternity Benefit Act 1961 (2017 Amendment) with child order & medical cert status.',
      icon: <HeartOutlined style={{ color: '#EC4899', fontSize: 28 }} />,
      tag: 'Statutory Compliance'
    },
    {
      type: 'encashment-tax',
      name: 'Leave Encashment & Sec 10(10AA) Tax Statement',
      desc: 'Processed encashment payouts with gross amounts, tax-exempt limits, and taxable salary additions.',
      icon: <FileExcelOutlined style={{ color: '#10B981', fontSize: 28 }} />,
      tag: 'Payroll & Tax'
    },
    {
      type: 'all-applications',
      name: 'Master Leave Applications Audit Log',
      desc: 'Chronological record of all submitted, approved, rejected, and cancelled leave applications.',
      icon: <SolutionOutlined style={{ color: '#3B82F6', fontSize: 28 }} />,
      tag: 'Historical Log'
    },
    {
      type: 'factories-act',
      name: 'Factories Act 1948 Sec 79 Attendance & Accrual Report',
      desc: 'Verification log of 240-day attendance thresholds and 1/20 earned leave accrual rules for plant workers.',
      icon: <SafetyOutlined style={{ color: '#F59E0B', fontSize: 28 }} />,
      tag: 'Labor Law'
    },
    {
      type: 'holiday-rh-utilization',
      name: 'Holiday & Restricted Holiday (RH) Utilization Statement',
      desc: 'Location-wise breakdown of mandatory holiday observances and optional RH selections by staff.',
      icon: <CalendarOutlined style={{ color: '#8B5CF6', fontSize: 28 }} />,
      tag: 'Location Insights'
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Select Calendar Year:</span>
          <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }}>
            <Select.Option value={2026}>CY 2026</Select.Option>
            <Select.Option value={2025}>CY 2025</Select.Option>
            <Select.Option value={2024}>CY 2024</Select.Option>
          </Select>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {reportsList.map((rep) => (
          <Col span={12} key={rep.type}>
            <Card
              style={{ borderRadius: 14, border: 'var(--border-glass)', background: 'var(--color-card-bg)', height: '100%' }}
              bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Space size={12}>
                    {rep.icon}
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 15 }}>{rep.name}</h4>
                      <Tag color="purple" style={{ marginTop: 4, borderRadius: 4, fontWeight: 600 }}>{rep.tag}</Tag>
                    </div>
                  </Space>
                </div>
                <p style={{ margin: '8px 0 16px 0', fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{rep.desc}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportReport(rep.type, rep.name)}
                  style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8, fontWeight: 700 }}
                >
                  Export CSV ({selectedYear})
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
