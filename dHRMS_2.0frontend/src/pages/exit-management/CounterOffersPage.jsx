import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Row, Col, Statistic, Space, message, Typography } from 'antd'
import { PlusOutlined, DollarOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import exitService from '../../services/exitService'

const { Option } = Select
const { Text } = Typography

export default function CounterOffersPage() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [selectedExit, setSelectedExit] = useState(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await exitService.getExitRecords({ page: 1, pageSize: 50 })
      setRecords(res.items || [])
    } catch (err) {
      console.error(err)
      message.error('Failed to load counter offer records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateOffer = async (values) => {
    if (!selectedExit) return
    try {
      await exitService.createCounterOffer(selectedExit.exitId, {
        proposedCtc: parseFloat(values.proposedCtc),
        otherConsiderations: values.otherConsiderations
      })
      message.success('Counter offer recorded successfully')
      setOfferModalOpen(false)
      form.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to record counter offer')
    }
  }

  const handleResponse = async (offerId, response) => {
    try {
      await exitService.respondToCounterOffer(offerId, { response })
      message.success(`Counter offer marked as ${response}`)
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to record response')
    }
  }

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.employeeCode} · {record.departmentName}</div>
        </div>
      )
    },
    {
      title: 'Resignation Reason',
      dataIndex: 'primaryReason',
      key: 'primaryReason'
    },
    {
      title: 'Counter Offers Made',
      key: 'offersCount',
      render: (_, record) => record.counterOffers?.length || 0
    },
    {
      title: 'Latest Proposed CTC',
      key: 'latestCtc',
      render: (_, record) => {
        const latest = record.counterOffers?.[0]
        return latest ? <Text type="success" style={{ fontWeight: 600 }}>₹{latest.proposedCtc?.toLocaleString('en-IN')}</Text> : '-'
      }
    },
    {
      title: 'Employee Response',
      key: 'response',
      render: (_, record) => {
        const latest = record.counterOffers?.[0]
        if (!latest) return <Tag>No Offer</Tag>
        switch (latest.employeeResponse) {
          case 'Accepted': return <Tag color="success">Accepted & Withdrawn</Tag>
          case 'Declined': return <Tag color="error">Declined</Tag>
          default: return <Tag color="warning">Pending Response</Tag>
        }
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const latest = record.counterOffers?.[0]
        return (
          <Space>
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedExit(record); setOfferModalOpen(true); }}>
              Propose Offer
            </Button>
            {latest && latest.employeeResponse === 'Pending' && (
              <>
                <Button size="small" type="primary" ghost icon={<CheckCircleOutlined />} onClick={() => handleResponse(latest.offerId, 'Accepted')}>
                  Accept
                </Button>
                <Button size="small" danger ghost icon={<CloseCircleOutlined />} onClick={() => handleResponse(latest.offerId, 'Declined')}>
                  Decline
                </Button>
              </>
            )}
          </Space>
        )
      }
    }
  ]

  const totalOffers = records.reduce((acc, r) => acc + (r.counterOffers?.length || 0), 0)
  const acceptedOffers = records.reduce((acc, r) => acc + (r.counterOffers?.filter(o => o.employeeResponse === 'Accepted').length || 0), 0)

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Counter Offer & Retention Workflow"
        subtitle="Track critical talent retention conversations, counter offer approvals, CTC revisions, and acceptance rates"
        breadcrumbs={[
          { title: 'Home', href: '/dashboard' },
          { title: 'Exit Management' },
          { title: 'Counter Offers' }
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Total Counter Offers" value={totalOffers} prefix={<DollarOutlined style={{ color: '#FAA71A' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Offers Accepted (Retained)" value={acceptedOffers} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Retention Rate" value={totalOffers ? Math.round((acceptedOffers / totalOffers) * 100) : 0} suffix="%" prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
      </Row>

      <Card title="Retention & Counter Offer Pipeline">
        <Table columns={columns} dataSource={records} rowKey="exitId" loading={loading} />
      </Card>

      <Modal
        title={`Propose Counter Offer — ${selectedExit?.employeeName || ''}`}
        open={offerModalOpen}
        onCancel={() => setOfferModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOffer}>
          <Form.Item name="proposedCtc" label="Proposed Revised CTC (₹)" rules={[{ required: true }]}>
            <Input type="number" placeholder="e.g. 2100000" />
          </Form.Item>
          <Form.Item name="otherConsiderations" label="Role / Designation / Benefit Revision">
            <Input.TextArea rows={3} placeholder="e.g. Promotion to Staff Engineer, flexible hybrid schedule, retention bonus" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
