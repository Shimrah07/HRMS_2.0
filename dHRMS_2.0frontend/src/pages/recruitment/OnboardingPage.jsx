import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Drawer, Row, Col, Select, Form, Input, message, Tabs, Badge, Progress } from 'antd'
import { UserOutlined, ClockCircleOutlined, SettingOutlined, SolutionOutlined, IdcardOutlined, DesktopOutlined, CheckCircleOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import Timeline from '../../components/common/Timeline'
import TaskBoard from '../../components/common/TaskBoard'
import ProgressCards from '../../components/common/ProgressCards'
import ApprovalTimeline from '../../components/common/ApprovalTimeline'
import { recruitmentService } from '../../services/recruitmentService'
import { employeeService } from '../../services/employeeService'
import { PERMISSIONS } from '../../constants/permissions'
import PermissionGate from '../../components/common/PermissionGate'

const { Option } = Select
const { TabPane } = Tabs

export default function OnboardingPage() {
  const [onboardings, setOnboardings] = useState([])
  const [employeesList, setEmployeesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOnboarding, setSelectedOnboarding] = useState(null)
  const [tasks, setTasks] = useState([])

  const [buddyForm] = Form.useForm()

  const fetchOnboardings = async () => {
    setLoading(true)
    try {
      const res = await recruitmentService.getOnboardings()
      if (res.success) {
        setOnboardings(res.data)
      }
    } catch (e) {
      message.error('Failed to load onboardings.')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await employeeService.getEmployees()
      if (res.success) {
        setEmployeesList(res.data)
      }
    } catch (e) {}
  }

  useEffect(() => {
    fetchOnboardings()
    fetchEmployees()
  }, [])

  const handleSelectOnboarding = async (record) => {
    setSelectedOnboarding(record)
    setDetailOpen(true)
    try {
      const res = await recruitmentService.getOnboardingTasks(record.onboardingId)
      if (res.success) {
        setTasks(res.data)
      }
      buddyForm.setFieldsValue({
        buddyEmployeeId: record.buddyEmployeeId,
        assetAllocation: record.assetAllocation,
        inductionSchedule: record.inductionSchedule
      })
    } catch (e) {
      message.error('Failed to fetch onboarding tasks.')
    }
  }

  const handleUpdateTask = async (taskId, payload) => {
    try {
      const res = await recruitmentService.updateOnboardingTask(taskId, payload)
      if (res.success) {
        message.success('Task status updated.')
        // Reload tasks and progress
        if (selectedOnboarding) {
          const tasksRes = await recruitmentService.getOnboardingTasks(selectedOnboarding.onboardingId)
          if (tasksRes.success) setTasks(tasksRes.data)
          
          const detailsRes = await recruitmentService.getOnboarding(selectedOnboarding.onboardingId)
          if (detailsRes.success) setSelectedOnboarding(detailsRes.data)
        }
        fetchOnboardings()
      }
    } catch (err) {
      message.error('Failed to update task status.')
    }
  }

  const handleAssignBuddyAsset = async (values) => {
    try {
      const res = await recruitmentService.assignBuddyAsset(selectedOnboarding.onboardingId, values)
      if (res.success) {
        message.success('Buddy and day-1 instructions updated.')
        setSelectedOnboarding(res.data)
        fetchOnboardings()
      }
    } catch (err) {
      message.error('Failed to update details.')
    }
  }

  const handleConvert = async () => {
    try {
      const res = await recruitmentService.convertToEmployee(selectedOnboarding.onboardingId)
      if (res.success) {
        message.success('Candidate successfully converted to Employee Master!')
        setDetailOpen(false)
        fetchOnboardings()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to complete employee conversion.')
    }
  }

  const getTimelineItems = (proc) => {
    if (!proc) return []
    const hist = proc.transitionHistoryJson ? JSON.parse(proc.transitionHistoryJson) : []
    
    // Default steps
    return [
      { title: 'Offer Released', description: 'HR released job offer letter.', status: 'completed', date: new Date(proc.createdAt).toLocaleDateString() },
      { title: 'Offer Accepted', description: 'Candidate accepted the job offer.', status: 'completed' },
      { title: 'Background Verification', description: 'Identity, criminal, academic, and references checks.', status: proc.status === 'Completed' ? 'completed' : 'inprogress' },
      { title: 'Pre-Onboarding Setup', description: 'Allocate seating, generate accounts, prepare workspace.', status: proc.progress?.overallProgress >= 70 ? 'completed' : 'inprogress' },
      { title: 'Joined & Employee Master', description: 'Day 1 onboarding conversion to Employee Master.', status: proc.status === 'Completed' ? 'completed' : 'pending' }
    ]
  }

  const columns = [
    {
      title: 'Candidate Name',
      dataIndex: 'candidateName',
      key: 'candidateName',
      render: (text) => <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{text}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Completed' ? 'green' : 'blue'} style={{ borderRadius: 4 }}>
          {status === 'Completed' ? 'Joined' : 'Onboarding'}
        </Tag>
      )
    },
    {
      title: 'Onboarding Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => (
        <Space style={{ width: 180 }}>
          <Progress percent={Math.round(progress?.overallProgress ?? 0)} size="small" strokeColor="#FAA71A" trailColor="rgba(255,255,255,0.06)" />
        </Space>
      )
    },
    {
      title: 'Buddy Assigned',
      dataIndex: 'buddyName',
      key: 'buddyName',
      render: (buddy) => <span style={{ color: 'rgba(255,255,255,0.65)' }}>{buddy || 'Not Assigned'}</span>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="primary" onClick={() => handleSelectOnboarding(record)}>
          Manage
        </Button>
      )
    }
  ]

  const history = selectedOnboarding?.transitionHistoryJson ? JSON.parse(selectedOnboarding.transitionHistoryJson) : []

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Employee Onboarding Engine"
        subtitle="Manage background verification, allocate Day-1 resources, and convert prejoining candidates into Employee Master."
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
          dataSource={onboardings}
          rowKey="onboardingId"
          loading={loading}
          pagination={{ pageSize: 8 }}
          className="hrms-table"
        />
      </Card>

      {/* Details & Management Drawer */}
      <Drawer
        title={
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
            Onboarding: {selectedOnboarding?.candidateName}
          </span>
        }
        width={750}
        onClose={() => setDetailOpen(false)}
        open={detailOpen}
        destroyOnClose
        style={{ background: '#0e0f27', color: '#fff' }}
      >
        {selectedOnboarding && (
          <div>
            {/* Progress cards */}
            <ProgressCards progress={selectedOnboarding.progress || {}} />

            <Tabs defaultActiveKey="timeline">
              <TabPane tab="Workflow Timeline" key="timeline">
                <Timeline items={getTimelineItems(selectedOnboarding)} current={selectedOnboarding.status === 'Completed' ? 5 : 2} />
              </TabPane>

              <TabPane tab="Department Task Board" key="tasks">
                <div style={{ marginBottom: 12, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                  Drag-n-drop task states dynamically or update statuses to progress the SLA metrics.
                </div>
                <TaskBoard tasks={tasks} onUpdateTask={handleUpdateTask} canEdit={selectedOnboarding.status !== 'Completed'} />
              </TabPane>

              <TabPane tab="Day-1 Provisioning" key="buddy">
                <Card
                  style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 8 }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Form form={buddyForm} layout="vertical" onFinish={handleAssignBuddyAsset} disabled={selectedOnboarding.status === 'Completed'}>
                    <Form.Item name="buddyEmployeeId" label="Assign Onboarding Peer Buddy">
                      <Select placeholder="Choose Buddy..." dropdownStyle={{ background: '#1c1e3d' }}>
                        {employeesList.map(e => (
                          <Option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName} ({e.employeeCode})</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item name="assetAllocation" label="Workspace Seat & Hardware Allocations">
                      <Input.TextArea placeholder="e.g. Desk: Wing B-402, Laptop: ThinkPad T14" rows={2} style={{ background: 'rgba(255,255,255,0.04)', color: '#fff' }} />
                    </Form.Item>

                    <Form.Item name="inductionSchedule" label="Induction & Orientation Schedule">
                      <Input.TextArea placeholder="e.g. Day 1, 10:00 AM Orientation Room 2" rows={2} style={{ background: 'rgba(255,255,255,0.04)', color: '#fff' }} />
                    </Form.Item>

                    {selectedOnboarding.status !== 'Completed' && (
                      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Button type="primary" htmlType="submit" style={{ background: '#FAA71A', borderColor: '#FAA71A' }}>
                          Save Assignment
                        </Button>
                      </Form.Item>
                    )}
                  </Form>
                </Card>
              </TabPane>

              <TabPane tab="Audit Logs" key="audit">
                <ApprovalTimeline history={history} />
              </TabPane>
            </Tabs>

            {/* Convert to employee panel */}
            {selectedOnboarding.status !== 'Completed' && (
              <div style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(82,196,26,0.05)',
                padding: 16,
                borderRadius: 8,
                border: '1px dashed rgba(82,196,26,0.2)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#52c41a', fontSize: 13.5 }}>
                    Convert Candidate to Employee Master
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5, marginTop: 2 }}>
                    This action closes onboarding, creates the core Employee record, and initiates the 30-60-90 review cycle.
                  </div>
                </div>
                <PermissionGate permission={PERMISSIONS.RECRUITMENT.EDIT}>
                  <Button
                    type="primary"
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    icon={<CheckCircleOutlined />}
                    disabled={(selectedOnboarding.progress?.overallProgress ?? 0) < 60}
                    onClick={handleConvert}
                  >
                    Complete Onboard
                  </Button>
                </PermissionGate>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
