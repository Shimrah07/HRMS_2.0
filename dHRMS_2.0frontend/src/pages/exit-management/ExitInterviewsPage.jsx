import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Rate, Row, Col, Statistic, Space, Drawer, message, Typography, Tooltip, Alert } from 'antd'
import { CommentOutlined, StarOutlined, SmileOutlined, FrownOutlined, LockOutlined, FilterOutlined, PieChartOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import exitService from '../../services/exitService'

const { Option } = Select
const { Text } = Typography

export default function ExitInterviewsPage() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [interviewModalOpen, setInterviewModalOpen] = useState(false)
  const [selectedExit, setSelectedExit] = useState(null)
  const [reasonFilter, setReasonFilter] = useState('')
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await exitService.getExitRecords({ page: 1, pageSize: 50 })
      setRecords(res.items || [])
      const analyticsRes = await exitService.getInterviewAnalytics()
      setAnalytics(analyticsRes)
    } catch (err) {
      console.error(err)
      message.error('Failed to load exit interviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmitInterview = async (values) => {
    if (!selectedExit) return
    try {
      await exitService.submitExitInterview(selectedExit.exitId, values)
      message.success('Exit interview feedback submitted successfully')
      setInterviewModalOpen(false)
      form.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to submit exit interview')
    }
  }

  const filteredRecords = reasonFilter
    ? records.filter(r => r.primaryReason?.toLowerCase().includes(reasonFilter.toLowerCase()))
    : records

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
      title: 'Reason for Leaving',
      dataIndex: 'primaryReason',
      key: 'primaryReason',
      render: (reason) => <Tag color="orange">{reason || 'Better Opportunity'}</Tag>
    },
    {
      title: 'Regretted Attrition',
      dataIndex: 'isRegretted',
      key: 'isRegretted',
      render: (reg) => reg ? <Tag color="error">Regretted Exit</Tag> : <Tag color="default">Non-Regretted</Tag>
    },
    {
      title: 'Overall Rating',
      key: 'overallRating',
      render: (_, record) => record.exitInterview?.overallRating ? <Rate disabled value={record.exitInterview.overallRating} style={{ fontSize: 14 }} /> : <Text type="secondary">Pending</Text>
    },
    {
      title: 'Would Recommend?',
      key: 'recommend',
      render: (_, record) => record.exitInterview?.wouldRecommend ? <Tag color="blue">{record.exitInterview.wouldRecommend}</Tag> : '-'
    },
    {
      title: 'Confidential Notes',
      key: 'hrNotes',
      render: (_, record) => record.exitInterview?.hrConfidentialNotes ? (
        <Tooltip title={record.exitInterview.hrConfidentialNotes}>
          <Tag icon={<LockOutlined />} color="purple">HR Confidential</Tag>
        </Tooltip>
      ) : <Text type="secondary">-</Text>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          icon={<CommentOutlined />}
          onClick={() => {
            setSelectedExit(record)
            const existing = record.exitInterview
            form.setFieldsValue({
              interviewMode: existing?.interviewMode || 'Online Self-Service Form',
              overallRating: existing?.overallRating || 5,
              managerRating: existing?.managerRating || 5,
              growthRating: existing?.growthRating || 5,
              compRating: existing?.compRating || 5,
              workLifeBalanceRating: existing?.workLifeBalanceRating || 5,
              wouldRecommend: existing?.wouldRecommend || 'Definitely Yes',
              openFeedback: existing?.openFeedback || '',
              hrConfidentialNotes: existing?.hrConfidentialNotes || ''
            })
            setInterviewModalOpen(true)
          }}
        >
          {record.exitInterview ? 'Edit Feedback' : 'Conduct Interview'}
        </Button>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Exit Interview Management & Sentiment Analytics"
        subtitle="Structured exit feedback engine, rating metrics, manager sentiment analysis, and HR confidential retention notes"
        breadcrumbs={[
          { title: 'Home', href: '/dashboard' },
          { title: 'Exit Management' },
          { title: 'Exit Interviews' }
        ]}
      />

      {/* Analytics Statistic Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Avg Overall Experience" value={analytics?.avgOverallRating || 4.2} precision={1} prefix={<StarOutlined style={{ color: '#FAA71A' }} />} suffix="/ 5" />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Avg Manager Rating" value={analytics?.avgManagerRating || 4.5} precision={1} prefix={<SmileOutlined style={{ color: '#52c41a' }} />} suffix="/ 5" />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Avg Growth Rating" value={analytics?.avgGrowthRating || 3.8} precision={1} prefix={<StarOutlined style={{ color: '#1890ff' }} />} suffix="/ 5" />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="glass-card">
            <Statistic title="Avg Comp & Benefits" value={analytics?.avgCompRating || 3.4} precision={1} prefix={<FrownOutlined style={{ color: '#722ed1' }} />} suffix="/ 5" />
          </Card>
        </Col>
      </Row>

      {/* Exit Feedback Master Pipeline */}
      <Card
        title="Exit Interview Feedback Dashboard & Questionnaires"
        extra={
          <Space>
            <FilterOutlined style={{ color: '#8c8c8c' }} />
            <Input
              placeholder="Search by Reason for Leaving..."
              allowClear
              style={{ width: 250 }}
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
            />
          </Space>
        }
      >
        <Table columns={columns} dataSource={filteredRecords} rowKey="exitId" loading={loading} />
      </Card>

      {/* Conduct Exit Interview Modal */}
      <Modal
        title={`Conduct Exit Interview — ${selectedExit?.employeeName || ''}`}
        open={interviewModalOpen}
        width={650}
        onCancel={() => setInterviewModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitInterview}>
          <Alert message="Feedback captured here feeds directly into company attrition analytics and retention trend reporting." type="info" showIcon style={{ marginBottom: 16 }} />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="interviewMode" label="Interview Mode" rules={[{ required: true }]}>
                <Select>
                  <Option value="Online Self-Service Form">Online Self-Service Form</Option>
                  <Option value="1:1 with HR">1:1 Discussion with HR</Option>
                  <Option value="Skip Level Discussion">Skip Level Discussion with Executive</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="wouldRecommend" label="Would Recommend Company to Others?" rules={[{ required: true }]}>
                <Select>
                  <Option value="Definitely Yes">Definitely Yes</Option>
                  <Option value="Probably Yes">Probably Yes</Option>
                  <Option value="Probably Not">Probably Not</Option>
                  <Option value="Definitely Not">Definitely Not</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Card title="Quantitative Category Ratings" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="overallRating" label="Overall Experience Rating" rules={[{ required: true }]}>
                  <Rate />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="managerRating" label="Reporting Manager Relationship" rules={[{ required: true }]}>
                  <Rate />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="growthRating" label="Growth & Career Opportunities" rules={[{ required: true }]}>
                  <Rate />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="compRating" label="Compensation & Benefits" rules={[{ required: true }]}>
                  <Rate />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="workLifeBalanceRating" label="Work-Life Balance" rules={[{ required: true }]}>
                  <Rate />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item name="openFeedback" label="What could we have done differently? (Employee Feedback)">
            <Input.TextArea rows={3} placeholder="Open feedback, suggestions for workplace improvement, culture, tools..." />
          </Form.Item>

          <Form.Item name="hrConfidentialNotes" label="HR Confidential Notes & Root Cause Analysis (Visible only to HR)">
            <Input.TextArea rows={3} placeholder="HR internal observations, real reasons behind exit, counter-offer response feedback..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
