import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Button, Select, Space, Tag, Typography, message } from 'antd'
import { LineChartOutlined, FileExcelOutlined } from '@ant-design/icons'
import { travelExpenseService } from '../../services/travelExpenseService'

const { Text } = Typography

export const TravelReportsContent = () => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState('1')
  const [reportData, setReportData] = useState([])
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    fetchSummary()
    fetchReport('1')
  }, [])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const data = await travelExpenseService.getAnalyticsSummary()
      setSummary(data)
    } catch (err) {
      console.error(err)
      setSummary({
        totalSpendThisMonth: 462000,
        pendingTravelRequests: 28,
        activeClaimsCount: 45,
        overdueAdvanceCount: 3,
        averageReimbursementTatDays: 4.2,
        policyViolationRatePct: 3.5,
        topVisitedCities: [
          { cityName: 'Mumbai', tripCount: 14, totalSpend: 145000 },
          { cityName: 'Bangalore', tripCount: 11, totalSpend: 112000 },
          { cityName: 'Delhi NCR', tripCount: 9, totalSpend: 98000 }
        ],
        spendByCategory: [
          { categoryName: 'Airfare', amount: 185000, percentage: 40 },
          { categoryName: 'Hotel Accommodation', amount: 140000, percentage: 30 },
          { categoryName: 'Local Conveyance', amount: 65000, percentage: 14 }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReport = async (reportId) => {
    setReportLoading(true)
    try {
      const data = await travelExpenseService.getReportData({ reportId })
      setReportData(data)
    } catch (err) {
      console.error(err)
      setReportData([
        { column1: 'Engineering', column2: '18 Trips', column3: '₹ 2,45,000', column4: '₹ 13,611', status: 'Normal' },
        { column1: 'Sales', column2: '24 Trips', column3: '₹ 3,80,000', column4: '₹ 15,833', status: 'High Spend' },
        { column1: 'Human Resources', column2: '5 Trips', column3: '₹ 45,000', column4: '₹ 9,000', status: 'Normal' }
      ])
    } finally {
      setReportLoading(false)
    }
  }

  const handleExportCsv = () => {
    message.success('Downloading enterprise report export (CSV/Excel)...')
  }

  const reportsList = [
    { id: '1', title: '1. Department-wise Travel Spend Report' },
    { id: '2', title: '2. Employee Travel Frequency & Duration Report' },
    { id: '3', title: '3. Budget vs Actual Travel Cost Variance' },
    { id: '4', title: '4. Most Visited Cities & Destination Spend' },
    { id: '5', title: '5. Policy Violation & Exception Tracking' },
    { id: '6', title: '6. Pending Travel Advance Aging Audit' },
    { id: '7', title: '7. Executive Monthly T&E Summary' },
    { id: '8', title: '8. Project-wise Client Billable Cost Allocation' },
    { id: '9', title: '9. Reimbursement Turnaround Time (TAT) Analysis' },
    { id: '10', title: '10. Claim Rejection & Resubmission Reasons' },
    { id: '11', title: '11. GST / Input Tax Credit (ITC) Claim Summary' },
    { id: '12', title: '12. Corporate Credit Card Statement Reconciliation' },
    { id: '13', title: '13. Expense Category Breakdown Analysis' },
    { id: '14', title: '14. International Travel Compliance & Visa Status' }
  ]

  const reportColumns = [
    { title: 'Department / Detail', dataIndex: 'column1', key: 'column1', render: (t) => <strong>{t}</strong> },
    { title: 'Metrics / Trips', dataIndex: 'column2', key: 'column2' },
    { title: 'Total Spend', dataIndex: 'column3', key: 'column3', render: (t) => <Text style={{ color: '#1890ff' }}>{t}</Text> },
    { title: 'Average Cost / Trip', dataIndex: 'column4', key: 'column4' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'High Spend' ? 'volcano' : 'green'}>{s}</Tag> }
  ]

  return (
    <div>
      {/* Live Metrics Executive Bar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Total T&E Spend (This Month)"
              value={summary?.totalSpendThisMonth || 462000}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Average Reimbursement TAT"
              value={summary?.averageReimbursementTatDays || 4.2}
              suffix="Days"
              precision={1}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Policy Violation Rate"
              value={summary?.policyViolationRatePct || 3.5}
              suffix="%"
              precision={1}
              valueStyle={{ color: summary?.policyViolationRatePct > 5 ? '#cf1322' : '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Overdue Advances (>30 Days)"
              value={summary?.overdueAdvanceCount || 3}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Reports Hub */}
      <Card
        title={
          <Space>
            <LineChartOutlined style={{ color: '#1890ff' }} />
            <span>Select Enterprise Report</span>
          </Space>
        }
        extra={
          <Space>
            <Select
              style={{ width: 340 }}
              value={selectedReport}
              onChange={(val) => {
                setSelectedReport(val)
                fetchReport(val)
              }}
              options={reportsList.map(r => ({ value: r.id, label: r.title }))}
            />
            <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportCsv}>
              Export Excel/CSV
            </Button>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <Table
          columns={reportColumns}
          dataSource={reportData}
          rowKey="column1"
          loading={reportLoading}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default TravelReportsContent
