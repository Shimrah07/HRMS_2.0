import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Input, Select, DatePicker, Tag, Space, Drawer, Row, Col, Typography, message, Switch } from 'antd'
import { PlusOutlined, RocketOutlined, FilePdfOutlined, GlobalOutlined } from '@ant-design/icons'
import { travelExpenseService } from '../../services/travelExpenseService'

const { Text } = Typography
const { RangePicker } = DatePicker

export const TravelRequestsContent = ({ createModalOpen, setCreateModalOpen }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [bookingDrawerVisible, setBookingDrawerVisible] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [isInternational, setIsInternational] = useState(false)

  const [form] = Form.useForm()
  const [bookingForm] = Form.useForm()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const data = await travelExpenseService.getTravelRequests()
      setRequests(data)
    } catch (err) {
      console.error(err)
      setRequests([
        { requestId: '1', travelCode: 'TR-202608-0001', employeeName: 'Amit EngEmp1', travelType: 'Domestic', purpose: 'Client Meeting', fromCity: 'Mumbai', toCity: 'Bangalore', startDate: '2026-08-10', endDate: '2026-08-12', modeOfTravel: 'Flight', estimatedCost: 18500, status: 'Approved' },
        { requestId: '2', travelCode: 'TR-202608-0002', employeeName: 'Sneha HRAdmin', travelType: 'International', purpose: 'Conference-Training', fromCity: 'Mumbai', toCity: 'Singapore', startDate: '2026-08-20', endDate: '2026-08-25', modeOfTravel: 'Flight', estimatedCost: 95000, status: 'BookingConfirmed', passportNumber: 'Z1234567', visaStatus: 'Approved', forexCurrency: 'USD', forexAmount: 1200 },
        { requestId: '3', travelCode: 'TR-202608-0003', employeeName: 'Vikram FinEmp1', travelType: 'Domestic', purpose: 'Site Visit', fromCity: 'Delhi', toCity: 'Pune', startDate: '2026-08-15', endDate: '2026-08-16', modeOfTravel: 'Train', estimatedCost: 4500, status: 'Pending' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequest = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        startDate: values.travelDates[0].format('YYYY-MM-DD'),
        endDate: values.travelDates[1].format('YYYY-MM-DD'),
        travelType: isInternational ? 'International' : 'Domestic'
      }
      delete payload.travelDates

      await travelExpenseService.createTravelRequest(payload)
      message.success('Travel request raised successfully! Pending manager review.')
      if (setCreateModalOpen) setCreateModalOpen(false)
      form.resetFields()
      fetchRequests()
    } catch (err) {
      console.error(err)
      message.error(err.response?.data?.message || 'Failed to submit travel request')
    }
  }

  const handleConfirmBooking = async () => {
    try {
      const values = await bookingForm.validateFields()
      await travelExpenseService.confirmBooking(selectedRequest.requestId, values)
      message.success('Travel Desk booking confirmed & e-tickets attached!')
      setBookingDrawerVisible(false)
      bookingForm.resetFields()
      fetchRequests()
    } catch (err) {
      console.error(err)
      message.error('Failed to confirm booking')
    }
  }

  const openBookingDrawer = (record) => {
    setSelectedRequest(record)
    setBookingDrawerVisible(true)
  }

  const columns = [
    {
      title: 'Travel Code',
      dataIndex: 'travelCode',
      key: 'travelCode',
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>
    },
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName'
    },
    {
      title: 'Type',
      dataIndex: 'travelType',
      key: 'travelType',
      render: (type) => (
        <Tag color={type === 'International' ? 'purple' : 'blue'}>
          {type === 'International' ? <GlobalOutlined /> : <RocketOutlined />} {type}
        </Tag>
      )
    },
    {
      title: 'Route',
      key: 'route',
      render: (_, record) => `${record.fromCity} ➔ ${record.toCity}`
    },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, record) => `${record.startDate} to ${record.endDate}`
    },
    {
      title: 'Mode',
      dataIndex: 'modeOfTravel',
      key: 'modeOfTravel'
    },
    {
      title: 'Est. Cost',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      render: (val) => `₹ ${val?.toLocaleString()}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold'
        if (status === 'Approved') color = 'blue'
        if (status === 'BookingConfirmed') color = 'green'
        if (status === 'Rejected') color = 'red'
        return <Tag color={color}>{status}</Tag>
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'Approved' && (
            <Button type="primary" size="small" onClick={() => openBookingDrawer(record)}>
              Confirm Booking
            </Button>
          )}
          {record.status === 'BookingConfirmed' && (
            <Tag color="cyan"><FilePdfOutlined /> Ticket Issued</Tag>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="requestId"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* New Travel Request Modal */}
      <Modal
        title="Raise Business Travel Request"
        open={createModalOpen}
        onOk={handleCreateRequest}
        onCancel={() => setCreateModalOpen && setCreateModalOpen(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="International Travel?">
                <Switch checked={isInternational} onChange={(val) => setIsInternational(val)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purpose" label="Purpose of Travel" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Client Meeting', label: 'Client Meeting' },
                  { value: 'Conference-Training', label: 'Conference / Training' },
                  { value: 'Site Visit', label: 'Site Visit' },
                  { value: 'Internal Audit', label: 'Internal Audit' }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fromCity" label="From City" rules={[{ required: true }]}>
                <Input placeholder="e.g. Mumbai" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toCity" label="To City" rules={[{ required: true }]}>
                <Input placeholder="e.g. Singapore / Bangalore" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="travelDates" label="Travel Dates (Start to End)" rules={[{ required: true }]}>
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="modeOfTravel" label="Mode of Travel" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'Flight', label: 'Flight' },
                  { value: 'Train', label: 'Train' },
                  { value: 'Own Vehicle', label: 'Own Vehicle' }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="projectCode" label="Project / Cost Center Tag" rules={[{ required: true }]}>
                <Input placeholder="e.g. Project Alpha / Internal-Admin" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="estimatedCost" label="Estimated Trip Cost (₹)" rules={[{ required: true }]}>
                <Input type="number" placeholder="25000" />
              </Form.Item>
            </Col>
          </Row>

          {isInternational && (
            <Card type="inner" title="International Travel Requirements" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="passportNumber" label="Passport Number" rules={[{ required: true }]}>
                    <Input placeholder="A1234567" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="visaStatus" label="Visa Status" rules={[{ required: true }]}>
                    <Select options={[
                      { value: 'Valid Visa Exists', label: 'Valid Visa Exists' },
                      { value: 'Visa Assistance Required', label: 'Visa Assistance Required' },
                      { value: 'Visa On Arrival', label: 'Visa On Arrival' }
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="forexCurrency" label="Forex Currency">
                    <Select options={[
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'SGD', label: 'SGD (S$)' }
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="forexAmount" label="Forex Advance Amount">
                    <Input type="number" placeholder="1000" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          <Form.Item name="businessJustification" label="Business Justification" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Explain why travel is required for business objectives..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Travel Desk Booking Action Drawer */}
      <Drawer
        title={`Confirm Booking for ${selectedRequest?.travelCode}`}
        open={bookingDrawerVisible}
        onClose={() => setBookingDrawerVisible(false)}
        width={500}
      >
        <Form form={bookingForm} layout="vertical">
          <Form.Item name="bookingReference" label="PNR / Booking Reference" rules={[{ required: true }]}>
            <Input placeholder="e.g. PNR-IND-987654" />
          </Form.Item>
          <Form.Item name="ticketDetails" label="Flight / Train Ticket Details" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="IndiGo 6E-204 (BOM -> BLR), Dep 08:30 AM" />
          </Form.Item>
          <Form.Item name="hotelDetails" label="Hotel Confirmation Details">
            <Input.TextArea rows={3} placeholder="Taj MG Road Bangalore (2 Nights, Deluxe Room)" />
          </Form.Item>
          <Form.Item name="attachmentPath" label="E-Ticket / Itinerary PDF Link">
            <Input placeholder="https://storage.indiahrms.com/tickets/ticket_123.pdf" />
          </Form.Item>
          <Button type="primary" block onClick={handleConfirmBooking}>
            Confirm & Notify Employee
          </Button>
        </Form>
      </Drawer>
    </div>
  )
}

export default TravelRequestsContent
