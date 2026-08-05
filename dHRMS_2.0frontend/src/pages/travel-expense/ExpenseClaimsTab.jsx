import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Drawer, Row, Col, Typography, message, Upload, Tooltip, Alert, Divider } from 'antd'
import { CameraOutlined, FileTextOutlined, PlusOutlined, DeleteOutlined, ScanOutlined, SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { travelExpenseService } from '../../services/travelExpenseService'

const { Text, Title } = Typography

export const ExpenseClaimsTab = () => {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitModalVisible, setSubmitModalVisible] = useState(false)
  const [ocrScanning, setOcrScanning] = useState(false)
  const [lineItems, setLineItems] = useState([
    { category: 'Hotel Accommodation', expenseDate: '2026-08-01', amount: 4500, currency: 'INR', gstAmount: 810, vendorGstin: '27AAACT1234F1Z5', isPolicyCompliant: true, description: 'Taj MG Road Stay' }
  ])

  const [form] = Form.useForm()

  useEffect(() => {
    fetchClaims()
  }, [])

  const fetchClaims = async () => {
    setLoading(true)
    try {
      const data = await travelExpenseService.getExpenseClaims()
      setClaims(data)
    } catch (err) {
      console.error(err)
      // Fallback demo data
      setClaims([
        { claimId: '1', claimCode: 'CLM-202608-0001', employeeName: 'Amit EngEmp1', travelCode: 'TR-202608-0001', totalAmount: 18500, advanceAdjusted: 15000, netPayable: 3500, status: 'Submitted', submittedAt: '2026-08-03' },
        { claimId: '2', claimCode: 'CLM-202608-0002', employeeName: 'Sneha HRAdmin', travelCode: 'TR-202608-0002', totalAmount: 85000, advanceAdjusted: 50000, netPayable: 35000, status: 'ManagerApproved', submittedAt: '2026-08-02' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleOcrScan = async () => {
    setOcrScanning(true)
    try {
      const res = await travelExpenseService.processOcrScan({ fileName: 'hotel_bill.jpg' })
      message.success(`OCR Extracted! Vendor: ${res.vendorName}, Amount: ₹${res.extractedAmount}, GSTIN: ${res.gstin}`)

      // Add extracted item to line items
      const newItem = {
        category: 'Hotel Accommodation',
        expenseDate: res.extractedDate || '2026-08-02',
        amount: res.extractedAmount,
        currency: 'INR',
        gstAmount: Math.round(res.extractedAmount * 0.18),
        vendorGstin: res.gstin,
        isPolicyCompliant: true,
        description: `Auto-filled via OCR Scan (${res.vendorName})`
      }
      setLineItems([...lineItems, newItem])
    } catch (err) {
      console.error(err)
      message.error('OCR Extraction failed')
    } finally {
      setOcrScanning(false)
    }
  }

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      { category: 'Local Conveyance', expenseDate: '2026-08-02', amount: 500, currency: 'INR', gstAmount: 0, vendorGstin: '', isPolicyCompliant: true, description: '' }
    ])
  }

  const handleRemoveLineItem = (index) => {
    const updated = lineItems.filter((_, i) => i !== index)
    setLineItems(updated)
  }

  const handleSubmitClaim = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        travelRequestId: values.travelRequestId || null,
        lineItems: lineItems
      }
      await travelExpenseService.submitExpenseClaim(payload)
      message.success('Expense claim submitted successfully for manager approval!')
      setSubmitModalVisible(false)
      form.resetFields()
      fetchClaims()
    } catch (err) {
      console.error(err)
      message.error('Failed to submit expense claim')
    }
  }

  const totalClaimAmount = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const columns = [
    {
      title: 'Claim Code',
      dataIndex: 'claimCode',
      key: 'claimCode',
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>
    },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName'
    },
    {
      title: 'Travel Request',
      dataIndex: 'travelCode',
      key: 'travelCode',
      render: (val) => val || 'Direct Claim'
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val) => `₹ ${val?.toLocaleString()}`
    },
    {
      title: 'Advance Offset',
      dataIndex: 'advanceAdjusted',
      key: 'advanceAdjusted',
      render: (val) => `₹ ${val?.toLocaleString()}`
    },
    {
      title: 'Net Payable',
      dataIndex: 'netPayable',
      key: 'netPayable',
      render: (val) => <Text strong style={{ color: '#3f8600' }}>₹ {val?.toLocaleString()}</Text>
    },
    {
      title: 'Submitted On',
      dataIndex: 'submittedAt',
      key: 'submittedAt'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold'
        if (status === 'ManagerApproved') color = 'blue'
        if (status === 'FinanceApproved') color = 'cyan'
        if (status === 'Reimbursed') color = 'green'
        if (status === 'Rejected') color = 'red'
        return <Tag color={color}>{status}</Tag>
      }
    }
  ]

  return (
    <div style={{ padding: '16px 0' }}>
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#fa8c16' }} />
            <span>Expense Claims & OCR Bill Capture Hub</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setSubmitModalVisible(true)}>
            Compile Expense Claim
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={claims}
          rowKey="claimId"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Expense Claim Submission Modal with OCR */}
      <Modal
        title="Compile Expense Claim Line Items"
        open={submitModalVisible}
        onOk={handleSubmitClaim}
        onCancel={() => setSubmitModalVisible(false)}
        width={900}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="travelRequestId" label="Linked Approved Travel Request">
            <Input placeholder="Enter Travel Request ID (e.g. TR-202608-0001) or leave empty for direct claim" />
          </Form.Item>

          <Alert
            message="Mobile OCR Camera Scan Available"
            description="Click 'Scan Receipt with OCR' to automatically read Bill Amount, Invoice Date, Vendor Name & GSTIN from your receipt photo."
            type="info"
            showIcon
            action={
              <Button type="primary" size="small" icon={<ScanOutlined />} loading={ocrScanning} onClick={handleOcrScan}>
                Scan Receipt with OCR
              </Button>
            }
            style={{ marginBottom: 16 }}
          />

          <Title level={5}>Expense Line Items (Total: ₹ {totalClaimAmount.toLocaleString()})</Title>
          
          {lineItems.map((item, idx) => (
            <Card type="inner" key={idx} style={{ marginBottom: 12, background: '#f9f9f9' }}>
              <Row gutter={12}>
                <Col span={6}>
                  <Text type="secondary">Category</Text>
                  <Select
                    value={item.category}
                    onChange={(val) => {
                      const updated = [...lineItems]
                      updated[idx].category = val
                      setLineItems(updated)
                    }}
                    style={{ width: '100%' }}
                    options={[
                      { value: 'Airfare / Train Fare', label: 'Airfare / Train Fare' },
                      { value: 'Hotel Accommodation', label: 'Hotel Accommodation' },
                      { value: 'Local Conveyance / Cab', label: 'Local Conveyance / Cab' },
                      { value: 'Mileage (Own Vehicle ₹10/km)', label: 'Mileage (Own Vehicle)' },
                      { value: 'Daily Allowance (DA)', label: 'Daily Allowance (DA)' },
                      { value: 'Meal Allowance', label: 'Meal Allowance' },
                      { value: 'Entertainment / Client', label: 'Entertainment / Client' },
                      { value: 'Communication', label: 'Communication' }
                    ]}
                  />
                </Col>
                <Col span={4}>
                  <Text type="secondary">Expense Date</Text>
                  <Input
                    type="date"
                    value={item.expenseDate}
                    onChange={(e) => {
                      const updated = [...lineItems]
                      updated[idx].expenseDate = e.target.value
                      setLineItems(updated)
                    }}
                  />
                </Col>
                <Col span={4}>
                  <Text type="secondary">Amount (₹)</Text>
                  <InputNumber
                    value={item.amount}
                    onChange={(val) => {
                      const updated = [...lineItems]
                      updated[idx].amount = val
                      setLineItems(updated)
                    }}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={4}>
                  <Text type="secondary">GST Amount (₹)</Text>
                  <InputNumber
                    value={item.gstAmount}
                    onChange={(val) => {
                      const updated = [...lineItems]
                      updated[idx].gstAmount = val
                      setLineItems(updated)
                    }}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={5}>
                  <Text type="secondary">Vendor GSTIN</Text>
                  <Input
                    value={item.vendorGstin}
                    placeholder="27AAACT1234F1Z5"
                    onChange={(e) => {
                      const updated = [...lineItems]
                      updated[idx].vendorGstin = e.target.value
                      setLineItems(updated)
                    }}
                  />
                </Col>
                <Col span={1} style={{ textAlign: 'right', paddingTop: 20 }}>
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveLineItem(idx)} />
                </Col>
              </Row>
              <Row gutter={12} style={{ marginTop: 8 }}>
                <Col span={24}>
                  <Input
                    placeholder="Description / Route / Client Guest Details..."
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...lineItems]
                      updated[idx].description = e.target.value
                      setLineItems(updated)
                    }}
                  />
                </Col>
              </Row>
            </Card>
          ))}

          <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddLineItem}>
            Add Expense Line Item
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
