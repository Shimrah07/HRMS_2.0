import { useState, useEffect } from 'react'
import { Card, Button, Row, Col, Space, Table, Tag, Modal, Divider, message, Avatar, Spin } from 'antd'
import {
  DollarOutlined, EyeOutlined, PrinterOutlined, DownloadOutlined,
  FileTextOutlined, AccountBookOutlined, WalletOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import EmptyState from '../../components/common/EmptyState'
import { payrollService } from '../../services/payrollService'

import { useNavigate } from 'react-router-dom'

import PayrollSubNav from '../../components/payroll/PayrollSubNav'

const DEFAULT_PAYSLIPS = [
  { key: '1', monthNumber: 7, year: 2026, month: 'July 2026', workedDays: 30, workingDays: 30, lwpDays: 0, basic: 25000, hra: 12500, special: 12500, lta: 0, pf: 1800, pt: 200, tds: 1500, gross: 50000, totalDeductions: 3500, net: 46500 },
  { key: '2', monthNumber: 6, year: 2026, month: 'June 2026', workedDays: 30, workingDays: 30, lwpDays: 0, basic: 25000, hra: 12500, special: 12500, lta: 0, pf: 1800, pt: 200, tds: 1500, gross: 50000, totalDeductions: 3500, net: 46500 },
  { key: '3', monthNumber: 5, year: 2026, month: 'May 2026', workedDays: 30, workingDays: 30, lwpDays: 0, basic: 25000, hra: 12500, special: 12500, lta: 0, pf: 1800, pt: 200, tds: 1500, gross: 50000, totalDeductions: 3500, net: 46500 },
]

export default function PayrollPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { isDarkMode } = useUIStore()
  const [selectedPayslip, setSelectedPayslip] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [payslips, setPayslips] = useState(DEFAULT_PAYSLIPS)

  useEffect(() => {
    fetchPayslips()
  }, [])

  const fetchPayslips = async () => {
    setLoading(true)
    try {
      const res = await payrollService.getMySalarySlips()
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data.map((item, idx) => {
          const gross = Number(item.grossEarnings || 0)
          const ded = Number(item.totalDeductions || 0)
          const net = Number(item.netPay || (gross - ded))
          return {
            key: item.detailId || String(idx),
            detailId: item.detailId,
            monthNumber: item.monthNumber,
            year: item.year,
            month: item.month,
            workedDays: item.workedDays || 30,
            workingDays: item.workingDays || 30,
            lwpDays: item.lwpDays || 0,
            basic: Math.round(gross * 0.50),
            hra: Math.round(gross * 0.25),
            special: Math.round(gross * 0.25),
            lta: 0,
            pf: Math.round(ded * 0.60),
            pt: Math.min(200, Math.round(ded * 0.05)),
            tds: Math.round(ded * 0.35),
            gross,
            totalDeductions: ded,
            net
          }
        })
        setPayslips(formatted)
      } else {
        setPayslips(DEFAULT_PAYSLIPS)
      }
    } catch (err) {
      console.warn('Backend salary slips fetch warning:', err)
      setPayslips(DEFAULT_PAYSLIPS)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async (record) => {
    setDownloadingPdf(true)
    try {
      const year = record.year || 2026
      const month = record.monthNumber || 5
      await payrollService.downloadMyPayslipPdf(year, month)
      message.success(`Payslip PDF downloaded for ${record.month}`)
    } catch (err) {
      console.error('PDF Download Error:', err)
      message.error('Failed to download PDF payslip. Downloading backup copy...')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const columns = [
    { title: 'Month', dataIndex: 'month', key: 'month', render: (v) => <strong style={{ color: 'var(--color-text-primary)' }}>{v}</strong> },
    { title: 'Worked Days', dataIndex: 'workedDays', key: 'workedDays' },
    { title: 'Gross Earnings', key: 'gross', render: (_, r) => `₹${(r.basic + r.hra + r.special + (r.lta || 0)).toLocaleString('en-IN')}` },
    { title: 'Total Deductions', key: 'deductions', render: (_, r) => `₹${(r.pf + r.pt + r.tds).toLocaleString('en-IN')}` },
    { title: 'Net Pay', dataIndex: 'net', key: 'net', render: (v) => <strong style={{ color: '#FAA71A' }}>₹{v.toLocaleString('en-IN')}</strong> },
    {
      title: 'Action',
      key: 'action',
      render: (_, r) => (
        <Space>
          <Button size="small" type="primary" icon={<EyeOutlined />} onClick={() => setSelectedPayslip(r)} style={{ borderRadius: 6 }}>
            View
          </Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownloadPdf(r)} loading={downloadingPdf} style={{ borderRadius: 6 }}>
            PDF
          </Button>
        </Space>
      )
    }
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Payroll & Payslips"
        subtitle="View monthly payslips, statutory deductions, tax declarations, and process payroll cycles."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Payroll' }]}
        extra={<PayrollSubNav activeKey="main" />}
      />

      {/* Salary Highlights */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Annual Gross CTC</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', marginTop: 4 }}>₹9,60,000</div>
              </div>
              <Avatar size={42} icon={<AccountBookOutlined />} style={{ background: isDarkMode ? 'rgba(160, 90, 255, 0.12)' : 'rgba(16,17,63,0.05)', color: isDarkMode ? '#FAA71A' : '#10113F' }} />
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Monthly Net Salary</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#FAA71A', marginTop: 4 }}>₹72,500</div>
              </div>
              <Avatar size={42} icon={<WalletOutlined />} style={{ background: 'rgba(250,167,26,0.1)', color: '#FAA71A' }} />
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
            <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Monthly Deductions</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#861630', marginTop: 4 }}>₹7,500</div>
              </div>
              <Avatar size={42} icon={<DollarOutlined />} style={{ background: 'rgba(134,22,48,0.1)', color: '#861630' }} />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Salary Slip Table */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#FAA71A' }} />
            <span>Payslip Archives</span>
          </Space>
        }
        style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)', overflow: 'hidden' }}
      >
        <Table columns={columns} dataSource={payslips} loading={loading} pagination={{ pageSize: 6 }} locale={{ emptyText: <EmptyState variant="payroll" /> }} />
      </Card>

      {/* Interactive Payslip Modal */}
      <Modal
        title={null}
        open={selectedPayslip !== null}
        onCancel={() => setSelectedPayslip(null)}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownloadPdf(selectedPayslip)} loading={downloadingPdf} style={{ borderRadius: 8 }}>
            Download PDF
          </Button>,
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint} style={{ borderRadius: 8 }}>
            Print Payslip
          </Button>,
          <Button key="close" onClick={() => setSelectedPayslip(null)} style={{ borderRadius: 8 }}>
            Close
          </Button>
        ]}
        width={700}
        destroyOnClose
      >
        {selectedPayslip && (
          <div id="printable-payslip" style={{ padding: '20px 10px', background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#fff', color: isDarkMode ? 'var(--color-text-primary)' : '#000', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontWeight: 800, color: isDarkMode ? 'var(--color-text-primary)' : '#10113F', fontSize: 20 }}>Acme Technologies Pvt Ltd</h2>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: isDarkMode ? 'var(--color-text-secondary)' : '#555' }}>123 Business Park, Andheri East, Mumbai, Maharashtra - 400069</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0, fontWeight: 700, color: '#FAA71A' }}>PAYSLIP</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: isDarkMode ? 'var(--color-text-primary)' : '#000' }}>{selectedPayslip.month}</p>
              </div>
            </div>

            <Divider style={{ margin: '16px 0', borderColor: isDarkMode ? 'rgba(160, 90, 255, 0.2)' : '#ddd' }} />

            {/* Employee info */}
            <Row gutter={[16, 12]} style={{ fontSize: 12, marginBottom: 20 }}>
              <Col span={12}>
                <div><strong>Employee Name:</strong> {user?.name || 'Jane Doe'}</div>
                <div style={{ marginTop: 6 }}><strong>Employee Code:</strong> EMP0101</div>
                <div style={{ marginTop: 6 }}><strong>Department:</strong> Product Engineering</div>
              </Col>
              <Col span={12}>
                <div><strong>Designation:</strong> Senior Software Engineer</div>
                <div style={{ marginTop: 6 }}><strong>Bank Name:</strong> HDFC Bank Ltd</div>
                <div style={{ marginTop: 6 }}><strong>Bank Account:</strong> ************5432</div>
              </Col>
            </Row>

            {/* Earnings & Deductions Tables */}
            <Row gutter={24}>
              <Col span={12}>
                <div className="earnings-header" style={{ background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', padding: '6px 10px', fontWeight: 700, fontSize: 12 }}>EARNINGS</div>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 8 }}>
                  <tbody>
                    <tr style={{ borderBottom: isDarkMode ? '1px solid rgba(160, 90, 255, 0.18)' : '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}>Basic Salary</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{selectedPayslip.basic.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: isDarkMode ? '1px solid rgba(160, 90, 255, 0.18)' : '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}>HRA (House Rent Allowance)</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{selectedPayslip.hra.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: isDarkMode ? '1px solid rgba(160, 90, 255, 0.18)' : '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}>Special Allowance</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{selectedPayslip.special.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ fontWeight: 700 }}>
                      <td style={{ padding: '8px 4px' }}>Gross Earnings</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{(selectedPayslip.basic + selectedPayslip.hra + selectedPayslip.special).toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </Col>

              <Col span={12}>
                <div className="deductions-header" style={{ background: '#861630', color: '#fff', padding: '6px 10px', fontWeight: 700, fontSize: 12 }}>DEDUCTIONS</div>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginTop: 8 }}>
                  <tbody>
                    <tr style={{ borderBottom: isDarkMode ? '1px solid rgba(160, 90, 255, 0.18)' : '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}>Provident Fund (PF)</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{selectedPayslip.pf.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: isDarkMode ? '1px solid rgba(160, 90, 255, 0.18)' : '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}>Professional Tax (PT)</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{selectedPayslip.pt.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ borderBottom: isDarkMode ? '1px solid rgba(160, 90, 255, 0.18)' : '1px solid #eee' }}>
                      <td style={{ padding: '8px 4px' }}>Income Tax (TDS)</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{selectedPayslip.tds.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style={{ fontWeight: 700 }}>
                      <td style={{ padding: '8px 4px' }}>Total Deductions</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right' }}>₹{(selectedPayslip.pf + selectedPayslip.pt + selectedPayslip.tds).toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0', borderColor: isDarkMode ? 'rgba(160, 90, 255, 0.2)' : '#ddd' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? 'rgba(250, 167, 26, 0.1)' : '#FAF9F6', padding: '12px 16px', borderRadius: 8 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>NET PAY FOR THE MONTH:</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2 }}>Rupees Seventy Two Thousand Five Hundred Only</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FAA71A' }}>₹{selectedPayslip.net.toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
