import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Form, Input, Select, InputNumber, DatePicker, message, Tooltip, Divider } from 'antd'
import { FileTextOutlined, PlusOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, SendOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import PageHeader from '../../components/common/PageHeader'
import { recruitmentService } from '../../services/recruitmentService'
import { PERMISSIONS } from '../../constants/permissions'
import PermissionGate from '../../components/common/PermissionGate'

const { Option } = Select

export default function OffersPage() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState([])

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [simulateModalOpen, setSimulateModalOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState(null)
  
  const [form] = Form.useForm()
  const [simForm] = Form.useForm()

  const fetchOffers = async () => {
    setLoading(true)
    try {
      const res = await recruitmentService.getOffers()
      if (res.success) {
        setOffers(res.data)
      }
    } catch (err) {
      message.error('Failed to load offers.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch active applications that are eligible for offer (not yet Joined/Rejected and no offer issued)
  const fetchMetadata = async () => {
    try {
      const appRes = await recruitmentService.getApplications()
      if (appRes.success) {
        // Filter to show only apps in Offer-eligible stages, not yet Joined or Rejected
        const eligible = appRes.data.filter(a =>
          a.currentStage !== 'Joined' && a.currentStage !== 'Rejected'
        )
        setApplications(eligible)
      }
    } catch (err) {}
  }

  useEffect(() => {
    fetchOffers()
    fetchMetadata()
  }, [])

  const handleCreateOffer = async (values) => {
    try {
      // Build exactly what CreateOfferRequest expects
      const payload = {
        appId: values.appId,
        offeredCTC: values.offeredCTC,
        joiningDate: values.joiningDate ? values.joiningDate.format('YYYY-MM-DD') : null,
        expiryDays: values.expiryDays ?? 30
      }
      const res = await recruitmentService.createOffer(payload)
      if (res.success) {
        message.success('Offer letter drafted successfully.')
        setCreateModalOpen(false)
        form.resetFields()
        fetchOffers()
        fetchMetadata() // Refresh application list
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to generate offer.')
    }
  }

  const handleApproveOffer = async (id, approved) => {
    try {
      const res = await recruitmentService.approveOffer(id, { approved, comment: 'Approved via HR Panel.' })
      if (res.success) {
        message.success(approved ? 'Offer letter released to candidate.' : 'Offer letter rejected.')
        fetchOffers()
      }
    } catch (err) {
      message.error('Failed to execute offer approval.')
    }
  }

  const handleSimulateAccept = async (values) => {
    try {
      const res = await recruitmentService.acceptOffer(selectedOfferId, { remarks: values.remarks })
      if (res.success) {
        message.success('Candidate simulation: Offer Accepted! Onboarding tasks initialized.')
        setSimulateModalOpen(false)
        simForm.resetFields()
        fetchOffers()
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to simulate accept.')
    }
  }

  const getOfferStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return 'green'
      case 'Sent': return 'blue'
      case 'Draft': return 'default'
      case 'Rejected': return 'red'
      default: return 'gold'
    }
  }

  const columns = [
    {
      title: 'Candidate',
      dataIndex: 'candidateName',
      key: 'candidateName',
      render: (text) => <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{text}</span>
    },
    {
      title: 'Position',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (text) => <span style={{ color: 'rgba(255,255,255,0.65)' }}>{text}</span>
    },
    {
      title: 'CTC (Annual)',
      dataIndex: 'offeredCTC',
      key: 'offeredCTC',
      render: (ctc) => (
        <span style={{ color: '#FAA71A', fontWeight: 600 }}>
          ₹{ctc != null ? Number(ctc).toLocaleString('en-IN') : '0'}
        </span>
      )
    },
    {
      title: 'Joining Date',
      dataIndex: 'joiningDate',
      key: 'joiningDate',
      render: (date) => date ? new Date(date).toLocaleDateString('en-IN') : '-'
    },
    {
      title: 'Expires',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) => date ? new Date(date).toLocaleDateString('en-IN') : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getOfferStatusColor(status)} style={{ borderRadius: 4 }}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'Draft' && (
            <PermissionGate permission={PERMISSIONS.RECRUITMENT.APPROVE}>
              <Tooltip title="Approve & Send to Candidate">
                <Button size="small" type="primary" ghost icon={<SendOutlined />} onClick={() => handleApproveOffer(record.offerId, true)} />
              </Tooltip>
              <Tooltip title="Reject Offer Draft">
                <Button size="small" danger ghost icon={<CloseCircleOutlined />} onClick={() => handleApproveOffer(record.offerId, false)} />
              </Tooltip>
            </PermissionGate>
          )}

          {record.status === 'Sent' && (
            <Button
              size="small"
              type="primary"
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setSelectedOfferId(record.offerId)
                setSimulateModalOpen(true)
              }}
            >
              Simulate Accept
            </Button>
          )}

          {record.letterFilePath && (
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined style={{ color: '#FAA71A' }} />}
              onClick={async () => {
                try {
                  const blob = await recruitmentService.downloadOfferLetter(record.offerId)
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `Offer_${(record.candidateName || 'candidate').replace(' ', '_')}.pdf`
                  a.click()
                  window.URL.revokeObjectURL(url)
                } catch (e) {
                  message.error('Failed to download offer PDF.')
                }
              }}
            />
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="CTC Calculations & Offer Management"
        subtitle="Review CTC breakups, draft candidate offer letters, and simulate candidate acceptance flows."
        extra={
          <PermissionGate permission={PERMISSIONS.RECRUITMENT.CREATE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #FAA71A 0%, #F39314 100%)',
                borderColor: '#FAA71A',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(250,167,26,0.2)'
              }}
            >
              Generate Offer
            </Button>
          </PermissionGate>
        }
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
          dataSource={offers}
          rowKey="offerId"
          loading={loading}
          pagination={{ pageSize: 8 }}
          className="hrms-table"
        />
      </Card>

      {/* Generate Offer Modal */}
      <Modal
        title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>Create Job Offer Letter</span>}
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields() }}
        footer={null}
        destroyOnClose
        width={580}
        style={{ top: 60 }}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOffer}>

          <Form.Item
            name="appId"
            label="Select Job Application"
            rules={[{ required: true, message: 'Please select a job application' }]}
            extra={
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                Link this offer to an existing candidate application. Only active (non-Joined/Rejected) applications appear here.
              </span>
            }
          >
            <Select
              placeholder="Candidate Name — Job Title (Stage)"
              dropdownStyle={{ background: '#1c1e3d' }}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {applications.map(a => (
                <Option key={a.appId} value={a.appId}>
                  {a.candidateName} — {a.jobTitle} [{a.currentStage}]
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left" style={{ color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.1)', margin: '12px 0' }}>
            Offer Terms
          </Divider>

          <Form.Item
            name="offeredCTC"
            label="Offered CTC (Annual, in ₹)"
            rules={[
              { required: true, message: 'Offered CTC is required' },
              { type: 'number', min: 1, message: 'CTC must be greater than 0' }
            ]}
          >
            <InputNumber
              formatter={v => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => v.replace(/₹\s?|(,*)/g, '')}
              style={{ width: '100%' }}
              min={1}
              placeholder="e.g. 850000"
            />
          </Form.Item>

          <Form.Item
            name="joiningDate"
            label="Expected Date of Joining (DOJ)"
            rules={[{ required: true, message: 'Joining date is required' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD MMM YYYY"
              disabledDate={current => current && current < dayjs().startOf('day')}
              placeholder="Select joining date"
            />
          </Form.Item>

          <Form.Item
            name="expiryDays"
            label="Offer Validity (Days)"
            initialValue={30}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={180}
              placeholder="Default: 30 days"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => { setCreateModalOpen(false); form.resetFields() }}>Cancel</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#FAA71A', borderColor: '#FAA71A' }}>
                Draft Offer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Simulate Accept Modal */}
      <Modal
        title={<span style={{ color: '#52c41a', fontSize: 16 }}>Simulate Candidate Acceptance</span>}
        open={simulateModalOpen}
        onCancel={() => setSimulateModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={simForm} layout="vertical" onFinish={handleSimulateAccept}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, marginBottom: 16 }}>
            This panel simulates the candidate receiving the offer link via email and clicking <strong>Accept</strong>.
            This triggers the database transactions to initialize BGV records, checklists, and workflow timelines.
          </div>
          <Form.Item name="remarks" label="Candidate Acceptance Remarks" initialValue="I am excited to join the team!">
            <Input.TextArea rows={3} style={{ background: 'rgba(255,255,255,0.04)', color: '#fff' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setSimulateModalOpen(false)}>Close</Button>
              <Button type="primary" htmlType="submit" style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                Simulate Accept
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
