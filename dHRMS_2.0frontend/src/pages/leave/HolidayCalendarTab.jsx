import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Row, Col, Space,
  Badge, Tooltip, message, Segmented, Popconfirm
} from 'antd'
import {
  CalendarOutlined, PlusOutlined, EnvironmentOutlined, DownloadOutlined,
  CheckCircleOutlined, StarOutlined, FlagOutlined, GlobalOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import useUIStore from '../../store/uiStore'

export default function HolidayCalendarTab() {
  const { isDarkMode } = useUIStore()
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('ALL')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [rhQuotaUsed, setRhQuotaUsed] = useState(1)
  const [addForm] = Form.useForm()

  const defaultHolidays = [
    { holidayId: 'h1', holidayDate: '2026-01-26', holidayName: 'Republic Day', holidayType: 'National', locationName: 'All Locations (Pan India)', isRestrictedHoliday: false, description: 'National Holiday celebrating Republic Day of India' },
    { holidayId: 'h2', holidayDate: '2026-03-25', holidayName: 'Holi', holidayType: 'Mandatory', locationName: 'All Locations (Pan India)', isRestrictedHoliday: false, description: 'Festival of Colors' },
    { holidayId: 'h3', holidayDate: '2026-04-14', holidayName: 'Dr. B.R. Ambedkar Jayanti', holidayType: 'Mandatory', locationName: 'All Locations (Pan India)', isRestrictedHoliday: false, description: 'Ambedkar Jayanti' },
    { holidayId: 'h4', holidayDate: '2026-05-01', holidayName: 'Maharashtra Day', holidayType: 'State', locationName: 'Mumbai HQ', stateCode: 'MH', isRestrictedHoliday: false, description: 'Maharashtra Foundation Day' },
    { holidayId: 'h5', holidayDate: '2026-08-15', holidayName: 'Independence Day', holidayType: 'National', locationName: 'All Locations (Pan India)', isRestrictedHoliday: false, description: 'National Holiday celebrating Independence Day' },
    { holidayId: 'h6', holidayDate: '2026-09-07', holidayName: 'Ganesh Chaturthi', holidayType: 'Optional', locationName: 'All Locations (Pan India)', isRestrictedHoliday: true, description: 'Restricted Optional Holiday' },
    { holidayId: 'h7', holidayDate: '2026-10-02', holidayName: 'Mahatma Gandhi Jayanti', holidayType: 'National', locationName: 'All Locations (Pan India)', isRestrictedHoliday: false, description: 'National Holiday honoring Mahatma Gandhi' },
    { holidayId: 'h8', holidayDate: '2026-10-24', holidayName: 'Dussehra (Vijayadashami)', holidayType: 'Mandatory', locationName: 'All Locations (Pan India)', isRestrictedHoliday: false, description: 'Victory of Good over Evil' },
    { holidayId: 'h9', holidayDate: '2026-11-01', holidayName: 'Kannada Rajyotsava', holidayType: 'State', locationName: 'Bengaluru Hub', stateCode: 'KA', isRestrictedHoliday: false, description: 'Karnataka State Day' },
    { holidayId: 'h10', holidayDate: '2026-11-12', holidayName: 'Diwali (Deepavali)', holidayType: 'Mandatory', locationName: 'All Locations (Pan India)', isRestrictedHoliday: false, description: 'Festival of Lights' },
    { holidayId: 'h11', holidayDate: '2026-12-25', holidayName: 'Christmas Day', holidayType: 'Mandatory', locationName: 'All Locations (Pan India)', isRestrictedHoliday: false, description: 'Christmas Celebration' }
  ]

  useEffect(() => {
    fetchHolidays()
  }, [selectedLocation])

  const fetchHolidays = async () => {
    setLoading(true)
    try {
      const locQuery = selectedLocation !== 'ALL' ? `&locationId=${selectedLocation}` : ''
      const res = await fetch(`/api/v1/leave/holidays?companyId=11111111-1111-1111-1111-111111111111&year=2026${locQuery}`)
      if (res.ok) {
        const data = await res.json()
        setHolidays(data.length > 0 ? data : defaultHolidays)
      } else {
        setHolidays(defaultHolidays)
      }
    } catch (err) {
      setHolidays(defaultHolidays)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOptional = async (record) => {
    if (rhQuotaUsed >= 2) {
      message.error('Maximum quota of 2 Restricted / Optional Holidays per year reached!')
      return
    }

    try {
      const res = await fetch(`/api/v1/leave/holidays/select-optional?employeeId=11111111-1111-1111-1111-111111111111&holidayId=${record.holidayId}`, { method: 'POST' })
      if (res.ok) {
        message.success(`Selected optional holiday: ${record.holidayName}. Approved and added to leave history.`)
        setRhQuotaUsed(rhQuotaUsed + 1)
      } else {
        message.success(`Selected optional holiday: ${record.holidayName}. (Simulated RH Quota updated: ${rhQuotaUsed + 1}/2 used)`)
        setRhQuotaUsed(rhQuotaUsed + 1)
      }
    } catch (err) {
      message.success(`Selected optional holiday: ${record.holidayName}. (RH Quota: ${rhQuotaUsed + 1}/2)`)
      setRhQuotaUsed(rhQuotaUsed + 1)
    }
  }

  const handleExportICal = () => {
    window.open('/api/v1/leave/holidays/export-ical?year=2026', '_blank')
    message.success('Exporting iCal (.ics) Calendar Feed for Outlook/Google Calendar sync...')
  }

  const handleAddHolidaySubmit = (values) => {
    const newH = {
      holidayId: `h-${Date.now()}`,
      holidayDate: values.date.format('YYYY-MM-DD'),
      holidayName: values.name,
      holidayType: values.type,
      locationName: values.location || 'All Locations (Pan India)',
      isRestrictedHoliday: values.type === 'Optional',
      description: values.description
    }

    setHolidays([...holidays, newH])
    message.success(`Added holiday ${values.name} for ${values.date.format('DD MMM YYYY')}`)
    setIsAddModalOpen(false)
    addForm.resetFields()
  }

  const columns = [
    {
      title: 'Date & Day',
      dataIndex: 'holidayDate',
      key: 'holidayDate',
      render: (v) => {
        const d = dayjs(v)
        return (
          <Space>
            <CalendarOutlined style={{ color: '#7C3AED' }} />
            <div>
              <strong style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{d.format('DD MMM YYYY')}</strong>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{d.format('dddd')}</div>
            </div>
          </Space>
        )
      }
    },
    {
      title: 'Holiday Name',
      key: 'name',
      render: (_, r) => (
        <div>
          <strong style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{r.holidayName}</strong>
          {r.description && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.description}</div>}
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'holidayType',
      key: 'holidayType',
      render: (v) => {
        if (v === 'National') return <Tag color="gold" style={{ fontWeight: 800 }}><FlagOutlined /> National</Tag>
        if (v === 'State') return <Tag color="blue" style={{ fontWeight: 800 }}><EnvironmentOutlined /> State</Tag>
        if (v === 'Optional') return <Tag color="purple" style={{ fontWeight: 800 }}><StarOutlined /> Optional (RH)</Tag>
        return <Tag color="green" style={{ fontWeight: 800 }}><CheckCircleOutlined /> Mandatory</Tag>
      }
    },
    {
      title: 'Applicable Location',
      dataIndex: 'locationName',
      key: 'locationName',
      render: (v) => <Tag style={{ borderRadius: 6, fontWeight: 600 }}>{v || 'Pan India'}</Tag>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, r) => {
        if (r.holidayType === 'Optional' || r.isRestrictedHoliday) {
          return (
            <Button
              size="small"
              type="primary"
              icon={<StarOutlined />}
              disabled={rhQuotaUsed >= 2}
              onClick={() => handleSelectOptional(r)}
              style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 6 }}
            >
              Opt-In (RH)
            </Button>
          )
        }
        return <Tag color="default">Mandatory</Tag>
      }
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 18 }}>
        <Space>
          <Badge count={`RH Quota: ${2 - rhQuotaUsed} Left`} style={{ backgroundColor: '#10B981', fontWeight: 700 }} />
          <Button icon={<DownloadOutlined />} onClick={handleExportICal} style={{ borderRadius: 8 }}>
            Sync to Outlook (.ics)
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)} style={{ background: '#7C3AED', borderColor: '#7C3AED', borderRadius: 8, fontWeight: 700 }}>
            Add Holiday
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 14, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
        <Table columns={columns} dataSource={holidays} loading={loading} pagination={{ pageSize: 12 }} rowKey="holidayId" />
      </Card>

      {/* Add Holiday Modal */}
      <Modal
        title="Define Location Holiday"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={() => addForm.submit()}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddHolidaySubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Holiday Name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Maharashtra Day" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date" label="Holiday Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Holiday Category" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  <Select.Option value="Mandatory">Mandatory Holiday</Select.Option>
                  <Select.Option value="National">National Holiday</Select.Option>
                  <Select.Option value="State">State Holiday</Select.Option>
                  <Select.Option value="Optional">Restricted / Optional Holiday (RH)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="Applicable Location">
                <Select placeholder="All Locations if empty">
                  <Select.Option value="All Locations (Pan India)">All Locations (Pan India)</Select.Option>
                  <Select.Option value="Mumbai HQ">Mumbai HQ</Select.Option>
                  <Select.Option value="Bengaluru Hub">Bengaluru Tech Hub</Select.Option>
                  <Select.Option value="Delhi NCR">Delhi NCR Office</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Provide details or significance of the holiday..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
