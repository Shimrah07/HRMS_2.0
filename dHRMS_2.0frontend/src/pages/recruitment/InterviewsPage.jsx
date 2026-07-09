import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input, DatePicker, Select,
  message, Row, Col, Typography, InputNumber, Divider, Badge, Avatar, Descriptions
} from 'antd'
import {
  CalendarOutlined, PlusOutlined, EditOutlined, CheckCircleOutlined,
  CloseCircleOutlined, InfoCircleOutlined, UserOutlined, VideoCameraOutlined,
  HomeOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { recruitmentService } from '../../services/recruitmentService'
import { employeeService } from '../../services/employeeService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import useUIStore from '../../store/uiStore'

const { Option } = Select
const { Text, Title, Paragraph } = Typography

const INTERVIEW_ROUND_TYPES = [
  { value: 'Technical', label: 'Technical Assessment' },
  { value: 'Managerial', label: 'Manager Review' },
  { value: 'HR', label: 'HR Discussion' },
  { value: 'CultureFit', label: 'Culture & Fitment' }
]

const getStatusTag = (status) => {
  switch (status) {
    case 'Scheduled': return <Tag color="blue">Scheduled</Tag>
    case 'Completed': return <Tag color="success">Completed</Tag>
    case 'Cancelled': return <Tag color="error">Cancelled</Tag>
    default: return <Tag>{status}</Tag>
  }
}

export default function InterviewsPage() {
  const queryClient = useQueryClient()
  const { isDarkMode } = useUIStore()

  // Schedulers & feedback state
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [selectedRound, setSelectedRound] = useState(null)
  const [selectedPanelistId, setSelectedPanelistId] = useState(null)

  const [form] = Form.useForm()
  const [feedbackForm] = Form.useForm()
  const [scheduling, setScheduling] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  // Queries
  const { data: interviewsData, isLoading } = useQuery({
    queryKey: ['interviews-list'],
    queryFn: () => recruitmentService.getInterviews()
  })

  const { data: employeesData } = useQuery({
    queryKey: ['active-employees-lookup'],
    queryFn: () => employeeService.getEmployees({ pageSize: 1000, activeStatus: 'active' })
  })

  const { data: appsData } = useQuery({
    queryKey: ['all-active-applications'],
    queryFn: () => recruitmentService.getApplications()
  })

  const interviews = interviewsData?.data || []
  const employees = employeesData?.data || []
  const applications = appsData?.data || []

  // Table columns
  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (_, r) => {
        // Find matched application to display candidate name
        const matchedApp = applications.find(a => a.appId === r.appId)
        return (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <div>
              <span style={{ fontWeight: 600 }}>
                {matchedApp?.candidate?.firstName || 'Candidate'} {matchedApp?.candidate?.lastName || ''}
              </span>
              <div style={{ fontSize: 11, opacity: 0.45 }}>{matchedApp?.requisition?.jobTitle || 'Job Opening'}</div>
            </div>
          </Space>
        )
      }
    },
    { title: 'Round Name', dataIndex: 'roundName', key: 'roundName' },
    { title: 'Type', dataIndex: 'roundType', key: 'roundType', render: (v) => <Tag color="purple">{v}</Tag> },
    {
      title: 'Scheduled Date/Time',
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      render: (v) => dayjs(v).format('DD MMM YYYY, hh:mm A')
    },
    {
      title: 'Panelists',
      key: 'panelists',
      render: (_, r) => {
        if (!r.panelists || !r.panelists.length) return '-'
        return (
          <Space size={[4, 4]} wrap>
            {r.panelists.map(p => (
              <Tag key={p.panelistId} color={p.status === 'Submitted' ? 'success' : 'default'}>
                {p.employeeName} {p.rating != null && `(${p.rating}/5)`}
              </Tag>
            ))}
          </Space>
        )
      }
    },
    {
      title: 'Venue / Link',
      key: 'venue',
      render: (_, r) => r.meetingLink ? (
        <a href={r.meetingLink} target="_blank" rel="noreferrer">
          <VideoCameraOutlined /> Join Meeting
        </a>
      ) : (
        <span><HomeOutlined /> {r.venue || 'Office'}</span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => getStatusTag(v)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => {
        const pendingFeedbackPanelists = r.panelists?.filter(p => p.status !== 'Submitted') || []
        if (r.status === 'Cancelled' || pendingFeedbackPanelists.length === 0) return '-'

        return (
          <Button
            type="primary"
            ghost
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setSelectedRound(r)
              // Pick first pending panelist by default
              setSelectedPanelistId(pendingFeedbackPanelists[0].panelistId)
              setFeedbackOpen(true)
            }}
          >
            Submit Feedback
          </Button>
        )
      }
    }
  ]

  // Submit interview scheduling
  const handleSchedule = async (values) => {
    setScheduling(true)
    try {
      const payload = {
        appId: values.appId,
        roundName: values.roundName,
        roundType: values.roundType,
        scheduledAt: values.scheduledAt.format('YYYY-MM-DDTHH:mm:ssZ'),
        venue: values.venue || null,
        meetingLink: values.meetingLink || null,
        interviewerIds: values.interviewerIds
      }
      const res = await recruitmentService.createInterview(payload)
      if (res.success) {
        message.success('Interview round scheduled successfully.')
        setScheduleOpen(false)
        form.resetFields()
        queryClient.invalidateQueries({ queryKey: ['interviews-list'] })
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to schedule interview round.')
    } finally {
      setScheduling(false)
    }
  }

  // Submit Panelist Feedback evaluation
  const handleFeedbackSubmit = async (values) => {
    setSubmittingFeedback(true)
    try {
      const payload = {
        panelistId: selectedPanelistId,
        rating: values.rating,
        feedback: values.feedback
      }
      const res = await recruitmentService.submitInterviewFeedback(payload)
      if (res.success) {
        message.success('Interview panelist evaluation feedback submitted successfully.')
        setFeedbackOpen(false)
        feedbackForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['interviews-list'] })
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit panelist evaluation feedback.')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Interviews Hub"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment', path: '/recruitment' }, { label: 'Interviews' }]}
        subtitle="Manage upcoming panel reviews, track evaluator feedback, and confirm technical results."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setScheduleOpen(true)}
            style={{
              background: isDarkMode ? '#FAA71A' : '#11133F',
              borderColor: isDarkMode ? '#FAA71A' : '#11133F',
              color: isDarkMode ? '#11133F' : '#fff',
              borderRadius: 8,
              fontWeight: 600
            }}
          >
            Schedule Interview
          </Button>
        }
      />

      <Card
        style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 16 }}
        bodyStyle={{ padding: 20 }}
      >
        <Table
          columns={columns}
          dataSource={interviews}
          rowKey="roundId"
          loading={isLoading}
          locale={{ emptyText: <EmptyState title="No scheduled interviews found" /> }}
        />
      </Card>

      {/* Schedule Interview Modal */}
      <Modal
        title="Schedule Technical / Panel Interview"
        open={scheduleOpen}
        onCancel={() => setScheduleOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={scheduling}
        width={580}
      >
        <Form form={form} layout="vertical" onFinish={handleSchedule} style={{ marginTop: 16 }}>
          <Form.Item name="appId" label="Select Active Candidate Application" rules={[{ required: true, message: 'Please select candidate application' }]}>
            <Select placeholder="Select Candidate..." dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}>
              {applications
                .filter(a => !['Joined', 'Rejected', 'Withdrawn'].includes(a.currentStage))
                .map(app => (
                  <Option key={app.appId} value={app.appId}>
                    {app.candidate?.firstName} {app.candidate?.lastName} · {app.requisition?.jobTitle} (Stage: {app.currentStage})
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="roundName" label="Round Name" rules={[{ required: true, message: 'Round Name is required' }]}>
                <Input placeholder="e.g. Technical Round 1" style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="roundType" label="Round Type" rules={[{ required: true, message: 'Please select round type' }]}>
                <Select placeholder="Select Type" options={INTERVIEW_ROUND_TYPES} dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scheduledAt" label="Scheduled Date & Time" rules={[{ required: true, message: 'Scheduled time is required' }]}>
                <DatePicker showTime style={{ width: '100%', borderRadius: 6 }} format="YYYY-MM-DD HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="interviewerIds" label="Select Panelists (Employees)" rules={[{ required: true, message: 'At least one panelist is required' }]}>
                <Select
                  mode="multiple"
                  placeholder="Select Interviewers..."
                  optionFilterProp="children"
                  options={employees.map(e => ({ value: e.employeeId, label: `${e.firstName} ${e.lastName || ''}` }))}
                  dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="meetingLink" label="Online Meeting Link (Teams/Zoom/Meet)">
            <Input placeholder="https://teams.microsoft.com/l/meetup-join/..." prefix={<VideoCameraOutlined />} style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item name="venue" label="Physical Location (Office Room/Cabin)">
            <Input placeholder="e.g. Meeting Room 2B, Bangalore Office" prefix={<HomeOutlined />} style={{ borderRadius: 6 }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Submit Panel Feedback Modal */}
      <Modal
        title="Submit Panel Interview Feedback Evaluation"
        open={feedbackOpen}
        onCancel={() => setFeedbackOpen(false)}
        onOk={() => feedbackForm.submit()}
        confirmLoading={submittingFeedback}
      >
        {selectedRound && (
          <div style={{ marginTop: 16 }}>
            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Round Name">{selectedRound.roundName}</Descriptions.Item>
              <Descriptions.Item label="Type">{selectedRound.roundType}</Descriptions.Item>
              <Descriptions.Item label="Scheduled Time">{dayjs(selectedRound.scheduledAt).format('DD MMM YYYY, hh:mm A')}</Descriptions.Item>
            </Descriptions>

            <Form.Item label="Select Reviewing Panelist Member" required>
              <Select
                value={selectedPanelistId}
                onChange={v => setSelectedPanelistId(v)}
                dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}
              >
                {selectedRound.panelists
                  ?.filter(p => p.status !== 'Submitted')
                  .map(p => (
                    <Option key={p.panelistId} value={p.panelistId}>{p.employeeName}</Option>
                  ))}
              </Select>
            </Form.Item>

            <Form form={feedbackForm} layout="vertical" onFinish={handleFeedbackSubmit}>
              <Form.Item name="rating" label="Rating (1 to 5 Stars)" rules={[{ required: true, message: 'Rating is required' }]}>
                <InputNumber min={1} max={5} step={0.5} style={{ width: '100%', borderRadius: 6 }} placeholder="e.g. 4.5" />
              </Form.Item>

              <Form.Item name="feedback" label="Technical Evaluation Feedback Notes" rules={[{ required: true, message: 'Feedback notes are required' }]}>
                <Input.TextArea rows={4} placeholder="Describe technical performance, strength areas, weaknesses, coding assessments..." style={{ borderRadius: 6 }} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
