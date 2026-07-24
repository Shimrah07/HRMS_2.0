import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form, message,
  Badge, Row, Col, Drawer, Divider, Typography, List, Empty, Tooltip,
  DatePicker, Avatar, Timeline, Descriptions, Tabs, Popover, Statistic,
  Rate, InputNumber, Alert, Checkbox, Segmented, Upload
} from 'antd'
import {
  SearchOutlined, DownloadOutlined, UserOutlined, CalendarOutlined,
  DollarOutlined, CheckCircleOutlined, SendOutlined, CommentOutlined,
  ClockCircleOutlined, FilePdfOutlined, TeamOutlined, HistoryOutlined,
  MoreOutlined, AppstoreOutlined, UnorderedListOutlined, WarningOutlined,
  ArrowRightOutlined, FolderOpenOutlined, SafetyCertificateOutlined,
  CheckOutlined, CloseOutlined, EditOutlined, LockOutlined, UploadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import { recruitmentService } from '../../services/recruitmentService'
import { employeeService } from '../../services/employeeService'
import { organizationService } from '../../services/organizationService'
import useUIStore from '../../store/uiStore'
import { useAuth } from '../../hooks/useAuth'
import PendingQueuePanel from '../../components/recruitment/PendingQueuePanel'

const { Option } = Select
const { Text, Title, Paragraph } = Typography

// ─── Stage labels ─────────────────────────────────────────────────────────────
const STAGE_LABELS = {
  Applied: 'Applied',
  Screening: 'Screening',
  Shortlisted: 'Shortlisted',
  InterviewL1: 'Technical Interview',
  InterviewL2: 'HR Interview',
  ManagerReview: 'Managerial Interview',
  HRInterview: 'Managerial Interview (HR)',
  Offer: 'Offer',
  BackgroundCheck: 'Background Verification',
  Onboarding: 'Onboarding',
  Joined: 'Joined',
  Rejected: 'Rejected',
  Withdrawn: 'Withdrawn'
}

// ─── Stage colors ─────────────────────────────────────────────────────────────
const STAGE_COLORS = {
  Applied: '#3B82F6',
  Screening: '#EAB308',
  Shortlisted: '#A855F7',
  InterviewL1: '#06B6D4',
  InterviewL2: '#06B6D4',
  ManagerReview: '#14B8A6',
  HRInterview: '#EC4899',
  Offer: '#F97316',
  BackgroundCheck: '#6366F1',
  Onboarding: '#8B5CF6',
  Joined: '#22C55E',
  Rejected: '#EF4444',
  Withdrawn: '#6B7280'
}

const getPriority = (experience) => {
  const exp = parseFloat(experience) || 0
  if (exp >= 5) return { label: 'High', color: '#EF4444' }
  if (exp >= 2) return { label: 'Mid', color: '#3B82F6' }
  return { label: 'Fresh', color: '#6B7280' }
}

// ─── Kanban column configuration ──────────────────────────────────────────────
const COLUMN_CONFIGS = {
  Applied: {
    title: 'Applied', stages: ['Applied'], color: '#3B82F6',
    actions: [
      { key: 'review', label: 'Open Workspace', type: 'primary', isDrawer: true },
      { key: 'move_screening', label: 'Move to Screening', type: 'default', targetStage: 'Screening' },
      { key: 'reject', label: 'Reject', type: 'danger', targetStage: 'Rejected' }
    ]
  },
  Screening: {
    title: 'Screening', stages: ['Screening', 'Shortlisted'], color: '#EAB308',
    actions: [
      { key: 'workspace', label: 'Open Workspace', type: 'primary', isDrawer: true },
      { key: 'move_interview1', label: 'Move to Tech Interview', type: 'default', targetStage: 'InterviewL1' },
      { key: 'reject', label: 'Reject', type: 'danger', targetStage: 'Rejected' }
    ]
  },
  InterviewRound1: {
    title: 'Technical Interview', stages: ['InterviewL1'], color: '#06B6D4',
    actions: [
      { key: 'workspace', label: 'Open Workspace', type: 'primary', isDrawer: true },
      { key: 'move_interview2', label: 'Move to HR Interview', type: 'default', targetStage: 'InterviewL2' },
      { key: 'reject', label: 'Reject', type: 'danger', targetStage: 'Rejected' }
    ]
  },
  InterviewRound2: {
    title: 'HR Interview', stages: ['InterviewL2'], color: '#06B6D4',
    actions: [
      { key: 'workspace', label: 'Open Workspace', type: 'primary', isDrawer: true },
      { key: 'move_manager', label: 'Move to Managerial', type: 'default', targetStage: 'ManagerReview' },
      { key: 'reject', label: 'Reject', type: 'danger', targetStage: 'Rejected' }
    ]
  },
  ManagerDiscussion: {
    title: 'Managerial Interview', stages: ['ManagerReview', 'HRInterview'], color: '#14B8A6',
    actions: [
      { key: 'workspace', label: 'Open Workspace', type: 'primary', isDrawer: true },
      { key: 'move_offer', label: 'Move to Offer', type: 'default', targetStage: 'Offer' },
      { key: 'reject', label: 'Reject', type: 'danger', targetStage: 'Rejected' }
    ]
  },
  Offer: {
    title: 'Offer', stages: ['Offer'], color: '#F97316',
    actions: [
      { key: 'workspace', label: 'Open Workspace', type: 'primary', isDrawer: true },
      { key: 'mark_accepted', label: 'Offer Accepted', type: 'default', targetStage: 'BackgroundCheck', actionType: 'OfferAccepted' },
      { key: 'mark_declined', label: 'Offer Declined', type: 'danger', targetStage: 'Rejected', actionType: 'OfferDeclined' }
    ]
  },
  BackgroundVerification: {
    title: 'Background Verification', stages: ['BackgroundCheck'], color: '#6366F1',
    actions: [
      { key: 'workspace', label: 'Open Workspace', type: 'primary', isDrawer: true },
      { key: 'bgv_passed', label: 'BGV Passed', type: 'default', targetStage: 'Onboarding', actionType: 'BGVPassed' },
      { key: 'bgv_failed', label: 'BGV Failed', type: 'danger', targetStage: 'Rejected', actionType: 'BGVFailed' }
    ]
  },
  Onboarding: {
    title: 'Onboarding', stages: ['Onboarding'], color: '#8B5CF6',
    actions: [
      { key: 'workspace', label: 'Open Workspace', type: 'primary', isDrawer: true },
      { key: 'mark_joined', label: 'Mark Joined', type: 'default', targetStage: 'Joined' }
    ]
  },
  Joined: {
    title: 'Joined', stages: ['Joined'], color: '#22C55E',
    actions: [
      { key: 'workspace', label: 'Open Workspace', type: 'primary', isDrawer: true }
    ]
  },
  Rejected: {
    title: 'Rejected', stages: ['Rejected'], color: '#EF4444',
    actions: [
      { key: 'restore', label: 'Restore Application', type: 'default', targetStage: 'Applied' }
    ]
  },
  Withdrawn: {
    title: 'Withdrawn', stages: ['Withdrawn'], color: '#6B7280',
    actions: [
      { key: 'restore', label: 'Restore Application', type: 'default', targetStage: 'Applied' }
    ]
  }
}

const isValidTransition = (app, current, target) => {
  if (target === 'Rejected' || target === 'Withdrawn') return true
  if (current === 'Joined') return false

  let stageData = {}
  try { stageData = JSON.parse(app.stageDataJson || '{}') } catch {}

  const isTechApproved = app.technicalApproved === true || stageData.technicalInterview?.approved === true
  const isHrApproved = app.hrApproved === true || stageData.hrInterview?.approved === true
  const isMgrApproved = app.managerApproved === true || stageData.managerInterview?.approved === true
  const isScreeningCompleted = !!((stageData.screening || stageData).screeningRemarks)

  const isOfferCompleted = !!(stageData.offeredCTC && stageData.offerDate && stageData.expectedDOJ && stageData.offerStatus === 'Accepted')
  const isBgvCompleted = !!(stageData.bgvAgency && stageData.verificationStatus === 'Completed')
  const checklistArray = Array.isArray(stageData.checklist) ? stageData.checklist : (typeof stageData.checklist === 'object' && stageData.checklist !== null ? Object.keys(stageData.checklist).filter(k => stageData.checklist[k]) : [])
  const isOnboardingCompleted = checklistArray.length === 5

  if (target === 'InterviewL1' && !isScreeningCompleted && current === 'Screening') return false
  if (target === 'InterviewL2' && !isTechApproved) return false
  if (target === 'ManagerReview' && (!isTechApproved || !isHrApproved)) return false
  if (target === 'Offer' && (!isTechApproved || !isHrApproved || !isMgrApproved)) return false
  if (target === 'BackgroundCheck' && !isOfferCompleted) return false
  if (target === 'Onboarding' && !isBgvCompleted) return false
  if (target === 'Joined' && !isOnboardingCompleted) return false

  switch (current) {
    case 'Applied': return target === 'Screening'
    case 'Screening': return ['Shortlisted', 'Applied', 'InterviewL1'].includes(target)
    case 'Shortlisted': return ['InterviewL1', 'InterviewL2', 'ManagerReview', 'Screening'].includes(target)
    case 'InterviewL1':
    case 'InterviewL2':
    case 'ManagerReview':
    case 'HRInterview':
      return ['InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview', 'Offer', 'Shortlisted', 'Screening'].includes(target)
    case 'Offer': return ['BackgroundCheck', 'Onboarding', 'Joined', 'InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview'].includes(target)
    case 'BackgroundCheck': return ['Onboarding', 'Joined', 'Offer'].includes(target)
    case 'Onboarding': return ['Joined', 'BackgroundCheck', 'Offer'].includes(target)
    default: return true
  }
}

// ─── Preparation Checklist Subcomponent ─────────────────────────────────────
function PreparationChecklistPanel({ checklist, isReadOnly, onUpdate }) {
  const [items, setItems] = useState(checklist || {
    resumeReviewed: false,
    jdReviewed: false,
    evaluationReady: false,
    meetingVerified: false,
    candidateJoined: false,
    recordingStarted: false
  })

  useEffect(() => {
    if (checklist) setItems(checklist)
  }, [checklist])

  const completedCount = Object.values(items).filter(Boolean).length
  const totalCount = Object.keys(items).length
  const percent = Math.round((completedCount / totalCount) * 100)

  const toggleItem = (key) => {
    if (isReadOnly) return
    const updated = { ...items, [key]: !items[key] }
    setItems(updated)
    onUpdate && onUpdate(updated)
  }

  return (
    <Card
      size="small"
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>📋 Interview Preparation Checklist ({completedCount}/{totalCount})</span>
          <Tag color={percent === 100 ? 'success' : percent > 0 ? 'processing' : 'default'}>{percent}% Completed</Tag>
        </div>
      }
      style={{ marginBottom: 16, borderRadius: 10, background: 'var(--color-bg-elevated)' }}
    >
      <Row gutter={[12, 10]}>
        <Col span={12}><Checkbox checked={items.resumeReviewed} disabled={isReadOnly} onChange={() => toggleItem('resumeReviewed')}>Resume Reviewed</Checkbox></Col>
        <Col span={12}><Checkbox checked={items.jdReviewed} disabled={isReadOnly} onChange={() => toggleItem('jdReviewed')}>Job Description Reviewed</Checkbox></Col>
        <Col span={12}><Checkbox checked={items.evaluationReady} disabled={isReadOnly} onChange={() => toggleItem('evaluationReady')}>Evaluation Form Ready</Checkbox></Col>
        <Col span={12}><Checkbox checked={items.meetingVerified} disabled={isReadOnly} onChange={() => toggleItem('meetingVerified')}>Meeting Link Verified</Checkbox></Col>
        <Col span={12}><Checkbox checked={items.candidateJoined} disabled={isReadOnly} onChange={() => toggleItem('candidateJoined')}>Candidate Joined</Checkbox></Col>
        <Col span={12}><Checkbox checked={items.recordingStarted} disabled={isReadOnly} onChange={() => toggleItem('recordingStarted')}>Recording Started (Optional)</Checkbox></Col>
      </Row>
    </Card>
  )
}

