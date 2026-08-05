import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, Row, Col, Typography, Alert, message } from 'antd'
import { SafetyCertificateOutlined, EditOutlined, AlertOutlined, GlobalOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { travelExpenseService } from '../../services/travelExpenseService'

const { Title, Text, Paragraph } = Typography

export const PolicyEntitlementTab = () => {
  const [entitlements, setEntitlements] = useState([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false)
  const [editingEntitlement, setEditingEntitlement] = useState(null)

  const [form] = Form.useForm()
  const [exceptionForm] = Form.useForm()

  useEffect(() => {
    fetchEntitlements()
  }, [])

  const fetchEntitlements = async () => {
    setLoading(true)
    try {
      const data = await travelExpenseService.getEntitlements()
      setEntitlements(data)
    } catch (err) {
      console.error(err)
      // Fallback demo data
      setEntitlements([
        { entitlementId: '1', gradeBand: 'Band A (Junior/Exec)', flightClass: 'Economy', trainClass: 'AC 3-Tier', hotelCategory: '3-Star', daMetro: 1500, daNonMetro: 1000 },
        { entitlementId: '2', gradeBand: 'Band B (Senior Exec)', flightClass: 'Economy (Premium >4hr)', trainClass: 'AC 2-Tier', hotelCategory: '4-Star', daMetro: 2000, daNonMetro: 1500 },
        { entitlementId: '3', gradeBand: 'Band C (Manager)', flightClass: 'Premium Economy', trainClass: 'AC 1st Class', hotelCategory: '4-Star', daMetro: 2500, daNonMetro: 1800 },
        { entitlementId: '4', gradeBand: 'Band D (Sr Manager+)', flightClass: 'Business (Intl)', trainClass: 'AC 1st Class', hotelCategory: '5-Star', daMetro: 3500, daNonMetro: 2500 },
        { entitlementId: '5', gradeBand: 'Band E (Leadership/CXO)', flightClass: 'Business Class', trainClass: 'AC 1st Class', hotelCategory: '5-Star Luxury', daMetro: 5000, daNonMetro: 3500 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (record) => {
    setEditingEntitlement(record)
    form.setFieldsValue(record)
    setEditModalVisible(true)
  }

  const handleSaveEntitlement = async () => {
    try {
      const values = await form.validateFields()
      await travelExpenseService.saveEntitlement(values)
      message.success('Travel entitlement policy updated successfully')
      setEditModalVisible(false)
      fetchEntitlements()
    } catch (err) {
      console.error(err)
      message.error('Failed to save entitlement')
    }
  }

  const handleRequestException = async () => {
    try {
      const values = await exceptionForm.validateFields()
      await travelExpenseService.requestPolicyException(values)
      message.success('Policy exception request submitted for Dual Approval (HOD + Finance)')
      setExceptionModalVisible(false)
      exceptionForm.resetFields()
    } catch (err) {
      console.error(err)
      message.error('Failed to submit exception request')
    }
  }

  const columns = [
    {
      title: 'Grade Band',
      dataIndex: 'gradeBand',
      key: 'gradeBand',
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>
    },
    {
      title: 'Flight Class',
      dataIndex: 'flightClass',
      key: 'flightClass',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Train Class',
      dataIndex: 'trainClass',
      key: 'trainClass',
      render: (text) => <Tag color="cyan">{text}</Tag>
    },
    {
      title: 'Hotel Category',
      dataIndex: 'hotelCategory',
      key: 'hotelCategory',
      render: (text) => <Tag color="gold">{text}</Tag>
    },
    {
      title: 'Daily Allowance (Metro)',
      dataIndex: 'daMetro',
      key: 'daMetro',
      render: (val) => `₹ ${val?.toLocaleString()}/day`
    },
    {
      title: 'Daily Allowance (Non-Metro)',
      dataIndex: 'daNonMetro',
      key: 'daNonMetro',
      render: (val) => `₹ ${val?.toLocaleString()}/day`
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button icon={<EditOutlined />} type="link" onClick={() => handleEdit(record)}>
          Configure
        </Button>
      )
    }
  ]

  return (
    <div style={{ padding: '16px 0' }}>
      <Alert
        message="Automated Entitlement Enforcement Active"
        description="All travel booking requests & accommodation classes are hard-enforced according to employee grade band. Entitlement breaches require Dual Approval from HOD & Finance."
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                <span>Grade-wise Travel & Accommodation Entitlement Matrix</span>
              </Space>
            }
            extra={
              <Button type="primary" danger icon={<AlertOutlined />} onClick={() => setExceptionModalVisible(true)}>
                Request Policy Exception
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={entitlements}
              rowKey="entitlementId"
              loading={loading}
              pagination={false}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#fa8c16' }} />
                <span>City Tier Classification & Daily Allowance Slabs</span>
              </Space>
            }
          >
            <Paragraph>
              <strong>Metro Cities:</strong> Mumbai, Delhi NCR, Bangalore, Chennai, Kolkata, Hyderabad, Pune.<br />
              <strong>Tier-1 Cities:</strong> Ahmedabad, Jaipur, Lucknow, Chandigarh, Surat, Kochi.<br />
              <strong>Tier-2 Cities:</strong> All other domestic locations.<br />
              <strong>International:</strong> Country-specific per-diem rules apply (USD/EUR slabs).
            </Paragraph>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title={
              <Space>
                <GlobalOutlined style={{ color: '#1890ff' }} />
                <span>International Travel Compliance Rules</span>
              </Space>
            }
          >
            <Paragraph>
              • Passport validity must be minimum 6 months from travel date.<br />
              • Mandatory 15-day advance request window for visa processing.<br />
              • Forex advance requests capped per country daily limit.<br />
              • Auto-linked international travel insurance policy issuance.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* Edit Policy Modal */}
      <Modal
        title="Configure Entitlement Matrix"
        open={editModalVisible}
        onOk={handleSaveEntitlement}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="gradeBand" label="Grade Band" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="flightClass" label="Flight Class" rules={[{ required: true }]}>
            <Select options={[
              { value: 'Economy', label: 'Economy' },
              { value: 'Premium Economy', label: 'Premium Economy' },
              { value: 'Business', label: 'Business Class' }
            ]} />
          </Form.Item>
          <Form.Item name="trainClass" label="Train Class" rules={[{ required: true }]}>
            <Select options={[
              { value: 'AC 3-Tier', label: 'AC 3-Tier' },
              { value: 'AC 2-Tier', label: 'AC 2-Tier' },
              { value: 'AC 1st Class', label: 'AC 1st Class' }
            ]} />
          </Form.Item>
          <Form.Item name="hotelCategory" label="Hotel Category" rules={[{ required: true }]}>
            <Select options={[
              { value: '3-Star', label: '3-Star Hotel' },
              { value: '4-Star', label: '4-Star Hotel' },
              { value: '5-Star', label: '5-Star Hotel' },
              { value: '5-Star Luxury', label: '5-Star Luxury' }
            ]} />
          </Form.Item>
          <Form.Item name="daMetro" label="Daily Allowance (Metro ₹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="daNonMetro" label="Daily Allowance (Non-Metro ₹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Policy Exception Request Modal */}
      <Modal
        title="Request Policy Exception"
        open={exceptionModalVisible}
        onOk={handleRequestException}
        onCancel={() => setExceptionModalVisible(false)}
      >
        <Form form={exceptionForm} layout="vertical">
          <Form.Item name="travelRequestId" label="Travel Request Reference" rules={[{ required: true }]}>
            <Input placeholder="Enter Travel Request ID (e.g., TR-2024-0001)" />
          </Form.Item>
          <Form.Item name="entitledCategory" label="Entitled Category" rules={[{ required: true }]}>
            <Input placeholder="e.g. Economy Class / 3-Star Hotel" />
          </Form.Item>
          <Form.Item name="requestedCategory" label="Requested Category" rules={[{ required: true }]}>
            <Input placeholder="e.g. Premium Economy / 4-Star Hotel" />
          </Form.Item>
          <Form.Item name="additionalCostImpact" label="Additional Cost Impact (₹)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="4500" />
          </Form.Item>
          <Form.Item name="reason" label="Justification for Policy Exception" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="e.g. No economy seats available for emergency business travel" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
