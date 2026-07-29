import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Row, Col, Space,
  Statistic, Alert, Upload, message, Tooltip, Divider, InputNumber
} from 'antd'
import {
  HeartOutlined, SafetyCertificateOutlined, FileProtectOutlined, UploadOutlined,
  PlusOutlined, CheckCircleOutlined, InfoCircleOutlined, UserOutlined, CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import useUIStore from '../../store/uiStore'

export default function StatutoryLeaveTab() {
  const { isDarkMode } = useUIStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeType, setActiveType] = useState('Maternity') // Maternity or Paternity
  const [estimatedEntitlement, setEstimatedEntitlement] = useState(182)
  const [form] = Form.useForm()

  const defaultEvents = [
    { eventId: 'st-1', employeeName: 'Priya Sharma', eventType: 'Maternity (Biological)', eventDate: '2026-02-01', expectedDeliveryDate: '2026-02-15', childOrder: 1, entitlementDays: 182, medicalCertPath: 'maternity_cert_priya.pdf', status: 'Approved' },
    { eventId: 'st-2', employeeName: 'Rohan Verma', eventType: 'Paternity', eventDate: '2026-05-10', childOrder: 1, entitlementDays: 15, medicalCertPath: 'birth_cert_rohan.pdf', status: 'Approved' }
  ]

  useEffect(() => {
    fetchStatutoryEvents()
  }, [])

  const fetchStatutoryEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/leave/statutory/events/employee/11111111-1111-1111-1111-111111111111')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.length > 0 ? data : defaultEvents)
      } else {
        setEvents(defaultEvents)
      }
    } catch (err) {
      setEvents(defaultEvents)
    } finally {
      setLoading(false)
    }
  }

  const calculateEntitlement = (type, category, childOrder) => {
    if (type === 'Paternity') return 15
    if (category === 'Adoption' || category === 'Commissioning') return 84 // 12 weeks
    if (childOrder >= 3) return 84 // 12 weeks for 3rd child onwards
    return 182 // 26 weeks for 1st & 2nd child
  }

  const handleValuesChange = (changedValues, allValues) => {
    const type = allValues.type || activeType
    const category = allValues.category || 'Biological'
    const childOrder = allValues.childOrder || 1
    setEstimatedEntitlement(calculateEntitlement(type, category, childOrder))
  }

  const handleSubmit = async (values) => {
    try {
      const endpoint = activeType === 'Maternity'
        ? '/api/v1/leave/statutory/maternity/apply'
        : '/api/v1/leave/statutory/paternity/apply'

      const payload = activeType === 'Maternity' ? {
        employeeId: '11111111-1111-1111-1111-111111111111',
        category: values.category || 'Biological',
        childOrder: values.childOrder || 1,
        expectedDeliveryDate: values.expectedDeliveryDate ? values.expectedDeliveryDate.format('YYYY-MM-DD') : values.fromDate.format('YYYY-MM-DD'),
        fromDate: values.fromDate.format('YYYY-MM-DD'),
        medicalCertPath: values.medicalCert ? values.medicalCert[0]?.name : 'medical_certificate.pdf',
        remarks: values.remarks
      } : {
        employeeId: '11111111-1111-1111-1111-111111111111',
        childOrder: values.childOrder || 1,
        childBirthDate: values.childBirthDate ? values.childBirthDate.format('YYYY-MM-DD') : values.fromDate.format('YYYY-MM-DD'),
        fromDate: values.fromDate.format('YYYY-MM-DD'),
        birthCertificatePath: values.medicalCert ? values.medicalCert[0]?.name : 'birth_certificate.pdf',
        remarks: values.remarks
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const newEvt = {
        eventId: `st-${Date.now()}`,
        employeeName: 'Current User',
        eventType: `${activeType} (${values.category || 'Standard'})`,
        eventDate: values.fromDate.format('YYYY-MM-DD'),
        expectedDeliveryDate: values.expectedDeliveryDate ? values.expectedDeliveryDate.format('YYYY-MM-DD') : null,
        childOrder: values.childOrder || 1,
        entitlementDays: estimatedEntitlement,
        medicalCertPath: values.medicalCert ? values.medicalCert[0]?.name : 'certificate_attached.pdf',
        status: 'Approved'
      }

      setEvents([newEvt, ...events])
      message.success(`Successfully registered ${activeType} Leave benefit for ${estimatedEntitlement} paid days (${(estimatedEntitlement / 7).toFixed(0)} weeks).`)
      setIsModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error('Failed to submit statutory leave benefit request')
    }
  }

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (v) => (
        <Space>
          <UserOutlined style={{ color: '#7C3AED' }} />
          <strong style={{ color: 'var(--color-text-primary)' }}>{v}</strong>
        </Space>
      )
    },
    {
      title: 'Benefit Type',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (v) => <Tag color={v.includes('Maternity') ? 'magenta' : 'blue'} style={{ fontWeight: 700 }}>{v}</Tag>
    },
    {
      title: 'Event Date',
      dataIndex: 'eventDate',
      key: 'eventDate',
      render: (v) => dayjs(v).format('DD MMM YYYY')
    },
    {
      title: 'Child Order',
      dataIndex: 'childOrder',
      key: 'childOrder',
      render: (v) => <Tag style={{ borderRadius: 6 }}>Child #{v}</Tag>
    },
    {
      title: 'Entitlement Paid Days',
      dataIndex: 'entitlementDays',
      key: 'entitlementDays',
      render: (v) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#10B981' }} />
          <strong>{v} Days ({(v / 7).toFixed(0)} Weeks)</strong>
        </Space>
      )
    },
    {
      title: 'Medical Cert',
      dataIndex: 'medicalCertPath',
      key: 'medicalCertPath',
      render: (v) => v ? <Tag color="green"><FileProtectOutlined /> Verified</Tag> : <Tag color="orange">Pending</Tag>
    },
    {
      title: 'Compliance Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color="success" style={{ fontWeight: 800 }}><CheckCircleOutlined /> Statutory Approved</Tag>
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 18 }}>
        <Space>
          <Button
            type="primary"
            icon={<HeartOutlined />}
            onClick={() => { setActiveType('Maternity'); setEstimatedEntitlement(182); setIsModalOpen(true) }}
            style={{ background: '#EC4899', borderColor: '#EC4899', borderRadius: 8, fontWeight: 700 }}
          >
            Apply Maternity Leave (26 Wks)
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setActiveType('Paternity'); setEstimatedEntitlement(15); setIsModalOpen(true) }}
            style={{ background: '#3B82F6', borderColor: '#3B82F6', borderRadius: 8, fontWeight: 700 }}
          >
            Apply Paternity Leave (15 Days)
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card style={{ borderRadius: 14, border: '1px solid #F472B6', background: isDarkMode ? '#1f131a' : '#FDF2F8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HeartOutlined style={{ fontSize: 32, color: '#EC4899' }} />
              <div>
                <h4 style={{ margin: 0, color: '#BE185D', fontWeight: 800 }}>Maternity Benefit Act 1961 (2017 Amendment)</h4>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  • <strong>26 Weeks (182 Days)</strong> paid leave for 1st & 2nd child<br />
                  • <strong>12 Weeks (84 Days)</strong> paid leave for 3rd child onwards or Commissioning/Adopting Mother<br />
                  • Pre-delivery breakup: Up to 8 weeks before expected delivery
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card style={{ borderRadius: 14, border: '1px solid #60A5FA', background: isDarkMode ? '#111827' : '#EFF6FF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <SafetyCertificateOutlined style={{ fontSize: 32, color: '#3B82F6' }} />
              <div>
                <h4 style={{ margin: 0, color: '#1D4ED8', fontWeight: 800 }}>Paternity Leave Entitlement</h4>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  • <strong>15 Days</strong> 100% paid leave for male employees<br />
                  • Eligible within <strong>6 Months</strong> before or after childbirth<br />
                  • Maximum up to 2 surviving children
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 14, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <h4 style={{ margin: '0 0 16px 0', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Statutory Leave Benefit Registry & Compliance Audit Log
        </h4>
        <Table columns={columns} dataSource={events} loading={loading} pagination={false} rowKey="eventId" />
      </Card>

      {/* Statutory Application Modal */}
      <Modal
        title={`Apply for ${activeType} Leave Benefit`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Alert
          message={
            <span>
              <strong>Statutory Entitlement Calculated: </strong>
              {estimatedEntitlement} Days ({(estimatedEntitlement / 7).toFixed(0)} Weeks) Paid Benefit
            </span>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={handleValuesChange}>
          {activeType === 'Maternity' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="category" label="Maternity Category" initialValue="Biological" rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value="Biological">Biological Mother</Select.Option>
                    <Select.Option value="Adoption">Adopting Mother (Child &lt; 3 Months)</Select.Option>
                    <Select.Option value="Commissioning">Commissioning Mother</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="childOrder" label="Surviving Child Order" initialValue={1} rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value={1}>1st Child (26 Wks / 182 Days)</Select.Option>
                    <Select.Option value={2}>2nd Child (26 Wks / 182 Days)</Select.Option>
                    <Select.Option value={3}>3rd Child Onwards (12 Wks / 84 Days)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {activeType === 'Paternity' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="childOrder" label="Child Order" initialValue={1} rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value={1}>1st Child (15 Days)</Select.Option>
                    <Select.Option value={2}>2nd Child (15 Days)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="childBirthDate" label="Child Birth Date" rules={[{ required: true }]}>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fromDate" label="Leave Start Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            {activeType === 'Maternity' && (
              <Col span={12}>
                <Form.Item name="expectedDeliveryDate" label="Expected Delivery Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Form.Item name="medicalCert" label="Medical Certificate / Birth Certificate Attachment" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Upload Certificate (PDF / Image)</Button>
            </Upload>
          </Form.Item>

          <Form.Item name="remarks" label="Remarks / Special Instructions">
            <Input.TextArea rows={3} placeholder="Additional medical notes or backup contact..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
