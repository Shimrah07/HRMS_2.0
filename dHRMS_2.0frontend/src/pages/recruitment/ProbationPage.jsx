import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Drawer, Form, Select, Input, message, Progress, Tabs, Modal, InputNumber } from 'antd'
import { CheckCircleOutlined, UserOutlined, WarningOutlined, SyncOutlined, SendOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import { recruitmentService } from '../../services/recruitmentService'
import { PERMISSIONS } from '../../constants/permissions'
import PermissionGate from '../../components/common/PermissionGate'

const { Option } = Select

export default function ProbationPage() {
  const [probationers, setProbationers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedProbationer, setSelectedProbationer] = useState(null)
  
  // Drawer & Review Modal states
  const [reviewsOpen, setReviewsOpen] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  const [reviewForm] = Form.useForm()
  const [confirmForm] = Form.useForm()

  const fetchProbationers = async () => {
    setLoading(true)
    try {
      const res = await recruitmentService.getProbationList()
      if (res.success) {
        setProbationers(res.data)
      }
    } catch (e) {
      message.error('Failed to load probationers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProbationers()
  }, [])

  const handleOpenReviews = async (record) => {
    setSelectedProbationer(record)
    setReviewsOpen(true)
    await loadReviews(record.employeeId)
  }

  const loadReviews = async (empId) => {
    try {
      const res = await recruitmentService.getProbationReviews(empId)
      if (res.success) {
        setReviews(res.data)
      }
    } catch (e) {
      message.error('Failed to fetch reviews checklist.')
    }
  }

  const handleSubmitReview = async (values) => {
    try {
      const res = await recruitmentService.submitProbationReview(selectedReview.reviewId, values)
      if (res.success) {
        message.success('Review checkpoint submitted successfully.')
        setReviewModalOpen(false)
        reviewForm.resetFields()
        if (selectedProbationer) {
          loadReviews(selectedProbationer.employeeId)
        }
        fetchProbationers()
      }
    } catch (err) {
      message.error('Failed to submit review.')
    }
  }

  const handleConfirmProbation = async (values) => {
    try {
      const res = await recruitmentService.confirmProbation(selectedProbationer.employeeId, values)
      if (res.success) {
        message.success('Employee probation lifecycle action executed successfully.')
        setConfirmModalOpen(false)
        setReviewsOpen(false)
        confirmForm.resetFields()
        fetchProbationers()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to complete probation action.')
    }
  }

  const getRemainingDays = (end) => {
    if (!end) return 0
    const diff = new Date(end) - new Date()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  const getProgressPercent = (joining, end) => {
    if (!joining || !end) return 0
    const total = new Date(end) - new Date(joining)
    const passed = new Date() - new Date(joining)
    const pct = Math.round((passed / total) * 100)
    return pct > 100 ? 100 : pct < 0 ? 0 : pct
  }

  const columns = [
    {
      title: 'Employee Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
          {text} ({record.employeeCode})
        </span>
      )
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (text) => <span style={{ color: 'rgba(255,255,255,0.65)' }}>{text}</span>
    },
    {
      title: 'Designation',
      dataIndex: 'designationName',
      key: 'designationName',
      render: (text) => <span style={{ color: 'rgba(255,255,255,0.65)' }}>{text}</span>
    },
    {
      title: 'Probation Timeline',
      key: 'timeline',
      render: (_, record) => {
        const pct = getProgressPercent(record.joiningDate, record.probationEndDate)
        const daysLeft = getRemainingDays(record.probationEndDate)
        return (
          <Space direction="vertical" size={2} style={{ width: 180 }}>
            <Progress percent={pct} size="small" strokeColor="#FAA71A" trailColor="rgba(255,255,255,0.06)" />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
              {daysLeft} days remaining (Ends: {record.probationEndDate})
            </span>
          </Space>
        )
      }
    },
    {
      title: 'Checkpoints',
      key: 'checkpoints',
      render: (_, record) => (
        <Space>
          <Badge
            count={`${record.completedReviewsCount}/${record.totalReviewsCount}`}
            style={{
              backgroundColor: record.completedReviewsCount === record.totalReviewsCount ? '#52c41a' : '#faad14',
              color: '#fff',
              fontSize: 11
            }}
          />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>completed</span>
        </Space>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="primary" onClick={() => handleOpenReviews(record)}>
          Review
        </Button>
      )
    }
  ]

  const allReviewsDone = reviews.length > 0 && reviews.every(r => r.status === 'Completed')

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Probation Management & 30-60-90 Reviews"
        subtitle="Track employee probation review cycles and execute permanent confirmation, extensions, or separations."
      />

      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 12
        }}
        bodyStyle={{ padding: 18 }}
      >
        <Table
          columns={columns}
          dataSource={probationers}
          rowKey="employeeId"
          loading={loading}
          pagination={{ pageSize: 8 }}
          className="hrms-table"
        />
      </Card>

      {/* Reviews Checklist Drawer */}
      <Drawer
        title={
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
            Probation Reviews Checklist: {selectedProbationer?.name}
          </span>
        }
        width={680}
        onClose={() => setReviewsOpen(false)}
        open={reviewsOpen}
        destroyOnClose
        style={{ background: '#0e0f27', color: '#fff' }}
      >
        {selectedProbationer && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Joining Date</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedProbationer.joiningDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Probation Expiry</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#FAA71A' }}>{selectedProbationer.probationEndDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Department</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedProbationer.departmentName}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(rev => (
                <Card
                  key={rev.reviewId}
                  size="small"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 8
                  }}
                  title={
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                      Checkpoint: {rev.checkpointDays} Days Review
                    </span>
                  }
                  extra={
                    <Tag color={rev.status === 'Completed' ? 'green' : 'orange'}>
                      {rev.status}
                    </Tag>
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Due Date: {rev.reviewDueDate}</span>
                    {rev.completedDate && (
                      <span style={{ color: '#52c41a' }}>Completed On: {rev.completedDate}</span>
                    )}
                  </div>

                  {rev.status === 'Completed' ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 6 }}>
                      <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Rating:</span>
                        <span style={{ fontWeight: 600, color: '#FAA71A' }}>{rev.rating}</span>
                      </div>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>Comments:</span>{' '}
                        <span style={{ color: 'rgba(255,255,255,0.75)' }}>{rev.comments}</span>
                      </div>
                    </div>
                  ) : (
                    <PermissionGate permission={PERMISSIONS.RECRUITMENT.EDIT}>
                      <div style={{ textAlign: 'right', marginTop: 8 }}>
                        <Button
                          size="small"
                          type="primary"
                          icon={<SendOutlined />}
                          onClick={() => {
                            setSelectedReview(rev)
                            setReviewModalOpen(true)
                          }}
                        >
                          Submit Checkpoint
                        </Button>
                      </div>
                    </PermissionGate>
                  )}
                </Card>
              ))}
            </div>

            {/* Lifecycle action buttons confirmation panel */}
            <div style={{
              marginTop: 32,
              paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: allReviewsDone ? 'rgba(82,196,26,0.04)' : 'rgba(255,255,255,0.01)',
              padding: 16,
              borderRadius: 8,
              border: allReviewsDone ? '1px dashed rgba(82,196,26,0.2)' : '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div>
                <div style={{ fontWeight: 600, color: allReviewsDone ? '#52c41a' : 'rgba(255,255,255,0.85)', fontSize: 13.5 }}>
                  Execute Probation Lifecycle Action
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5, marginTop: 2 }}>
                  {!allReviewsDone 
                    ? 'All 30, 60, and 90-day review checkpoints must be completed before submitting confirmation.'
                    : 'All reviews are completed. You can now execute the final confirmation decision.'}
                </div>
              </div>
              <PermissionGate permission={PERMISSIONS.RECRUITMENT.EDIT}>
                <div style={{ textAlign: 'right' }}>
                  <Button
                    type="primary"
                    disabled={!allReviewsDone}
                    style={{ background: '#FAA71A', borderColor: '#FAA71A' }}
                    onClick={() => setConfirmModalOpen(true)}
                  >
                    Confirm / Transition Employee
                  </Button>
                </div>
              </PermissionGate>
            </div>
          </div>
        )}
      </Drawer>

      {/* Review Checkpoint Submission Modal */}
      <Modal
        title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>Submit Review Checkpoint</span>}
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleSubmitReview}>
          <Form.Item name="rating" label="Performance Rating" rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Choose rating..." dropdownStyle={{ background: '#1c1e3d' }}>
              <Option value="Meets Expectations">Meets Expectations</Option>
              <Option value="Needs Improvement">Needs Improvement</Option>
              <Option value="Unsatisfactory">Unsatisfactory</Option>
            </Select>
          </Form.Item>
          <Form.Item name="comments" label="Checkpoint Comments & Observations" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea rows={3} style={{ background: 'rgba(255,255,255,0.04)', color: '#fff' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReviewModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#FAA71A', borderColor: '#FAA71A' }}>
                Submit Checkpoint
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Final Confirmation Modal */}
      <Modal
        title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>Confirm Probation Transition</span>}
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={confirmForm} layout="vertical" onFinish={handleConfirmProbation}>
          <Form.Item name="action" label="Lifecycle Action Decision" rules={[{ required: true, message: 'Required' }]}>
            <Select placeholder="Choose action..." dropdownStyle={{ background: '#1c1e3d' }}>
              <Option value="Confirm">Confirm Employee (Set to Permanent, Send Welcome Letter)</Option>
              <Option value="Extend">Extend Probation period (Specify extension days)</Option>
              <Option value="Separate">Separate Employee (Exit / Terminate Employment)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.action !== curr.action}
          >
            {({ getFieldValue }) => getFieldValue('action') === 'Extend' && (
              <Form.Item name="extensionDays" label="Probation Extension Duration (Days)" rules={[{ required: true, message: 'Required' }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            )}
          </Form.Item>

          <Form.Item name="comments" label="Lifecycle Remarks & Final Evaluation Comments">
            <Input.TextArea rows={3} style={{ background: 'rgba(255,255,255,0.04)', color: '#fff' }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#FAA71A', borderColor: '#FAA71A' }}>
                Apply Lifecycle Action
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