// ─── Categorized Attachments Subcomponent ───────────────────────────────────
function CategorizedAttachmentsPanel({ roundId, attachments = [], isReadOnly, onUploaded }) {
  const [fileList, setFileList] = useState([])
  const [docType, setDocType] = useState('Assignment')
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      if (roundId) {
        const res = await recruitmentService.uploadInterviewAttachment(roundId, file, docType)
        if (res.success) {
          message.success(`Attachment (${docType}) uploaded successfully.`)
          onUploaded && onUploaded(res.data)
        }
      } else {
        // Fallback inline attachment representation
        const newAtt = {
          id: Date.now().toString(),
          fileName: file.name,
          documentType: docType,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          uploadedOn: new Date().toISOString()
        }
        onUploaded && onUploaded(newAtt)
        message.success(`Attachment (${docType}) attached to draft.`)
      }
    } catch (err) {
      message.error('Failed to upload attachment.')
    } finally {
      setUploading(false)
    }
    return false
  }

  const ATTACHMENT_CATEGORIES = ['Resume', 'Assignment', 'Evaluation Sheet', 'Recording', 'Offer Discussion', 'Other']

  return (
    <Card
      size="small"
      title={<span style={{ fontWeight: 600 }}>📎 Interview Attachments & Files ({attachments.length})</span>}
      style={{ marginBottom: 16, borderRadius: 10, background: 'var(--color-bg-elevated)' }}
    >
      {!isReadOnly && (
        <Space style={{ marginBottom: 12 }} wrap align="center">
          <Select value={docType} onChange={setDocType} style={{ width: 160 }} size="small">
            {ATTACHMENT_CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
          <Upload showUploadList={false} beforeUpload={handleUpload}>
            <Button size="small" icon={<UploadOutlined />} loading={uploading}>Upload {docType}</Button>
          </Upload>
        </Space>
      )}

      {attachments.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.45, fontStyle: 'italic' }}>No attachments uploaded for this interview round.</div>
      ) : (
        <List
          size="small"
          dataSource={attachments}
          renderItem={att => (
            <List.Item
              extra={
                att.fileUrl && (
                  <Button type="link" size="small" icon={<DownloadOutlined />} href={`/uploads/${att.fileUrl}`} target="_blank">
                    Download
                  </Button>
                )
              }
            >
              <List.Item.Meta
                avatar={<FilePdfOutlined style={{ color: '#3B82F6', fontSize: 18 }} />}
                title={<span style={{ fontSize: 13, fontWeight: 600 }}>{att.fileName} <Tag color="blue">{att.documentType || 'Attachment'}</Tag></span>}
                description={<span style={{ fontSize: 11, opacity: 0.5 }}>Uploaded {att.uploadedOn ? dayjs(att.uploadedOn).format('DD MMM YYYY') : ''} • {att.size || ''}</span>}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

// ─── Stage Workspace Renderer ──────────────────────────────────────────────────

// Each stage returns its specific form / information panel
function StageWorkspace({ app, onSaved, isDarkMode, onConvertClick, user, isReadOnly }) {
  const stage = app?.currentStage
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false) // stores namespace string when open
  const [scheduleForm] = Form.useForm()

  const getStageData = () => {
    try { return JSON.parse(app?.stageDataJson || '{}') } catch { return {} }
  }
  const stageData = getStageData()

  const saveWorkspace = async (extraPayload = {}, specificNamespace = null) => {
    setSaving(true)
    try {
      const values = form.getFieldsValue()
      
      let dataToSave = {}
      if (specificNamespace) {
         dataToSave = {
            ...stageData,
            [specificNamespace]: {
               ...(stageData[specificNamespace] || {}),
               ...values
            }
         }
      } else {
         dataToSave = { ...stageData, ...values }
      }
      delete dataToSave.remarks

      const payload = {
        stage: app.currentStage,
        stageDataJson: JSON.stringify(dataToSave),
        remarks: values.remarks || undefined,
        ...extraPayload
      }

      const res = await recruitmentService.saveWorkspace(app.appId || app.AppId, payload)
      if (res.success) {
        message.success('Workspace saved successfully.')
        onSaved && onSaved(res.data)
      }
    } catch (err) {
      message.error(err.response?.data?.errors?.[0] || err.response?.data?.message || err.message || 'Failed to save workspace.')
    } finally {
      setSaving(false)
    }
  }

  const sectionStyle = {
    background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f8fafc',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 16,
    border: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e8ecf0'
  }

  const renderInterviewSummary = (namespace, title = 'Upcoming Interview') => {
    const data = stageData[namespace] || {}
    const isScheduled = !!data.interviewStatus
    
    return (
      <Card size="small" style={{ marginBottom: 16, background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff', border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0, fontSize: 14 }}>{title}</Title>
          {!isReadOnly && (
            <Button type={isScheduled ? 'default' : 'primary'} size="small" icon={<CalendarOutlined />} onClick={() => {
              scheduleForm.setFieldsValue(data)
              setScheduleModalOpen(namespace)
            }}>
              {isScheduled ? 'Reschedule' : 'Schedule Interview'}
            </Button>
          )}
        </div>
        {isScheduled ? (
          <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} style={{ marginTop: 12 }}>
            <Descriptions.Item label="Date">{data.interviewDate ? dayjs(data.interviewDate).format('DD MMM YYYY') : '-'}</Descriptions.Item>
            <Descriptions.Item label="Time">{data.interviewTime || '-'}</Descriptions.Item>
            <Descriptions.Item label="Interviewer">{data.interviewer || '-'}</Descriptions.Item>
            <Descriptions.Item label="Mode">{data.interviewMode || '-'}</Descriptions.Item>
            <Descriptions.Item label="Location/Link">
               {data.meetingLink?.startsWith('http') ? <a href={data.meetingLink} target="_blank" rel="noreferrer">Meeting Link</a> : (data.meetingLink || '-')}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={data.interviewStatus === 'Completed' ? 'success' : data.interviewStatus === 'Cancelled' ? 'error' : 'processing'} style={{ margin: 0 }}>
                {data.interviewStatus}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">Not scheduled yet. Click the button above to schedule this interview.</Text>
          </div>
        )}
      </Card>
    )
  }

  const handleSaveSchedule = async () => {
    try {
      const values = await scheduleForm.validateFields()
      setSaving(true)
      
      const namespace = scheduleModalOpen
      const dataToSave = {
        ...stageData,
        [namespace]: {
          ...(stageData[namespace] || {}),
          ...values
        }
      }

      const payload = {
        stage: app.currentStage,
        stageDataJson: JSON.stringify(dataToSave)
      }

      const res = await recruitmentService.saveWorkspace(app.appId || app.AppId, payload)
      if (res.success) {
        message.success('Interview scheduled successfully.')
        setScheduleModalOpen(false)
        onSaved && onSaved(res.data)
      }
    } catch (err) {
      if (err.errorFields) return
      message.error(err.response?.data?.errors?.[0] || 'Failed to save schedule.')
    } finally {
      setSaving(false)
    }
  }

  const scheduleModal = (
    <Modal
      title="Schedule Interview"
      open={!!scheduleModalOpen}
      onCancel={() => setScheduleModalOpen(false)}
      onOk={handleSaveSchedule}
      confirmLoading={saving}
      destroyOnClose
    >
      <Form form={scheduleForm} layout="vertical">
        <Row gutter={16}>
          <Col span={12}><Form.Item label="Interviewer Name" name="interviewer" rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col span={12}><Form.Item label="Interview Status" name="interviewStatus" rules={[{ required: true }]}><Select><Option value="Scheduled">Scheduled</Option><Option value="Completed">Completed</Option><Option value="Rescheduled">Rescheduled</Option><Option value="Cancelled">Cancelled</Option></Select></Form.Item></Col>
          <Col span={12}><Form.Item label="Interview Date" name="interviewDate" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
          <Col span={12}><Form.Item label="Interview Time" name="interviewTime" rules={[{ required: true }]}><Input type="time" /></Form.Item></Col>
          <Col span={12}><Form.Item label="Interview Mode" name="interviewMode" rules={[{ required: true }]}><Select><Option value="Online">Online</Option><Option value="In-Person">In-Person</Option></Select></Form.Item></Col>
          <Col span={12}><Form.Item label="Meeting Link / Location" name="meetingLink"><Input placeholder="e.g. Google Meet link or Room 2" /></Form.Item></Col>
        </Row>
      </Form>
    </Modal>
  )

  // ─── SCREENING ───────────────────────────────────────────────────────────────
  if (stage === 'Screening' || stage === 'Shortlisted') {
    const screening = stageData.screening || stageData // Fallback for old data structure
    return (
      <div>
        <div style={sectionStyle}>
          <Title level={5} style={{ marginBottom: 12 }}>Screening Workspace</Title>
          <Form form={form} layout="vertical" initialValues={{
            screeningRemarks: screening.screeningRemarks,
            recommendation: screening.recommendation,
            internalNotes: screening.internalNotes
          }}>
            <Form.Item label="Screening Remarks" name="screeningRemarks" rules={[{ required: true, message: 'Remarks are required.' }]}>
              <Input.TextArea rows={4} placeholder="Summarise the candidate's profile, key strengths, and areas of concern..." />
            </Form.Item>
            <Form.Item label="Recommendation" name="recommendation" rules={[{ required: true, message: 'Recommendation is required.' }]}>
              <Select placeholder="Select recommendation">
                <Option value="Proceed">Proceed to Interview</Option>
                <Option value="Hold">Hold for Review</Option>
                <Option value="Reject">Reject</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Internal Notes" name="internalNotes" rules={[{ required: true, message: 'Internal notes are required.' }]}>
              <Input.TextArea rows={2} placeholder="Private notes visible only to the hiring team..." />
            </Form.Item>
          </Form>
          <Button type="primary" loading={saving} onClick={() => {
            form.validateFields().then(() => saveWorkspace({}, 'screening'))
          }} icon={<CheckOutlined />}>
            Save Screening Notes
          </Button>
        </div>

        {screening.recommendation && (
          <Alert
            type={screening.recommendation === 'Proceed' ? 'success' : screening.recommendation === 'Hold' ? 'warning' : 'error'}
            message={`Recommendation: ${screening.recommendation}`}
            description={screening.screeningRemarks || 'No remarks added.'}
            showIcon
            style={{ marginBottom: 12 }}
          />
        )}
      </div>
    )
  }

  // ─── TECHNICAL INTERVIEW (L1) ──────────────────────────────────────────────────
  if (stage === 'InterviewL1') {
    const tech = stageData.technicalInterview || {}
    const isApproved = tech.approved === true || app.technicalApproved === true

    const handleDecision = async (approved) => {
      if (!tech.interviewStatus) {
        message.warning('Please schedule the interview before proceeding.')
        return
      }

      await form.validateFields(['technicalRating', 'recommendation', 'feedback', 'internalNotes'])
      const values = form.getFieldsValue()
      
      const approvalMeta = approved ? {
        approved: true,
        approvedBy: user?.employeeId || user?.id || 'EMP000',
        approvedByName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Current User',
        approvedOn: new Date().toISOString()
      } : {}

      let newTechData = { ...tech, ...values, ...approvalMeta }
      if (!approved) {
        newTechData = { attempts: [...(tech.attempts || []), { ...newTechData, attemptDate: new Date().toISOString() }] }
      }

      setSaving(true)
      try {
        const payload = {
          stage: app.currentStage,
          stageDataJson: JSON.stringify({ ...stageData, technicalInterview: newTechData }),
          technicalApproved: approved ? true : null,
          remarks: `Technical Interview ${approved ? 'Approved' : 'Re-Interview Requested'}`
        }
        if (!approved) {
           payload.technicalApproved = false;
        }
        
        const res = await recruitmentService.saveWorkspace(app.appId || app.AppId, payload)
        if (res.success) {
          message.success(`Technical Interview ${approved ? 'Approved' : 'Re-Interview Requested'}.`)
          onSaved && onSaved(res.data)
        }
      } catch (err) {
        if (err.errorFields) return
        message.error(err.response?.data?.errors?.[0] || err.response?.data?.message || 'Failed to save decision.')
      } finally {
        setSaving(false)
      }
    }

    return (
      <div>
        {scheduleModal}
        <div style={sectionStyle}>
          <Title level={5} style={{ marginBottom: 12 }}>Technical Interview Workspace</Title>
          
          {isApproved ? (
            <div>
              <Card style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 12, marginBottom: 16 }}>
                <Row align="middle" justify="space-between">
                  <Col>
                    <Space align="center">
                      <CheckCircleOutlined style={{ color: '#22C55E', fontSize: 24 }} />
                      <div>
                        <Text strong style={{ fontSize: 15, color: '#22C55E' }}>Technical Interview Approved & Locked</Text>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          Approved by <strong>{tech.approvedByName || 'HR Manager'}</strong> on {tech.approvedOn ? dayjs(tech.approvedOn).format('DD MMM YYYY, hh:mm A') : 'Recorded Date'}
                        </div>
                      </div>
                    </Space>
                  </Col>
                  <Col>
                    <Space size="large">
                      {tech.technicalRating && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, opacity: 0.6 }}>Technical Score</div>
                          <Tag color="gold" style={{ fontSize: 14, fontWeight: 700, padding: '2px 8px' }}>
                            ⭐ {tech.technicalRating}/10
                          </Tag>
                        </div>
                      )}
                      {tech.recommendation && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, opacity: 0.6 }}>Recommendation</div>
                          <Tag color="success" style={{ fontWeight: 600 }}>{tech.recommendation}</Tag>
                        </div>
                      )}
                    </Space>
                  </Col>
                </Row>
              </Card>

              {/* Read-Only Checklist & Attachments */}
              <PreparationChecklistPanel
                checklist={tech.checklist}
                isReadOnly={true}
              />

              <CategorizedAttachmentsPanel
                roundId={tech.roundId}
                attachments={tech.attachments}
                isReadOnly={true}
              />
            </div>
          ) : (
            <>
              {tech.attempts && tech.attempts.length > 0 && (
                <Alert type="warning" message={`Previous Attempts: ${tech.attempts.length}`} style={{ marginBottom: 12 }} />
              )}

              {renderInterviewSummary('technicalInterview', 'Technical Interview Schedule')}

              <PreparationChecklistPanel
                checklist={tech.checklist}
                isReadOnly={false}
                onUpdate={(newChecklist) => {
                  const updatedTech = { ...tech, checklist: newChecklist }
                  recruitmentService.saveWorkspace(app.appId || app.AppId, {
                    stage: app.currentStage,
                    stageDataJson: JSON.stringify({ ...stageData, technicalInterview: updatedTech })
                  }).catch(() => {})
                }}
              />

              <CategorizedAttachmentsPanel
                roundId={tech.roundId}
                attachments={tech.attachments}
                isReadOnly={false}
                onUploaded={(newAtt) => {
                  const currentList = tech.attachments || []
                  const updatedList = [...currentList, newAtt]
                  const updatedTech = { ...tech, attachments: updatedList }
                  recruitmentService.saveWorkspace(app.appId || app.AppId, {
                    stage: app.currentStage,
                    stageDataJson: JSON.stringify({ ...stageData, technicalInterview: updatedTech })
                  }).catch(() => {})
                }}
              />

              <Form form={form} layout="vertical" initialValues={tech}>
                <Row gutter={16}>
                  <Col span={12}><Form.Item label="Technical Rating (1-10)" name="technicalRating" rules={[{ required: true, message: 'Rating is required' }]}><InputNumber min={1} max={10} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Coding Test Result" name="codingTestResult"><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Recommendation" name="recommendation" rules={[{ required: true, message: 'Recommendation is required' }]}><Select><Option value="Strong Hire">Strong Hire</Option><Option value="Hire">Hire</Option><Option value="Hold">Hold</Option><Option value="Reject">Reject</Option></Select></Form.Item></Col>
                </Row>
                <Form.Item label="Strengths" name="strengths"><Input.TextArea rows={2} /></Form.Item>
                <Form.Item label="Weaknesses" name="weaknesses"><Input.TextArea rows={2} /></Form.Item>
                <Form.Item label="Detailed Feedback" name="feedback" rules={[{ required: true, message: 'Detailed feedback is required.' }]}><Input.TextArea rows={4} /></Form.Item>
                <Form.Item label="Internal Notes" name="internalNotes" rules={[{ required: true, message: 'Internal notes are required.' }]}><Input.TextArea rows={2} /></Form.Item>
              </Form>
              
              <Space wrap style={{ marginTop: 12 }}>
                <Button loading={saving} onClick={() => form.validateFields().then(() => saveWorkspace({}, 'technicalInterview'))}>Save Draft</Button>
                <Button type="primary" loading={saving} icon={<CheckOutlined />} onClick={() => handleDecision(true)} style={{ background: '#22C55E', borderColor: '#22C55E' }}>Approve Technical Round</Button>
                <Button danger loading={saving} icon={<ClockCircleOutlined />} onClick={() => handleDecision(false)}>Request Re-Interview</Button>
              </Space>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── HR INTERVIEW (L2) ────────────────────────────────────────────────────────
  if (stage === 'InterviewL2') {
    const hr = stageData.hrInterview || {}
    const isApproved = hr.approved === true || app.hrApproved === true

    const handleDecision = async (decisionType) => {
      const isApprove = decisionType === 'Approve'

      if (!hr.interviewStatus) {
        message.warning('Please schedule the interview before proceeding.')
        return
      }

      await form.validateFields(['hrRating', 'recommendation', 'feedback', 'internalNotes'])
      const values = form.getFieldsValue()
      
      const approvalMeta = isApprove ? {
        approved: true,
        approvedBy: user?.employeeId || user?.id || 'EMP000',
        approvedByName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Current User',
        approvedOn: new Date().toISOString()
      } : {}

      let newHrData = { ...hr, ...values, ...approvalMeta, lastDecision: decisionType }
      if (!isApprove) {
        newHrData = { attempts: [...(hr.attempts || []), { ...newHrData, attemptDate: new Date().toISOString() }] }
      }

      setSaving(true)
      try {
        const payload = {
          stage: app.currentStage,
          stageDataJson: JSON.stringify({ ...stageData, hrInterview: newHrData }),
          hrApproved: isApprove ? true : null,
          remarks: `HR Interview ${decisionType}`
        }
        if (!isApprove) {
           payload.hrApproved = false; 
        }

        const res = await recruitmentService.saveWorkspace(app.appId || app.AppId, payload)
        if (res.success) {
          message.success(`HR Interview ${decisionType}.`)
          onSaved && onSaved(res.data)
        }
      } catch (err) {
        if (err.errorFields) return
        message.error(err.response?.data?.errors?.[0] || err.response?.data?.message || 'Failed to save decision.')
      } finally {
        setSaving(false)
      }
    }

    return (
      <div>
        {scheduleModal}
        <div style={sectionStyle}>
          <Title level={5} style={{ marginBottom: 12 }}>HR Interview Workspace</Title>
          
          {isApproved ? (
            <Alert type="success" showIcon style={{ marginBottom: 16 }}
              message="HR Interview Approved"
              description={`Approved by ${hr.approvedByName || 'System'} on ${hr.approvedOn ? dayjs(hr.approvedOn).format('DD MMM YYYY HH:mm') : 'Unknown Date'}`} 
            />
          ) : (
            <>
              {hr.attempts && hr.attempts.length > 0 && (
                <Alert type="warning" message={`Previous Attempts/Holds: ${hr.attempts.length}`} style={{ marginBottom: 12 }} />
              )}

              {renderInterviewSummary('hrInterview', 'HR Interview Schedule')}

              <Form form={form} layout="vertical" initialValues={hr}>
                <Row gutter={16}>
                  <Col span={12}><Form.Item label="HR Rating (1-10)" name="hrRating" rules={[{ required: true, message: 'Rating is required' }]}><InputNumber min={1} max={10} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Culture Fit" name="cultureFit"><Select><Option value="Excellent">Excellent</Option><Option value="Good">Good</Option><Option value="Average">Average</Option><Option value="Poor">Poor</Option></Select></Form.Item></Col>
                  <Col span={12}><Form.Item label="Communication" name="communication"><Select><Option value="Excellent">Excellent</Option><Option value="Good">Good</Option><Option value="Average">Average</Option><Option value="Poor">Poor</Option></Select></Form.Item></Col>
                  <Col span={12}><Form.Item label="Recommendation" name="recommendation" rules={[{ required: true, message: 'Recommendation is required' }]}><Select><Option value="Strong Hire">Strong Hire</Option><Option value="Hire">Hire</Option><Option value="Hold">Hold</Option><Option value="Reject">Reject</Option></Select></Form.Item></Col>
                </Row>
                <Form.Item label="Salary Discussion" name="salaryDiscussion"><Input.TextArea rows={2} placeholder="Current CTC, Expected CTC, negotiations..." /></Form.Item>
                <Form.Item label="Notice Period Confirmation" name="noticePeriodConfirmation"><Input.TextArea rows={1} placeholder="Can they join in 30 days? Buyout needed?" /></Form.Item>
                <Form.Item label="Behavioral Feedback" name="feedback" rules={[{ required: true, message: 'Behavioral feedback is required.' }]}><Input.TextArea rows={4} /></Form.Item>
                <Form.Item label="Overall HR Notes" name="internalNotes" rules={[{ required: true, message: 'Overall HR notes are required.' }]}><Input.TextArea rows={2} /></Form.Item>
              </Form>
              
              <Space wrap>
                <Button loading={saving} onClick={() => form.validateFields().then(() => saveWorkspace({}, 'hrInterview'))}>Save Draft</Button>
                <Button type="primary" loading={saving} icon={<CheckOutlined />} onClick={() => handleDecision('Approve')} style={{ background: '#22C55E', borderColor: '#22C55E' }}>Approve HR Round</Button>
                <Button danger loading={saving} icon={<CloseOutlined />} onClick={() => handleDecision('Reject')}>Reject Candidate</Button>
                <Button loading={saving} icon={<ClockCircleOutlined />} onClick={() => handleDecision('Hold')}>Hold</Button>
              </Space>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── MANAGERIAL INTERVIEW ──────────────────────────────────────────────────────
  if (stage === 'ManagerReview' || stage === 'HRInterview') {
    const mgr = stageData.managerInterview || {}
    const isApproved = mgr.approved === true || app.managerApproved === true
    const needsExecutiveReview = mgr.lastDecision === 'Need Executive Review'
    
    const showCoo = needsExecutiveReview || !!mgr.cooFeedback

    const handleDecision = async (decisionType) => {
      const isApprove = decisionType === 'Approve'

      if (!mgr.interviewStatus && decisionType !== 'Need Executive Review') {
        message.warning('Please schedule the interview before proceeding.')
        return
      }
      
      const validationFields = ['managerRating', 'hiringRecommendation', 'feedback', 'internalNotes']
      try {
        await form.validateFields(validationFields)
      } catch (err) {
        return
      }
      const values = form.getFieldsValue()
      
      const approvalMeta = isApprove ? {
        approved: true,
        approvedBy: user?.employeeId || user?.id || 'EMP000',
        approvedByName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Current User',
        approvedOn: new Date().toISOString()
      } : {}

      let newMgrData = { ...mgr, ...values, ...approvalMeta, lastDecision: decisionType }
      if (decisionType === 'Reject') {
        newMgrData = { attempts: [...(mgr.attempts || []), { ...newMgrData, attemptDate: new Date().toISOString() }] }
      }

      setSaving(true)
      try {
        const payload = {
          stage: app.currentStage,
          stageDataJson: JSON.stringify({ ...stageData, managerInterview: newMgrData }),
          managerApproved: isApprove ? true : null,
          remarks: `Managerial Interview ${decisionType}`
        }
        if (decisionType === 'Reject') {
           payload.managerApproved = false; 
        }

        const res = await recruitmentService.saveWorkspace(app.appId || app.AppId, payload)
        if (res.success) {
          message.success(`Managerial Interview ${decisionType}.`)
          onSaved && onSaved(res.data)
        }
      } catch (err) {
        if (err.errorFields) return
        message.error(err.response?.data?.errors?.[0] || err.response?.data?.message || 'Failed to save decision.')
      } finally {
        setSaving(false)
      }
    }

    return (
      <div>
        {scheduleModal}
        <div style={sectionStyle}>
          <Title level={5} style={{ marginBottom: 12 }}>Managerial Interview Workspace</Title>
          
          {isApproved ? (
            <Alert type="success" showIcon style={{ marginBottom: 16 }}
              message="Managerial Interview Approved"
              description={`Approved by ${mgr.approvedByName || 'System'} on ${mgr.approvedOn ? dayjs(mgr.approvedOn).format('DD MMM YYYY HH:mm') : 'Unknown Date'}`} 
            />
          ) : (
            <>
              {mgr.attempts && mgr.attempts.length > 0 && (
                <Alert type="warning" message={`Previous Rejections: ${mgr.attempts.length}`} style={{ marginBottom: 12 }} />
              )}

              {renderInterviewSummary('managerInterview', 'Managerial Interview Schedule')}

              <Form form={form} layout="vertical" initialValues={mgr}>
                <Row gutter={16}>
                  <Col span={12}><Form.Item label="Manager Rating (1-10)" name="managerRating" rules={[{ required: true, message: 'Rating is required' }]}><InputNumber min={1} max={10} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Business Fit" name="businessFit"><Select><Option value="Excellent">Excellent</Option><Option value="Good">Good</Option><Option value="Average">Average</Option><Option value="Poor">Poor</Option></Select></Form.Item></Col>
                  <Col span={12}><Form.Item label="Leadership Potential" name="leadershipPotential"><Select><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Form.Item></Col>
                  <Col span={12}><Form.Item label="Project Fit" name="projectFit"><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Department Recommendation" name="departmentRecommendation"><Input /></Form.Item></Col>
                  <Col span={12}><Form.Item label="Hiring Recommendation" name="hiringRecommendation" rules={[{ required: true, message: 'Recommendation is required' }]}><Select><Option value="Strong Hire">Strong Hire</Option><Option value="Hire">Hire</Option><Option value="No Hire">No Hire</Option></Select></Form.Item></Col>
                </Row>
                <Form.Item label="Manager Feedback" name="feedback" rules={[{ required: true, message: 'Manager feedback is required.' }]}><Input.TextArea rows={4} /></Form.Item>
                <Form.Item label="Internal Notes" name="internalNotes" rules={[{ required: true, message: 'Internal notes are required.' }]}><Input.TextArea rows={2} /></Form.Item>

                {showCoo && (
                  <div style={{ marginTop: 24, padding: 16, background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f1f5f9', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                    <Title level={5} style={{ color: isDarkMode ? '#94a3b8' : '#475569' }}>COO Executive Review</Title>
                    <Row gutter={16}>
                      <Col span={12}><Form.Item label="Strategic Fit" name={['cooFeedback', 'strategicFit']}><Select><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Form.Item></Col>
                      <Col span={12}><Form.Item label="Leadership Potential" name={['cooFeedback', 'cooLeadershipPotential']}><Select><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select></Form.Item></Col>
                      <Col span={12}><Form.Item label="Business Value" name={['cooFeedback', 'businessValue']}><Input /></Form.Item></Col>
                      <Col span={12}><Form.Item label="COO Recommendation" name={['cooFeedback', 'cooRecommendation']}><Select><Option value="Strong Hire">Strong Hire</Option><Option value="Hire">Hire</Option><Option value="No Hire">No Hire</Option></Select></Form.Item></Col>
                    </Row>
                    <Form.Item label="COO Remarks" name={['cooFeedback', 'cooRemarks']}><Input.TextArea rows={3} /></Form.Item>
                    <Form.Item label="Final Notes" name={['cooFeedback', 'cooFinalNotes']}><Input.TextArea rows={2} /></Form.Item>
                  </div>
                )}
              </Form>
              
              <Space wrap style={{ marginTop: 16 }}>
                <Button loading={saving} onClick={() => form.validateFields().then(() => saveWorkspace({}, 'managerInterview'))}>Save Draft</Button>
                <Button type="primary" loading={saving} icon={<CheckOutlined />} onClick={() => handleDecision('Approve')} style={{ background: '#22C55E', borderColor: '#22C55E' }}>Approve Managerial Round</Button>
                <Button danger loading={saving} icon={<CloseOutlined />} onClick={() => handleDecision('Reject')}>Reject Candidate</Button>
                {!showCoo && (
                  <Button loading={saving} onClick={() => handleDecision('Need Executive Review')}>Need Executive Review</Button>
                )}
              </Space>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── OFFER ────────────────────────────────────────────────────────────────────
  if (stage === 'Offer') {
    return (
      <div>
        <div style={sectionStyle}>
          <Title level={5} style={{ marginBottom: 12 }}>Offer Details</Title>
          <Form form={form} layout="vertical" initialValues={stageData}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Offered CTC (₹ per annum)" name="offeredCTC">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 1200000" formatter={v => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Joining Bonus (optional)" name="joiningBonus">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 50000" formatter={v => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Offer Date" name="offerDate">
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Expected Date of Joining" name="expectedDOJ">
                  <Input type="date" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Offer Status" name="offerStatus">
              <Select placeholder="Select offer status">
                <Option value="Drafted">Drafted</Option>
                <Option value="Sent">Sent to Candidate</Option>
                <Option value="Negotiating">Under Negotiation</Option>
                <Option value="Accepted">Accepted</Option>
                <Option value="Declined">Declined</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Additional Notes" name="offerNotes">
              <Input.TextArea rows={2} placeholder="Additional offer terms, perks, or remarks..." />
            </Form.Item>
          </Form>
          <Space>
            <Button loading={saving} onClick={() => saveWorkspace()}>Save Offer Details</Button>
            <Tooltip title="Generate Offer Letter (Available in Phase 4)">
              <Button disabled icon={<LockOutlined />}>Generate Offer Letter (Phase 4)</Button>
            </Tooltip>
          </Space>
        </div>
      </div>
    )
  }

  // ─── BACKGROUND VERIFICATION ──────────────────────────────────────────────────
  if (stage === 'BackgroundCheck') {
    const documentsReceivedArray = Array.isArray(stageData.documentsReceived) ? stageData.documentsReceived : []

    return (
      <div>
        <div style={sectionStyle}>
          <Title level={5} style={{ marginBottom: 12 }}>Background Verification Workspace</Title>
          <Form form={form} layout="vertical" initialValues={{ ...stageData, documentsReceived: documentsReceivedArray }}>
            <Form.Item label="BGV Agency / Vendor" name="bgvAgency">
              <Input placeholder="e.g. AuthBridge, Verifitech" />
            </Form.Item>
            <Form.Item label="Verification Status" name="verificationStatus">
              <Select placeholder="Select status">
                <Option value="Initiated">Initiated</Option>
                <Option value="InProgress">In Progress</Option>
                <Option value="DocumentsPending">Documents Pending</Option>
                <Option value="DocumentsReceived">Documents Received</Option>
                <Option value="Completed">Completed</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Documents Received" name="documentsReceived">
              <Select mode="multiple" placeholder="Select received documents">
                <Option value="Aadhaar">Aadhaar Card</Option>
                <Option value="PAN">PAN Card</Option>
                <Option value="Degree">Degree Certificate</Option>
                <Option value="ExperienceLetter">Experience Letter</Option>
                <Option value="PaySlips">Pay Slips</Option>
                <Option value="AddressProof">Address Proof</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Verification Remarks" name="bgvRemarks">
              <Input.TextArea rows={3} placeholder="BGV observations, discrepancies found, status comments..." />
            </Form.Item>
          </Form>
          <Button type="primary" loading={saving} onClick={() => saveWorkspace()}>Save BGV Details</Button>
        </div>
      </div>
    )
  }

  // ─── ONBOARDING ───────────────────────────────────────────────────────────────
  if (stage === 'Onboarding') {
    const checklistArray = Array.isArray(stageData.checklist)
      ? stageData.checklist
      : (typeof stageData.checklist === 'object' && stageData.checklist !== null
          ? Object.keys(stageData.checklist).filter(k => stageData.checklist[k])
          : [])

    const handleChecklistSave = async () => {
      const values = form.getFieldsValue()
      setSaving(true)
      try {
        const res = await recruitmentService.saveWorkspace(app.appId || app.AppId, {
          stage: app.currentStage,
          stageDataJson: JSON.stringify({ ...stageData, checklist: values.checklist || [], onboardingRemarks: values.onboardingRemarks }),
          remarks: 'Onboarding checklist updated'
        })
        if (res.success) { message.success('Onboarding checklist saved.'); onSaved && onSaved(res.data) }
      } catch (err) {
        message.error(err.response?.data?.errors?.[0] || err.response?.data?.message || err.message || 'Failed to save onboarding checklist.')
      } finally {
        setSaving(false)
      }
    }

    const checklistItems = [
      { key: 'offerAccepted', label: 'Offer Letter Accepted by Candidate' },
      { key: 'documentsSubmitted', label: 'Pre-joining Documents Submitted' },
      { key: 'hrDocsComplete', label: 'HR Documents & Forms Completed' },
      { key: 'itAssetsReady', label: 'IT Assets & Laptop Assigned' },
      { key: 'joiningConfirmed', label: 'Date of Joining Confirmed' }
    ]

    return (
      <div>
        <div style={sectionStyle}>
          <Title level={5} style={{ marginBottom: 12 }}>Onboarding Checklist</Title>
          <Form form={form} layout="vertical" initialValues={{ checklist: checklistArray, onboardingRemarks: stageData.onboardingRemarks }}>
            <Form.Item name="checklist">
              <Checkbox.Group style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {checklistItems.map(item => (
                  <Checkbox key={item.key} value={item.key}>
                    <span style={{ fontSize: 13.5 }}>{item.label}</span>
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </Form.Item>
            <Form.Item label="Onboarding Notes" name="onboardingRemarks">
              <Input.TextArea rows={3} placeholder="Any special onboarding arrangements, buddy assignment, orientation date..." />
            </Form.Item>
          </Form>
          <Button type="primary" loading={saving} onClick={handleChecklistSave}>Save Onboarding Progress</Button>
        </div>
      </div>
    )
  }

  // ─── JOINED ───────────────────────────────────────────────────────────────────
  if (stage === 'Joined') {
    const isCompleted = app.status === 'Completed'
    return (
      <div>
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          {isCompleted ? (
            <>
              <Title level={4} style={{ color: '#22C55E' }}>Employee Profile Created!</Title>
              <Paragraph type="secondary">
                This candidate has been successfully onboarded as a full employee.
              </Paragraph>
              <Divider />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Button size="large" type="primary" disabled icon={<CheckCircleOutlined />} style={{ background: '#22C55E', borderColor: '#22C55E' }}>
                  ✓ Employee Created
                </Button>
                {app.employeeId && (
                  <Link to={`/employees/${app.employeeId}`} target="_blank">
                    <Button type="link" icon={<UserOutlined />}>View Employee Profile</Button>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              <Title level={4} style={{ color: '#22C55E' }}>Candidate Successfully Joined!</Title>
              <Paragraph type="secondary">
                The candidate has completed the entire recruitment pipeline and has officially joined the organisation.
              </Paragraph>
              <Divider />
              <Button size="large" type="primary" onClick={onConvertClick} icon={<TeamOutlined />} style={{ marginTop: 8 }}>
                Create Employee Profile
              </Button>
              <Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
                Clicking this button will open a confirmation modal to assign the employee details and convert the candidate.
              </Paragraph>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── APPLIED (overview only) ──────────────────────────────────────────────────
  return (
    <div style={sectionStyle}>
      <Title level={5} style={{ marginBottom: 8 }}>Application Overview</Title>
      <Paragraph type="secondary">This candidate is in the <Tag color={STAGE_COLORS[stage]}>{STAGE_LABELS[stage] || stage}</Tag> stage.</Paragraph>
      <Paragraph type="secondary">Use the action panel on the Kanban card to progress this application forward.</Paragraph>
    </div>
  )
}

// ─── Approval Status Summary Component ────────────────────────────────────────
function ApprovalStatusBar({ app }) {
  const allApproved = app.technicalApproved === true && app.hrApproved === true && app.managerApproved === true
  const anyPending = app.technicalApproved === null || app.hrApproved === null || app.managerApproved === null

  const pill = (label, approved) => {
    const bg = approved === true ? '#dcfce7' : approved === false ? '#fee2e2' : '#f1f5f9'
    const color = approved === true ? '#166534' : approved === false ? '#991b1b' : '#64748b'
    const icon = approved === true ? '✓' : approved === false ? '✗' : '⌛'
    return (
      <div key={label} style={{ padding: '4px 12px', borderRadius: 20, background: bg, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color }}>
        <span>{icon}</span><span>{label}</span>
      </div>
    )
  }

  const showBar = ['InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview', 'Offer'].includes(app.currentStage)
  if (!showBar) return null

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: allApproved ? '#f0fdf4' : '#fffbeb', border: allApproved ? '1px solid #86efac' : '1px solid #fde68a' }}>
      <Text strong style={{ fontSize: 12 }}>Approval Status:</Text>
      {pill('Technical', app.technicalApproved)}
      {pill('HR', app.hrApproved)}
      {pill('Manager', app.managerApproved)}
      {allApproved && <Tag color="success" style={{ marginLeft: 'auto' }}>Ready for Offer ✓</Tag>}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const { isDarkMode } = useUIStore()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewType, setViewType] = useState('kanban')

  // Filter Lookups
  const [publishedJobs, setPublishedJobs] = useState([])
  const [departments, setDepartments] = useState([])
  const [recruiters, setRecruiters] = useState([])

  // Filters
  const [search, setSearch] = useState('')
  const [jobFilter, setJobFilter] = useState(undefined)
  const [deptFilter, setDeptFilter] = useState(undefined)
  const [recruiterFilter, setRecruiterFilter] = useState(undefined)
  const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || undefined)
  const [sourceFilter, setSourceFilter] = useState(undefined)
  const [dateFilter, setDateFilter] = useState(null)
  const [experienceFilter, setExperienceFilter] = useState(undefined)
  const [priorityFilter, setPriorityFilter] = useState(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [candidateApps, setCandidateApps] = useState([])
  const [drawerTab, setDrawerTab] = useState('overview')

  // History modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historyApp, setHistoryApp] = useState(null)

  // Stage change confirm modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmApp, setConfirmApp] = useState(null)
  const [confirmTargetStage, setConfirmTargetStage] = useState(undefined)
  const [confirmActionType, setConfirmActionType] = useState(undefined)
  const [confirmRemarks, setConfirmRemarks] = useState('')
  const [confirmRejectionReason, setConfirmRejectionReason] = useState('')
  const [updatingStage, setUpdatingStage] = useState(false)

  // Notes
  const [newNote, setNewNote] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)

  // Employee conversion modal
  const [conversionModalOpen, setConversionModalOpen] = useState(false)
  const [conversionApp, setConversionApp] = useState(null)
  const [allActiveEmployees, setAllActiveEmployees] = useState([])
  const [designations, setDesignations] = useState([])
  const [convertingCandidate, setConvertingCandidate] = useState(false)
  const [conversionForm] = Form.useForm()

  const getFileUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    return `http://localhost:5110/api/v1/candidates/resume-download?filePath=${encodeURIComponent(path)}`
  }

  const loadLookups = async () => {
    try {
      const jobRes = await recruitmentService.getAdminPostings({ status: 'Active' })
      if (jobRes.success) setPublishedJobs(jobRes.data || [])
      const deptRes = await employeeService.getDepartments()
      if (deptRes.success) setDepartments(deptRes.data || [])
      const recRes = await employeeService.getEmployees({ role: 'RecruitmentManager', pageSize: 1000 })
      if (recRes.success) setRecruiters(recRes.data || [])

      const empRes = await employeeService.getEmployees({ pageSize: 1000 })
      if (empRes.success) setAllActiveEmployees(empRes.data || [])

      const desRes = await organizationService.getDesignations()
      if (desRes.success) setDesignations(desRes.data || [])
    } catch (err) {
      console.error('Failed to load filters metadata.')
    }
  }

  const loadApplications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await recruitmentService.getApplications({
        reqId: jobFilter || undefined,
        stage: stageFilter || undefined,
      })
      if (res.success) {
        let data = res.data || []
        if (search.trim()) {
          const s = search.trim().toLowerCase()
          data = data.filter(a => a.candidateName?.toLowerCase().includes(s) || a.jobTitle?.toLowerCase().includes(s))
        }
        if (deptFilter) data = data.filter(a => a.departmentName === deptFilter)
        if (recruiterFilter) data = data.filter(a => a.assignedRecruiterId === recruiterFilter)
        if (sourceFilter) data = data.filter(a => a.source === sourceFilter)
        if (dateFilter) data = data.filter(a => dayjs(a.applicationDate).isSame(dateFilter, 'day'))
        if (experienceFilter !== undefined) data = data.filter(a => (a.candidate?.totalExperience ?? 0) >= parseFloat(experienceFilter))
        setApplications(data)
      }
    } catch (err) {
      message.error('Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }, [search, jobFilter, deptFilter, recruiterFilter, stageFilter, sourceFilter, dateFilter, experienceFilter])

  useEffect(() => { loadLookups() }, [])
  useEffect(() => { loadApplications() }, [loadApplications])
  useEffect(() => {
    const stage = searchParams.get('stage')
    if (stage) setStageFilter(stage)
  }, [searchParams])

  const activeView = searchParams.get('view') || 'pipeline'
  const handleViewChange = (view) => {
    setSearchParams(prev => {
      prev.set('view', view)
      return prev
    })
  }

  const handleOpenDrawer = async (app, tabKey = 'overview') => {
    setDrawerOpen(true)
    setDrawerTab(tabKey)
    setDrawerLoading(true)
    try {
      const res = await recruitmentService.getApplication(app.appId || app.AppId)
      if (res.success) {
        setSelectedApp(res.data)
        const candRes = await recruitmentService.getApplications({ candidateId: res.data.candidateId })
        if (candRes.success) setCandidateApps(candRes.data || [])
      }
    } catch (err) {
      message.error('Failed to load application details.')
    } finally {
      setDrawerLoading(false)
    }
  }

  const handleOpenHistory = (app) => { setHistoryApp(app); setHistoryModalOpen(true) }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    setSubmittingNote(true)
    try {
      const res = await recruitmentService.addApplicationNote(selectedApp.appId, newNote.trim())
      if (res.success) {
        message.success('Note added.')
        setSelectedApp(res.data)
        setNewNote('')
        loadApplications()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit note.')
    } finally {
      setSubmittingNote(false)
    }
  }

  const triggerConfirmStageChange = (app, targetStage, actionType = null) => {
    const current = app.currentStage || app.CurrentStage
    if (targetStage && !isValidTransition(app, current, targetStage)) {
      message.error(`Invalid move from '${current}' to '${targetStage}'. Ensure all required approvals are completed.`)
      return
    }

    const activePipelineStages = ['Shortlisted', 'InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview', 'Offer', 'BackgroundCheck', 'Onboarding']
    if (activePipelineStages.includes(targetStage) && !activePipelineStages.includes(current)) {
      const conflictingApp = applications.find(a =>
        a.candidateId === app.candidateId &&
        (a.appId || a.AppId) !== (app.appId || app.AppId) &&
        a.status !== 'Rejected' && a.status !== 'Withdrawn' &&
        (activePipelineStages.includes(a.currentStage) || a.currentStage === 'Joined')
      )
      if (conflictingApp) {
        Modal.error({
          title: 'Active Pipeline Conflict',
          content: (
            <div style={{ marginTop: 8 }}>
              <Paragraph style={{ marginBottom: 8 }}>
                Candidate <strong>{app.candidateName}</strong> is already in an active interview pipeline for <strong>{conflictingApp.jobTitle}</strong> ({STAGE_LABELS[conflictingApp.currentStage] || conflictingApp.currentStage}).
              </Paragraph>
              <Paragraph type="danger" style={{ fontWeight: 600, margin: 0 }}>
                A candidate cannot be in multiple active interview pipelines simultaneously. Please complete or resolve the process for {conflictingApp.jobTitle} first.
              </Paragraph>
            </div>
          )
        })
        return
      }
    }

    if (targetStage === 'Offer') {
      const pending = []
      if (app.technicalApproved !== true) pending.push('Technical')
      if (app.hrApproved !== true) pending.push('HR')
      if (app.managerApproved !== true) pending.push('Manager')

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
        return
      }
    }

    setConfirmApp(app)
    setConfirmTargetStage(targetStage)
    setConfirmActionType(actionType)
    setConfirmRemarks('')
    setConfirmRejectionReason('')
    setConfirmModalOpen(true)
  }

  const handleConfirmStageChange = async () => {
    const target = confirmTargetStage
    if (target === 'Rejected' && confirmActionType !== 'OfferDeclined' && confirmActionType !== 'BGVFailed') {
      if (!confirmRejectionReason || confirmRejectionReason.trim().length < 20) {
        message.warning('Enter a rejection reason of at least 20 characters.')
        return
      }
    }
    if (confirmActionType === 'BGVFailed' && (!confirmRemarks || confirmRemarks.trim().length < 20)) {
      message.warning('Enter a BGV failure reason of at least 20 characters.')
      return
    }

    setUpdatingStage(true)
    try {
      const payload = {
        stage: target || confirmApp.currentStage,
        rejectionReason: target === 'Rejected' && confirmActionType !== 'OfferDeclined' && confirmActionType !== 'BGVFailed'
          ? confirmRejectionReason : undefined,
        remarks: confirmRemarks.trim() || undefined,
        actionType: confirmActionType || undefined
      }
      const res = await recruitmentService.updateApplicationStage(confirmApp.appId || confirmApp.AppId, payload)
      if (res.success) {
        message.success('Stage updated successfully.')
        setConfirmModalOpen(false)
        loadApplications()
        if (drawerOpen && selectedApp?.appId === (confirmApp.appId || confirmApp.AppId)) {
          handleOpenDrawer(confirmApp, drawerTab)
        }
      }
    } catch (err) {
      message.error(err.response?.data?.errors?.[0] || err.response?.data?.message || 'Failed to update stage.')
    } finally {
      setUpdatingStage(false)
    }
  }

  const triggerConversionModal = (app) => {
    let expectedDoj = dayjs().format('YYYY-MM-DD')
    try {
      const stageData = JSON.parse(app.stageDataJson || '{}')
      if (stageData.expectedDOJ) {
        expectedDoj = stageData.expectedDOJ
      }
    } catch {}

    setConversionApp(app)
    const initialDept = departments?.find(d => d.deptName === app.departmentName)?.deptId
    const initialDesig = designations?.find(d => d.title === app.jobTitle)?.designationId

    conversionForm.setFieldsValue({
      deptId: initialDept || undefined,
      designationId: initialDesig || undefined,
      joiningDate: expectedDoj,
      reportingManagerId: undefined,
      employmentType: 'FullTime'
    })
    setConversionModalOpen(true)
  }

  const handleConvertCandidate = async () => {
    try {
      const values = await conversionForm.validateFields()
      setConvertingCandidate(true)

      const payload = {
        deptId: values.deptId,
        designationId: values.designationId,
        joiningDate: values.joiningDate,
        reportingManagerId: values.reportingManagerId || null,
        employmentType: values.employmentType
      }

      const res = await recruitmentService.convertCandidate(conversionApp.appId, payload)
      if (res.success) {
        message.success('Candidate successfully converted to Employee!')
        setConversionModalOpen(false)
        loadApplications()
        if (drawerOpen && selectedApp?.appId === conversionApp.appId) {
          handleOpenDrawer(conversionApp, drawerTab)
        }
      }
    } catch (err) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message)
      } else {
        message.error('Failed to convert candidate to employee.')
      }
    } finally {
      setConvertingCandidate(false)
    }
  }

  const clearFilters = () => {
    setSearch(''); setJobFilter(undefined); setDeptFilter(undefined)
    setRecruiterFilter(undefined); setStageFilter(undefined); setSourceFilter(undefined)
    setDateFilter(null); setExperienceFilter(undefined); setPriorityFilter(undefined)
    setSearchParams({})
  }

  // ─── KPI counts ───────────────────────────────────────────────────────────────
  const totalApps = applications.length
  const appliedCount = applications.filter(a => a.currentStage === 'Applied').length
  const interviewingCount = applications.filter(a => ['InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview'].includes(a.currentStage)).length
  const offersCount = applications.filter(a => a.currentStage === 'Offer').length
  const joinedCount = applications.filter(a => a.currentStage === 'Joined').length
  const rejectedCount = applications.filter(a => a.currentStage === 'Rejected').length

  const renderKpiCards = () => (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      {[
        { title: 'Total Applications', value: totalApps, icon: <TeamOutlined />, color: '#3B82F6' },
        { title: 'Applied Queue', value: appliedCount, icon: <FolderOpenOutlined />, color: '#06B6D4' },
        { title: 'Interviewing', value: interviewingCount, icon: <CalendarOutlined />, color: '#EAB308' },
        { title: 'Offers Extended', value: offersCount, icon: <DollarOutlined />, color: '#F97316' },
        { title: 'Joined', value: joinedCount, icon: <CheckCircleOutlined />, color: '#22C55E' },
        { title: 'Rejected', value: rejectedCount, icon: <WarningOutlined />, color: '#EF4444' }
      ].map(k => (
        <Col key={k.title} xs={12} sm={8} lg={4}>
          <Card variant="borderless" style={{ borderRadius: 10, border: 'var(--border-glass)' }}
            styles={{ body: { padding: '14px 16px' } }}>
            <Statistic title={k.title} value={k.value}
              prefix={React.cloneElement(k.icon, { style: { color: k.color } })} />
          </Card>
        </Col>
      ))}
    </Row>
  )

  // ─── Kanban card action panel ─────────────────────────────────────────────────
  const getCardLockMessage = (app, colKey) => {
    let stageData = {}
    try { stageData = JSON.parse(app.stageDataJson || '{}') } catch {}

    if (colKey === 'Screening') {
      const screening = stageData.screening || stageData
      if (!screening.screeningRemarks || !screening.internalNotes || !screening.recommendation) {
        return '🔒 Complete Screening'
      }
    }
    if (colKey === 'InterviewRound1') {
      const tech = stageData.technicalInterview || {}
      if (tech.approved !== true && app.technicalApproved !== true) {
        return '🔒 Awaiting Tech Approval'
      }
    }
    if (colKey === 'InterviewRound2') {
      const hr = stageData.hrInterview || {}
      if (hr.approved !== true && app.hrApproved !== true) {
        return '🔒 Awaiting HR Approval'
      }
    }
    if (colKey === 'ManagerDiscussion') {
      const mgr = stageData.managerInterview || {}
      const hr = stageData.hrInterview || {}
      const tech = stageData.technicalInterview || {}
      
      const isTechApproved = tech.approved === true || app.technicalApproved === true
      const isHrApproved = hr.approved === true || app.hrApproved === true
      const isMgrApproved = mgr.approved === true || app.managerApproved === true
      const isScreeningCompleted = !!((stageData.screening || stageData).screeningRemarks)
      
      if (!isScreeningCompleted || !isTechApproved || !isHrApproved || !isMgrApproved) {
        return '🔒 Awaiting Approvals'
      }
    }
    if (colKey === 'Offer') {
      const isOfferCompleted = !!(stageData.offeredCTC && stageData.offerDate && stageData.expectedDOJ && stageData.offerStatus === 'Accepted')
      if (!isOfferCompleted) {
        return '🔒 Complete Offer Details'
      }
    }
    if (colKey === 'BackgroundVerification') {
      const isBgvCompleted = !!(stageData.bgvAgency && stageData.verificationStatus === 'Completed')
      if (!isBgvCompleted) {
        return '🔒 Complete Background Verification'
      }
    }
    if (colKey === 'Onboarding') {
      const checklistArray = Array.isArray(stageData.checklist)
        ? stageData.checklist
        : (typeof stageData.checklist === 'object' && stageData.checklist !== null
            ? Object.keys(stageData.checklist).filter(k => stageData.checklist[k])
            : [])
      if (checklistArray.length < 5) {
        return '🔒 Complete Onboarding'
      }
    }
    return null
  }

  const renderCardActions = (app, colKey) => {
    if (colKey === 'Joined') {
      if (app.status === 'Completed') {
        return (
          <div style={{ marginTop: 8, color: '#22C55E', fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircleOutlined /> Employee Created
          </div>
        )
      } else {
        return (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
            <Button size="small" type="primary" style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4 }}
              onClick={() => triggerConversionModal(app)}>Create Employee</Button>
            <Button size="small" type="default" style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4 }}
              onClick={() => handleOpenDrawer(app, 'workspace')}>Workspace</Button>
          </div>
        )
      }
    }

    const config = COLUMN_CONFIGS[colKey]
    if (!config) return null
    const directActions = config.actions.slice(0, 2)
    const moreActions = config.actions.slice(2)

    const handleAction = (action) => {
      if (action.isDrawer) { handleOpenDrawer(app, 'workspace'); return }
      triggerConfirmStageChange(app, action.targetStage, action.actionType)
    }

    const popoverContent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
        {moreActions.map(act => (
          <Button key={act.key} size="small" type={act.type === 'danger' ? 'primary' : 'default'}
            danger={act.type === 'danger'} style={{ fontSize: 11, textAlign: 'left' }}
            onClick={() => handleAction(act)}>{act.label}</Button>
        ))}
        <Divider style={{ margin: '4px 0' }} />
        <Button size="small" type="text" style={{ fontSize: 11 }} onClick={() => handleOpenDrawer(app, 'overview')}>View Details</Button>
        <Button size="small" type="text" style={{ fontSize: 11 }} onClick={() => handleOpenHistory(app)}>View History</Button>
        {!isReadOnlyMode && !['Applied', 'Rejected', 'Withdrawn'].includes(colKey) && (
          <Button size="small" type="text" style={{ fontSize: 11, color: '#FAA71A' }}
            onClick={() => triggerConfirmStageChange(app, 'Applied')}>Move Back to Applied</Button>
        )}
        {!isReadOnlyMode && colKey !== 'Rejected' && (
          <Button size="small" type="text" danger style={{ fontSize: 11 }}
            onClick={() => triggerConfirmStageChange(app, 'Rejected')}>Reject Candidate</Button>
        )}
        {!isReadOnlyMode && colKey !== 'Withdrawn' && (
          <Button size="small" type="text" style={{ fontSize: 11, color: '#6B7280' }}
            onClick={() => triggerConfirmStageChange(app, 'Withdrawn')}>Withdraw</Button>
        )}
      </div>
    )

    const lockMessage = getCardLockMessage(app, colKey)

    return (
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
        {!isReadOnlyMode && directActions.map(act => {
          if (act.key.startsWith('move_') && lockMessage) {
            return (
              <Button key={act.key} size="small" disabled style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
                {lockMessage}
              </Button>
            )
          }
          return (
            <Button key={act.key} size="small"
              type={act.type === 'primary' ? 'primary' : 'default'}
              danger={act.type === 'danger'}
              style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4 }}
              onClick={() => handleAction(act)}>{act.label}</Button>
          )
        })}
        {isReadOnlyMode && (
           <Button size="small" type="primary" style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4 }}
              onClick={() => handleOpenDrawer(app, 'workspace')}>View Workspace</Button>
        )}
        <Popover content={popoverContent} trigger="click" placement="bottomRight">
          <Button size="small" shape="circle" icon={<MoreOutlined />} style={{ fontSize: 10.5 }} />
        </Popover>
      </div>
    )
  }

  // ─── Kanban board ─────────────────────────────────────────────────────────────
  const renderKanbanBoard = (appsToRender = applications) => (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, height: 'calc(100vh - 360px)', minHeight: 460 }}>
      {Object.entries(COLUMN_CONFIGS).map(([colKey, col]) => {
        const colApps = appsToRender.filter(app => col.stages.includes(app.currentStage))
        return (
          <div key={colKey} style={{ width: 270, minWidth: 270, background: isDarkMode ? '#0f1130' : '#f8fafc', borderRadius: 12, display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Column Header */}
            <div style={{ padding: '10px 14px', borderBottom: `2px solid ${col.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.color }} />
                <span style={{ fontWeight: 700, fontSize: 12.5 }}>{col.title}</span>
              </div>
              <Badge count={colApps.length} style={{ backgroundColor: col.color }} />
            </div>
            {/* Cards */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colApps.map(app => {
                const prio = getPriority(app.candidate?.totalExperience)
                let parsedData = {}
                try { parsedData = JSON.parse(app.stageDataJson || '{}') } catch {}
                const isTechApproved = app.technicalApproved === true || parsedData.technicalInterview?.approved === true
                const isHrApproved = app.hrApproved === true || parsedData.hrInterview?.approved === true
                const isMgrApproved = app.managerApproved === true || parsedData.managerInterview?.approved === true

                const activePipelineStages = ['Shortlisted', 'InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview', 'Offer', 'BackgroundCheck', 'Onboarding']
                const conflictingOtherApp = appsToRender.find(other =>
                  other.candidateId === app.candidateId &&
                  (other.appId || other.AppId) !== (app.appId || app.AppId) &&
                  other.status !== 'Rejected' && other.status !== 'Withdrawn' &&
                  (activePipelineStages.includes(other.currentStage) || other.currentStage === 'Joined')
                )

                return (
                  <Card key={app.appId} size="small" hoverable
                    style={{ borderRadius: 8, border: conflictingOtherApp && !activePipelineStages.includes(app.currentStage) ? '1px solid #ffbb96' : '1px solid rgba(255,255,255,0.06)', background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#fff' }}
                    styles={{ body: { padding: 10 } }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 13, color: 'var(--color-primary-light)', cursor: 'pointer' }}
                        onClick={() => handleOpenDrawer(app, 'workspace')}>
                        {app.candidateName}
                      </Text>
                      <Tag style={{ fontSize: 9.5, margin: 0, borderRadius: 4, background: prio.color, color: '#fff', border: 'none' }}>
                        {prio.label}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.75, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div><Text type="secondary">Role:</Text> <b>{app.jobTitle}</b></div>
                      {app.departmentName && <div><Text type="secondary">Dept:</Text> {app.departmentName}</div>}
                      <div><Text type="secondary">Exp:</Text> <b>{app.candidate?.totalExperience ?? 0} yrs</b></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.6 }}>
                        <span>{app.source || 'Other'}</span>
                        <span>{app.assignedRecruiterName || 'Unassigned'}</span>
                      </div>
                    </div>
                    {conflictingOtherApp && (
                      <div style={{ marginTop: 4 }}>
                        <Tag color="volcano" style={{ fontSize: 9, margin: 0, borderRadius: 4 }}>
                          <WarningOutlined /> Active in {conflictingOtherApp.jobTitle}
                        </Tag>
                      </div>
                    )}
                    {/* Approval indicator for interview/offer stages */}
                    {['InterviewL1', 'InterviewL2', 'ManagerReview', 'HRInterview', 'Offer'].includes(app.currentStage) && (
                      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                        {isTechApproved && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#22C55E', color: '#fff' }}>TECH ✓</span>}
                        {isHrApproved && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#22C55E', color: '#fff' }}>HR ✓</span>}
                        {isMgrApproved && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#22C55E', color: '#fff' }}>MGR ✓</span>}
                      </div>
                    )}
                    {renderCardActions(app, colKey)}
                  </Card>
                )
              })}
              {colApps.length === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center', opacity: 0.25 }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ─── Table columns ────────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'App ID', dataIndex: 'appId', key: 'appId', width: 100,
      render: (v, r) => <Button type="link" onClick={() => handleOpenDrawer(r)} style={{ padding: 0, fontWeight: 500 }}>{`App-${(v || '').substring(0, 8)}`}</Button>
    },
    {
      title: 'Candidate', key: 'candidate', width: 200,
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: '#7C3AED', fontWeight: 600 }}>{r.candidateName?.[0]}</Avatar>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-primary-light)', cursor: 'pointer' }} onClick={() => handleOpenDrawer(r)}>{r.candidateName}</div>
            <div style={{ fontSize: 11, opacity: 0.55 }}>{r.candidateEmail}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Applied Job', dataIndex: 'jobTitle', key: 'jobTitle', width: 180,
      render: (v, r) => <div><span style={{ fontWeight: 500 }}>{v}</span>{r.departmentName && <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{r.departmentName}</div>}</div>
    },
    {
      title: 'Recruiter', dataIndex: 'assignedRecruiterName', key: 'recruiter', width: 130,
      render: v => v ? <Tag color="geekblue">{v}</Tag> : <span style={{ opacity: 0.4 }}>Unassigned</span>
    },
    {
      title: 'Applied Date', dataIndex: 'applicationDate', key: 'appliedDate', width: 110,
      render: v => dayjs(v).format('DD MMM YYYY')
    },
    {
      title: 'Stage', dataIndex: 'currentStage', key: 'currentStage', width: 150,
      render: v => <Tag color={STAGE_COLORS[v] || 'default'} style={{ fontWeight: 500 }}>{STAGE_LABELS[v] || v}</Tag>
    },
    {
      title: 'Approvals', key: 'approvals', width: 110,
      render: (_, r) => {
        let sd = {}
        try { sd = JSON.parse(r.stageDataJson || '{}') } catch {}
        const isT = r.technicalApproved === true || sd.technicalInterview?.approved === true
        const isH = r.hrApproved === true || sd.hrInterview?.approved === true
        const isM = r.managerApproved === true || sd.managerInterview?.approved === true
        return (
          <Space size={2}>
            {isT && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#22C55E', color: '#fff' }}>TECH ✓</span>}
            {isH && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#22C55E', color: '#fff' }}>HR ✓</span>}
            {isM && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#22C55E', color: '#fff' }}>MGR ✓</span>}
          </Space>
        )
      }
    },
    {
      title: 'Actions', key: 'actions', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleOpenDrawer(r, 'workspace')}>Workspace</Button>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => handleOpenHistory(r)}>History</Button>
        </Space>
      )
    }
  ]

  // ─── Parse timeline/notes safely ──────────────────────────────────────────────
  const timelineEvents = useMemo(() => {
    try { return JSON.parse(selectedApp?.timelineEventsJson || '[]') } catch { return [] }
  }, [selectedApp?.timelineEventsJson])

  const notes = useMemo(() => {
    try { return JSON.parse(selectedApp?.notesJson || '[]') } catch { return [] }
  }, [selectedApp?.notesJson])

  const filteredApplications = useMemo(() => {
    if (activeView === 'pipeline') {
      return applications.filter(a => !['Rejected', 'Withdrawn', 'Offer Declined'].includes(a.status) && !['Rejected', 'Withdrawn', 'Offer Declined'].includes(a.currentStage))
    }
    if (activeView === 'closed') {
      return applications.filter(a => ['Rejected', 'Withdrawn', 'Offer Declined'].includes(a.status) || ['Rejected', 'Withdrawn', 'Offer Declined'].includes(a.currentStage))
    }
    if (activeView === 'archived') {
      return applications.filter(a => a.isArchived === true)
    }
    return applications
  }, [applications, activeView])

  const currentViewType = (activeView === 'closed' || activeView === 'archived') ? 'table' : viewType
  const isReadOnlyMode = activeView === 'closed' || activeView === 'archived'

  // ─── Main Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '0 24px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Job Applications Pipeline"
        subtitle="Drive candidates through screening, interviews, offers, and onboarding."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Recruitment', path: '/recruitment' }, { label: 'Applications' }]}
      />

      <div style={{ marginBottom: 20 }}>
        <Segmented
          options={[
            { label: 'Recruitment Pipeline', value: 'pipeline' },
            { label: 'Intake Queue', value: 'intake' },
            { label: 'Closed Applications', value: 'closed' },
            { label: 'Archived', value: 'archived' }
          ]}
          value={activeView}
          onChange={handleViewChange}
          size="large"
          style={{ padding: 4 }}
        />
      </div>

      <div style={{ display: activeView === 'intake' ? 'block' : 'none' }}>
        <PendingQueuePanel />
      </div>

      <div style={{ display: activeView !== 'intake' ? 'flex' : 'none', flexDirection: 'column', flex: 1 }}>


      {/* View Toggle + Filter Bar */}
      <Card size="small" style={{ marginBottom: 16, background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <Space>
            <Button type={currentViewType === 'kanban' ? 'primary' : 'default'} icon={<AppstoreOutlined />} onClick={() => setViewType('kanban')} style={{ borderRadius: 6 }} disabled={activeView === 'closed' || activeView === 'archived'}>Kanban View</Button>
            <Button type={currentViewType === 'table' ? 'primary' : 'default'} icon={<UnorderedListOutlined />} onClick={() => setViewType('table')} style={{ borderRadius: 6 }}>Table View</Button>
          </Space>
          <Text type="secondary" style={{ fontSize: 12.5 }}>
            Loaded: <Text strong>{filteredApplications.length}</Text> applications
          </Text>
        </div>
        <Row gutter={[10, 10]} align="middle">
          <Col xs={24} md={6}>
            <Input placeholder="Search candidate, job..." prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} allowClear />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="Job Opening" style={{ width: '100%' }} value={jobFilter} onChange={v => setJobFilter(v)} allowClear>
              {publishedJobs.map(j => <Option key={j.jobId} value={j.reqId}>{j.jobTitle}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="Department" style={{ width: '100%' }} value={deptFilter} onChange={v => setDeptFilter(v)} allowClear>
              {departments.map(d => <Option key={d.deptId} value={d.deptName}>{d.deptName}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="Recruiter" style={{ width: '100%' }} value={recruiterFilter} onChange={v => setRecruiterFilter(v)} allowClear>
              {recruiters.map(r => <Option key={r.employeeId} value={r.userId}>{r.firstName} {r.lastName}</Option>)}
            </Select>
          </Col>
          {currentViewType === 'table' && (
            <Col xs={12} sm={6} md={3}>
              <Select placeholder="Stage" style={{ width: '100%' }} value={stageFilter} onChange={v => setStageFilter(v)} allowClear>
                {Object.entries(STAGE_LABELS).map(([k, label]) => <Option key={k} value={k}>{label}</Option>)}
              </Select>
            </Col>
          )}
          <Col xs={12} sm={6} md={3}>
            <Select placeholder="Experience" style={{ width: '100%' }} value={experienceFilter} onChange={v => setExperienceFilter(v)} allowClear
              options={[{ value: '0', label: 'Any' }, { value: '2', label: '≥ 2 yrs' }, { value: '5', label: '≥ 5 yrs' }, { value: '10', label: '≥ 10 yrs' }]} />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Button block type="dashed" onClick={clearFilters}>Reset</Button>
          </Col>
        </Row>
      </Card>

      {/* KPI Cards */}
      {renderKpiCards()}

      {/* Board */}
      {currentViewType === 'kanban' ? renderKanbanBoard(filteredApplications) : (
        <Card style={{ flex: 1, borderRadius: 12, border: 'var(--border-glass)' }} styles={{ body: { padding: 0 } }}>
          <Table columns={columns} dataSource={filteredApplications} rowKey={r => r.appId}
            loading={loading}
            pagination={{ current: page, pageSize, onChange: (p, ps) => { setPage(p); setPageSize(ps) }, showSizeChanger: true }}
            scroll={{ x: 1200 }} />
        </Card>
      )}

      </div>

      {/* ─── Confirm Stage Change Modal ──────────────────────────────────────── */}
      <Modal
        title={<Space><WarningOutlined style={{ color: confirmTargetStage === 'Rejected' ? '#EF4444' : '#FAA71A' }} /><span>Confirm Stage Transition</span></Space>}
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={handleConfirmStageChange}
        confirmLoading={updatingStage}
        okButtonProps={{
          danger: confirmTargetStage === 'Rejected',
          disabled: (confirmTargetStage === 'Rejected' && confirmActionType !== 'OfferDeclined' && confirmActionType !== 'BGVFailed' && confirmRejectionReason.trim().length < 20) ||
                    (confirmActionType === 'BGVFailed' && confirmRemarks.trim().length < 20)
        }}
        destroyOnHidden
      >
        <div style={{ marginTop: 16 }}>
          <Paragraph>
            Transition <Text strong>{confirmApp?.candidateName}</Text> to{' '}
            <Text strong>{confirmTargetStage ? (STAGE_LABELS[confirmTargetStage] || confirmTargetStage) : (confirmActionType || 'Next Stage')}</Text>?
          </Paragraph>
          <Form layout="vertical">
            {confirmTargetStage === 'Rejected' && confirmActionType !== 'OfferDeclined' && confirmActionType !== 'BGVFailed' && (
              <Form.Item label="Rejection Reason * (min 20 characters)" required>
                <Input.TextArea rows={3} placeholder="Reason for rejection..." value={confirmRejectionReason} onChange={e => setConfirmRejectionReason(e.target.value)} />
                <div style={{ fontSize: 11, textAlign: 'right', marginTop: 4, opacity: 0.6 }}>{confirmRejectionReason.trim().length}/20</div>
              </Form.Item>
            )}
            {confirmActionType === 'BGVFailed' && (
              <Form.Item label="BGV Failure Reason * (min 20 characters)" required>
                <Input.TextArea rows={3} placeholder="Discrepancy details..." value={confirmRemarks} onChange={e => setConfirmRemarks(e.target.value)} />
                <div style={{ fontSize: 11, textAlign: 'right', marginTop: 4, opacity: 0.6 }}>{confirmRemarks.trim().length}/20</div>
              </Form.Item>
            )}
            {confirmActionType !== 'BGVFailed' && (
              <Form.Item label="Remarks (Optional)">
                <Input.TextArea rows={2} placeholder="Optional remarks for timeline..." value={confirmRemarks} onChange={e => setConfirmRemarks(e.target.value)} />
              </Form.Item>
            )}
          </Form>
        </div>
      </Modal>

      {/* ─── History Modal ────────────────────────────────────────────────────── */}
      <Modal
        title={<span><HistoryOutlined /> History — {historyApp?.candidateName}</span>}
        open={historyModalOpen}
        onCancel={() => { setHistoryModalOpen(false); setHistoryApp(null) }}
        footer={<Button type="primary" onClick={() => { setHistoryModalOpen(false); setHistoryApp(null) }}>Close</Button>}
        width={620}
        destroyOnHidden
      >
        <div style={{ padding: '12px 0' }}>
          <Timeline mode="left" style={{ marginTop: 12 }}>
            {(() => {
              try {
                const evts = JSON.parse(historyApp?.timelineEventsJson || '[]')
                return evts.slice().reverse().map((evt, idx) => (
                  <Timeline.Item key={idx} color={evt.Event?.includes('Reject') || evt.Event?.includes('Failed') ? 'red' : evt.Event?.includes('Joined') || evt.Event?.includes('Approved') ? 'green' : 'blue'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text strong>{evt.Event}</Text>
                      <Text type="secondary" style={{ fontSize: 10.5 }}>{dayjs(evt.Timestamp).format('DD MMM YYYY HH:mm')}</Text>
                    </div>
                    {evt.User && <div style={{ fontSize: 11, color: 'var(--color-primary-light)' }}>By: {evt.User}</div>}
                    {evt.PreviousStage && evt.NewStage && evt.PreviousStage !== evt.NewStage && (
                      <div style={{ fontSize: 11 }}>
                        <Tag style={{ fontSize: 9 }}>{STAGE_LABELS[evt.PreviousStage] || evt.PreviousStage}</Tag>
                        <ArrowRightOutlined style={{ fontSize: 9, margin: '0 4px' }} />
                        <Tag color="blue" style={{ fontSize: 9 }}>{STAGE_LABELS[evt.NewStage] || evt.NewStage}</Tag>
                      </div>
                    )}
                    {evt.Remarks && <div style={{ fontSize: 11.5, marginTop: 4, padding: '4px 8px', borderLeft: '2px solid #ccc', opacity: 0.8 }}>{evt.Remarks}</div>}
                  </Timeline.Item>
                ))
              } catch { return <Empty description="No timeline data." /> }
            })()}
          </Timeline>
        </div>
      </Modal>

      {/* ─── Employee Conversion Confirmation Modal ─────────────────────────────── */}
      <Modal
        title={<span><TeamOutlined /> Convert Candidate to Employee</span>}
        open={conversionModalOpen}
        onCancel={() => setConversionModalOpen(false)}
        onOk={handleConvertCandidate}
        confirmLoading={convertingCandidate}
        destroyOnHidden
      >
        <div style={{ marginTop: 16 }}>
          <Alert
            message="Confirm Employee Creation"
            description={`You are about to create an employee record for ${conversionApp?.candidateName}. Candidate status will be set to Joined, and application status will be marked as Completed.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form form={conversionForm} layout="vertical">
            <Form.Item
              name="deptId"
              label="Department"
              rules={[{ required: true, message: 'Department is required' }]}
            >
              <Select placeholder="Select Department">
                {departments.map(d => (
                  <Option key={d.deptId} value={d.deptId}>{d.deptName}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="designationId"
              label="Designation"
              rules={[{ required: true, message: 'Designation is required' }]}
            >
              <Select placeholder="Select Designation">
                {designations.map(des => (
                  <Option key={des.designationId} value={des.designationId}>{des.title}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="joiningDate"
              label="Date of Joining"
              rules={[{ required: true, message: 'Date of joining is required' }]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="reportingManagerId"
              label="Reporting Manager (Optional)"
            >
              <Select placeholder="Select Manager" showSearch optionFilterProp="children" allowClear>
                {allActiveEmployees.map(emp => (
                  <Option key={emp.employeeId} value={emp.employeeId}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="employmentType"
              label="Employment Type"
              rules={[{ required: true, message: 'Employment type is required' }]}
            >
              <Select placeholder="Select Type">
                <Option value="FullTime">Full Time</Option>
                <Option value="Permanent">Permanent</Option>
                <Option value="Probationary">Probationary</Option>
                <Option value="Contract">Contract</Option>
                <Option value="Internship">Internship</Option>
              </Select>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* ─── Application Details Drawer ───────────────────────────────────────── */}
      <Drawer
        title={
          selectedApp ? (
            <Space>
              <span>Application — {selectedApp.candidateName}</span>
              <Tag color={STAGE_COLORS[selectedApp.currentStage] || 'purple'}>
                {STAGE_LABELS[selectedApp.currentStage] || selectedApp.currentStage}
              </Tag>
            </Space>
          ) : 'Application Details'
        }
        width={900}
        placement="right"
        onClose={() => { setDrawerOpen(false); setSelectedApp(null); setCandidateApps([]) }}
        open={drawerOpen}
        loading={drawerLoading}
        destroyOnHidden
      >
        {selectedApp ? (
          <Tabs activeKey={drawerTab} onChange={setDrawerTab} items={[
            {
              key: 'overview',
              label: <span><UserOutlined /> Overview</span>,
              children: (
                <div>
                  <ApprovalStatusBar app={selectedApp} />
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Descriptions title="Profile" column={1} bordered size="small">
                        <Descriptions.Item label="Name"><Text strong>{selectedApp.candidateName}</Text></Descriptions.Item>
                        <Descriptions.Item label="Email">{selectedApp.candidateEmail}</Descriptions.Item>
                        <Descriptions.Item label="Recruiter">{selectedApp.assignedRecruiterName || 'Unassigned'}</Descriptions.Item>
                        <Descriptions.Item label="Applied For">{selectedApp.jobTitle}</Descriptions.Item>
                        <Descriptions.Item label="Department">{selectedApp.departmentName || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Applied Date">{dayjs(selectedApp.applicationDate).format('DD MMM YYYY')}</Descriptions.Item>
                        {selectedApp.employeeId && (
                          <Descriptions.Item label="Employee Profile">
                            <Link to={`/employees/${selectedApp.employeeId}`} target="_blank">
                              <Tag color="success" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircleOutlined /> View Employee Profile
                              </Tag>
                            </Link>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </Col>
                    <Col span={12}>
                      <Descriptions title="Compensation" column={1} bordered size="small">
                        <Descriptions.Item label="Current CTC">{selectedApp.candidate?.currentCTC ? `₹ ${Number(selectedApp.candidate.currentCTC).toLocaleString()}` : '—'}</Descriptions.Item>
                        <Descriptions.Item label="Expected CTC">{selectedApp.candidate?.expectedCTC ? `₹ ${Number(selectedApp.candidate.expectedCTC).toLocaleString()}` : '—'}</Descriptions.Item>
                        <Descriptions.Item label="Notice Period">{selectedApp.candidate?.noticePeriodDays != null ? `${selectedApp.candidate.noticePeriodDays} days` : '—'}</Descriptions.Item>
                        <Descriptions.Item label="Experience">{selectedApp.candidate?.totalExperience != null ? `${selectedApp.candidate.totalExperience} yrs` : '—'}</Descriptions.Item>
                        <Descriptions.Item label="Company">{selectedApp.candidate?.currentCompany || '—'}</Descriptions.Item>
                      </Descriptions>
                    </Col>
                  </Row>
                  <Divider style={{ margin: '16px 0' }} />
                  <Title level={5}>Technical Skills</Title>
                  {selectedApp.candidate?.skills
                    ? selectedApp.candidate.skills.split(',').map((s, i) => <Tag key={i} color="blue" style={{ marginBottom: 6 }}>{s.trim()}</Tag>)
                    : <Text type="secondary">No skills specified.</Text>}
                </div>
              )
            },
            {
              key: 'resume',
              label: <span><FilePdfOutlined /> Resume</span>,
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Title level={5} style={{ margin: 0 }}>Candidate Resume</Title>
                    {selectedApp.candidate?.resumeFilePath && (
                      <Button type="primary" ghost size="small" icon={<DownloadOutlined />} href={getFileUrl(selectedApp.candidate.resumeFilePath)} target="_blank">Download</Button>
                    )}
                  </div>
                  {selectedApp.candidate?.resumeFilePath ? (
                    selectedApp.candidate.resumeFilePath.toLowerCase().endsWith('.pdf') ? (
                      <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden', height: 560 }}>
                        <iframe title="Resume" src={getFileUrl(selectedApp.candidate.resumeFilePath)} width="100%" height="100%" style={{ border: 'none' }} />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <FilePdfOutlined style={{ fontSize: 40, color: '#3B82F6', marginBottom: 12 }} />
                        <Paragraph>Resume is a document file. Click below to download and view.</Paragraph>
                        <Button type="primary" href={getFileUrl(selectedApp.candidate.resumeFilePath)} target="_blank">Download to View</Button>
                      </div>
                    )
                  ) : <Paragraph type="secondary">No resume uploaded.</Paragraph>}
                </div>
              )
            },
            {
              key: 'workspace',
              label: <span><EditOutlined /> Workspace</span>,
              children: (
                <fieldset disabled={isReadOnlyMode} style={{ border: 'none', margin: 0, padding: 0 }}>
                  <StageWorkspace
                    app={selectedApp}
                    isDarkMode={isDarkMode}
                    user={user}
                    isReadOnly={isReadOnlyMode}
                    onSaved={(updatedApp) => {
                      setSelectedApp(prev => ({ ...prev, ...updatedApp }))
                      loadApplications()
                    }}
                    onConvertClick={() => triggerConversionModal(selectedApp)}
                  />
                </fieldset>
              )
            },
            {
              key: 'timeline',
              label: <span><ClockCircleOutlined /> Timeline</span>,
              children: (
                <Timeline mode="left" style={{ marginTop: 12 }}>
                  {timelineEvents.length === 0 && <Empty description="No events yet." />}
                  {timelineEvents.slice().reverse().map((evt, idx) => (
                    <Timeline.Item key={idx} color={evt.Event?.includes('Reject') || evt.Event?.includes('Failed') ? 'red' : evt.Event?.includes('Approved') || evt.Event?.includes('Joined') ? 'green' : 'blue'}>
                      <Text strong>{evt.Event}</Text>
                      {evt.User && <div style={{ fontSize: 11, opacity: 0.6 }}>By: {evt.User}</div>}
                      {evt.Remarks && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{evt.Remarks}</div>}
                      <div style={{ fontSize: 10.5, opacity: 0.45 }}>{dayjs(evt.Timestamp).format('DD MMM YYYY HH:mm')}</div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )
            },
            {
              key: 'notes',
              label: <span><CommentOutlined /> Notes</span>,
              children: (
                <div>
                  <Input.TextArea rows={3} placeholder="Add a recruiter note..." value={newNote} onChange={e => setNewNote(e.target.value)} style={{ marginBottom: 10 }} />
                  <div style={{ textAlign: 'right', marginBottom: 20 }}>
                    <Button type="primary" onClick={handleAddNote} loading={submittingNote} disabled={!newNote.trim()}>Add Note</Button>
                  </div>
                  <Divider>Previous Notes</Divider>
                  {notes.length === 0 && <Empty description="No notes yet." />}
                  <List dataSource={notes.slice().reverse()} renderItem={note => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={<Space><Text strong>{note.Author}</Text><Text type="secondary" style={{ fontSize: 11 }}>{dayjs(note.Timestamp).format('DD MMM YYYY HH:mm')}</Text></Space>}
                        description={<Text style={{ whiteSpace: 'pre-wrap' }}>{note.Content}</Text>}
                      />
                    </List.Item>
                  )} />
                </div>
              )
            },
            {
              key: 'applications',
              label: <span><HistoryOutlined /> Applications</span>,
              children: (
                <div>
                  <Paragraph type="secondary">Other applications this candidate has submitted.</Paragraph>
                  <List
                    dataSource={candidateApps.filter(a => a.appId !== selectedApp.appId)}
                    renderItem={a => (
                      <List.Item actions={[<Tag color={STAGE_COLORS[a.currentStage] || 'purple'}>{STAGE_LABELS[a.currentStage] || a.currentStage}</Tag>]}>
                        <List.Item.Meta
                          title={<Text strong>{a.jobTitle}</Text>}
                          description={`${dayjs(a.applicationDate).format('DD MMM YYYY')} · ${a.assignedRecruiterName || 'Unassigned'}`}
                        />
                      </List.Item>
                    )}
                    locale={{ emptyText: <Empty description="No other applications." /> }}
                  />
                </div>
              )
            }
          ]} />
        ) : <Empty />}
      </Drawer>
    </div>
  )
}
