import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Card, Avatar, Tag, Select, Space, Row, Col, Typography,
  message, Badge, Spin, Popover, Button, Modal, Input, Tooltip, Divider
} from 'antd'
import {
  UserOutlined, DragOutlined, TeamOutlined, GlobalOutlined,
  CalendarOutlined, TrophyOutlined, CheckCircleOutlined, StopOutlined, ExclamationCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { recruitmentService } from '../../services/recruitmentService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import useUIStore from '../../store/uiStore'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

// ATS Pipeline Columns Stages
const PIPELINE_COLUMNS = [
  { id: 'Applied', label: 'Applied', color: '#3B82F6' },
  { id: 'Screening', label: 'Screening', color: '#EAB308' },
  { id: 'Shortlisted', label: 'Shortlisted', color: '#A855F7' },
  { id: 'InterviewL1', label: 'L1 Interview', color: '#06B6D4' },
  { id: 'InterviewL2', label: 'L2 Interview', color: '#06B6D4' },
  { id: 'ManagerReview', label: 'Manager Review', color: '#14B8A6' },
  { id: 'HRInterview', label: 'HR Discussion', color: '#EC4899' },
  { id: 'Offer', label: 'Offer Stage', color: '#F97316' },
  { id: 'BackgroundCheck', label: 'BGV Verification', color: '#6366F1' },
  { id: 'Onboarding', label: 'Onboarding', color: '#8B5CF6' },
  { id: 'Joined', label: 'Joined', color: '#22C55E' },
  { id: 'Rejected', label: 'Rejected', color: '#EF4444' },
  { id: 'Withdrawn', label: 'Withdrawn', color: '#6B7280' }
]

// Drag-and-Drop valid transitions validator helper
const isValidTransition = (current, target) => {
  if (target === 'Rejected' || target === 'Withdrawn') return true // Can reject/withdraw from anywhere
  if (current === 'Joined') return false // Once joined, frozen

  switch (current) {
    case 'Applied':
      return target === 'Screening'
    case 'Screening':
      return target === 'Shortlisted' || target === 'Applied'
    case 'Shortlisted':
      return ['InterviewL1', 'InterviewL2', 'HRInterview', 'Screening'].includes(target)
    case 'InterviewL1':
    case 'InterviewL2':
    case 'ManagerReview':
    case 'HRInterview':
      return ['InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview', 'Offer', 'Shortlisted', 'Screening'].includes(target)
    case 'Offer':
      return ['Joined', 'Onboarding', 'BackgroundCheck', 'InterviewL1', 'InterviewL2', 'HRInterview'].includes(target)
    case 'BackgroundCheck':
      return ['Joined', 'Onboarding', 'Offer'].includes(target)
    case 'Onboarding':
      return ['Joined', 'BackgroundCheck', 'Offer'].includes(target)
    default:
      return true
  }
}

export default function AtsPipelinePage() {
  const queryClient = useQueryClient()
  const { isDarkMode } = useUIStore()

  // Selected Job Opening Filter
  const [selectedReqId, setSelectedReqId] = useState(undefined)
  const [draggedApp, setDraggedApp] = useState(null)

  // Rejection reason modal
  const [rejectModal, setRejectModal] = useState({ open: false, appId: null, targetStage: null })
  const [rejectionReason, setRejectionReason] = useState('')

  // Queries
  const { data: jobsData } = useQuery({
    queryKey: ['active-jobs-list'],
    queryFn: () => recruitmentService.getAdminPostings({ status: 'Active' })
  })

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['ats-applications', selectedReqId],
    queryFn: () => recruitmentService.getApplications({ reqId: selectedReqId })
  })

  const jobs = jobsData?.data || []
  const applications = appsData?.data || []

  // Mutations
  const updateStageMutation = useMutation({
    mutationFn: ({ appId, stage, reason }) => recruitmentService.updateApplicationStage(appId, { stage, rejectionReason: reason }),
    onSuccess: (res) => {
      if (res.success) {
        message.success(res.message || 'Candidate pipeline stage updated.')
        queryClient.invalidateQueries({ queryKey: ['ats-applications'] })
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to update application stage.')
    }
  })

  // Drag-and-Drop Handlers
  const handleDragStart = (e, app) => {
    setDraggedApp(app)
    e.dataTransfer.setData('text/plain', app.appId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault()
    if (!draggedApp) return

    const sourceStage = draggedApp.currentStage
    const targetStage = targetColumnId

    // Check transition rules
    if (!isValidTransition(sourceStage, targetStage)) {
      message.error(
        `Invalid Stage Move! Cannot transition candidate directly from '${sourceStage}' to '${targetStage}'.`
      )
      setDraggedApp(null)
      return
    }

    const activePipelineStages = ['Shortlisted', 'InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview', 'Offer', 'BackgroundCheck', 'Onboarding']
    if (activePipelineStages.includes(targetStage) && !activePipelineStages.includes(sourceStage)) {
      const conflictingApp = applications.find(a =>
        a.candidate?.candidateId === draggedApp.candidate?.candidateId &&
        a.appId !== draggedApp.appId &&
        a.status !== 'Rejected' && a.status !== 'Withdrawn' &&
        (activePipelineStages.includes(a.currentStage) || a.currentStage === 'Joined')
      )
      if (conflictingApp) {
        Modal.error({
          title: 'Active Pipeline Conflict',
          content: (
            <div style={{ marginTop: 8 }}>
              <Paragraph style={{ marginBottom: 8 }}>
                Candidate <strong>{draggedApp.candidate?.firstName} {draggedApp.candidate?.lastName}</strong> is already in an active interview pipeline for <strong>{conflictingApp.requisition?.jobTitle || 'another role'}</strong>.
              </Paragraph>
              <Paragraph type="danger" style={{ fontWeight: 600, margin: 0 }}>
                A candidate cannot be active in multiple interview pipelines simultaneously.
              </Paragraph>
            </div>
          )
        })
        setDraggedApp(null)
        return
      }
    }

    if (targetStage === 'Rejected') {
      // Trigger rejection reason modal
      setRejectModal({ open: true, appId: draggedApp.appId, targetStage })
    } else if (targetStage === 'Offer') {
      const pending = []
      if (draggedApp.technicalApproved !== true) pending.push('Technical')
      if (draggedApp.hrApproved !== true) pending.push('HR')
      if (draggedApp.managerApproved !== true) pending.push('Manager')

      if (pending.length > 0) {
        Modal.error({
          title: 'Cannot Move to Offer Stage',
          content: (
            <div style={{ marginTop: 8 }}>
              <Paragraph style={{ fontWeight: 600, marginBottom: 6 }}>Pending Approvals:</Paragraph>
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, padding: '8px 12px' }}>
                {pending.map(p => (
                  <div key={p} style={{ color: '#ef4444', fontWeight: 600, fontSize: 13, padding: '2px 0' }}>• {p}</div>
                ))}
              </div>
            </div>
          )
        })
        setDraggedApp(null)
        return
      }
      updateStageMutation.mutate({ appId: draggedApp.appId, stage: targetStage })
    } else {
      updateStageMutation.mutate({ appId: draggedApp.appId, stage: targetStage })
    }

    setDraggedApp(null)
  }

  const submitRejection = () => {
    if (!rejectionReason.trim()) {
      message.warning('Please enter a reason for rejection.')
      return
    }
    updateStageMutation.mutate({
      appId: rejectModal.appId,
      stage: rejectModal.targetStage,
      reason: rejectionReason
    })
    setRejectModal({ open: false, appId: null, targetStage: null })
    setRejectionReason('')
  }

  // Group applications by stage column
  const getColApps = (colId) => {
    return applications.filter(a => a.currentStage === colId)
  }

  return (
    <div style={{ padding: '0 24px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="ATS Pipeline Board"
        subtitle="Manage active candidates, track interviews, and move profiles through pipeline columns."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment', path: '/recruitment' }, { label: 'ATS Pipeline' }]}
      />

      {/* Top filter select */}
      <Card size="small" style={{ marginBottom: 20, background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
        <Space>
          <Text strong>Filter by Job Opening:</Text>
          <Select
            placeholder="All Job Openings"
            style={{ width: 300 }}
            allowClear
            value={selectedReqId}
            onChange={v => setSelectedReqId(v)}
            dropdownStyle={{ background: isDarkMode ? '#1c1e3d' : '#fff' }}
          >
            {jobs.map(j => (
              <Option key={j.jobId} value={j.reqId}>
                {j.jobTitle} ({j.mrfNumber || 'MRF'})
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Kanban Board Container */}
      <div 
        style={{ 
          flex: 1, 
          overflowX: 'auto', 
          display: 'flex', 
          gap: 12, 
          paddingBottom: 16,
          alignItems: 'stretch',
          minHeight: 500
        }}
      >
        {isLoading ? (
          <div style={{ margin: 'auto', textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>Fetching pipeline profiles...</div>
          </div>
        ) : (
          PIPELINE_COLUMNS.map(col => {
            const colApps = getColApps(col.id)
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                style={{
                  width: 280,
                  minWidth: 280,
                  background: isDarkMode ? '#11133F80' : '#f8fafc',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Column Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Space>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <Text strong style={{ fontSize: 13.5 }}>{col.label}</Text>
                  </Space>
                  <Badge count={colApps.length} style={{ backgroundColor: col.color }} />
                </div>

                {/* Cards Wrapper */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {colApps.length === 0 ? (
                    <div style={{ margin: 'auto', padding: '24px 0', opacity: 0.35, fontSize: 11.5, textAlign: 'center' }}>
                      Drag profile here
                    </div>
                  ) : (
                    colApps.map(app => {
                      const activePipelineStages = ['Shortlisted', 'InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview', 'Offer', 'BackgroundCheck', 'Onboarding']
                      const conflictingOtherApp = applications.find(other =>
                        other.candidate?.candidateId === app.candidate?.candidateId &&
                        other.appId !== app.appId &&
                        other.status !== 'Rejected' && other.status !== 'Withdrawn' &&
                        (activePipelineStages.includes(other.currentStage) || other.currentStage === 'Joined')
                      )
                      return (
                      <div
                        key={app.appId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app)}
                        style={{
                          background: 'var(--color-bg-container)',
                          border: conflictingOtherApp && !activePipelineStages.includes(app.currentStage) ? '1px solid #ffbb96' : 'var(--border-glass)',
                          borderRadius: 10,
                          padding: 12,
                          cursor: 'grab',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}
                      >
                        <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
                          <Col>
                            <Space size={8}>
                              <Avatar size="small" style={{ background: isDarkMode ? '#FAA71A' : '#7C3AED', color: isDarkMode ? '#111' : '#fff' }}>
                                {app.candidate?.firstName?.[0]}
                              </Avatar>
                              <Text strong style={{ fontSize: 12.5 }}>
                                {app.candidate?.firstName} {app.candidate?.lastName}
                              </Text>
                            </Space>
                          </Col>
                          <Col>
                            {app.aiMatchScore != null && (
                              <Tooltip title={`AI Match Score: ${app.aiMatchScore}%`}>
                                <Tag color={app.aiMatchScore >= 80 ? 'success' : app.aiMatchScore >= 60 ? 'warning' : 'error'} style={{ margin: 0, fontSize: 10 }}>
                                  <TrophyOutlined /> {Math.round(app.aiMatchScore)}%
                                </Tag>
                              </Tooltip>
                            )}
                          </Col>
                        </Row>

                        <div style={{ fontSize: 11.5, opacity: 0.55, marginBottom: 8 }}>
                          {app.candidate?.currentDesignation || 'No Designation'} · {app.candidate?.currentCompany || 'No Company'}
                        </div>

                        {conflictingOtherApp && (
                          <div style={{ marginTop: 4 }}>
                            <Tag color="volcano" style={{ fontSize: 9, margin: 0, borderRadius: 4 }}>
                              <WarningOutlined /> Active in {conflictingOtherApp.requisition?.jobTitle || 'another role'}
                            </Tag>
                          </div>
                        )}

                        <Row gutter={8} style={{ marginTop: 'auto', paddingTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.5 }}>
                          <span>Exp: {app.candidate?.totalExperience ?? 0} yrs</span>
                          <span>Source: {app.candidate?.source || 'Other'}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                          <span>CTC: ₹{(app.candidate?.currentCTC || 0).toLocaleString()}</span>
                          <span>ECTC: ₹{(app.candidate?.expectedCTC || 0).toLocaleString()}</span>
                        </div>

                        {app.rejectionReason && (
                          <div style={{ marginTop: 8, background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: 4, fontSize: 10.5, color: '#EF4444' }}>
                            <ExclamationCircleOutlined /> Reason: {app.rejectionReason}
                          </div>
                        )}
                        </Row>
                      </div>
                    )
                  }))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Rejection Reason Modal */}
      <Modal
        title="Candidate Rejection Reason"
        open={rejectModal.open}
        onCancel={() => { setRejectModal({ open: false, appId: null, targetStage: null }); setRejectionReason('') }}
        onOk={submitRejection}
        okText="Confirm Reject"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginTop: 16 }}>
          <Paragraph>Provide the specific reason for rejecting this candidate. This will be stored for audit purposes.</Paragraph>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Budget mismatch, Technical round failed, Lacks hands-on C# experience..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
