import { Card, Table, Button, Space, Tag, Radio, Modal, Input, Typography, Tooltip } from 'antd'
import { CheckOutlined, CloseOutlined, FilePdfOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { usePendingApplications } from '../../hooks/usePendingApplications'

const { Text } = Typography

export default function PendingQueuePanel() {
  const {
    pendingApps,
    loading,
    statusFilter,
    setStatusFilter,
    rejectingApp,
    setRejectingApp,
    rejectionReason,
    setRejectionReason,
    submittingRejection,
    handleApprove,
    handleOpenReject,
    handleRejectSubmit
  } = usePendingApplications()

  const columns = [
    {
      title: 'Candidate Name',
      key: 'name',
      width: 180,
      render: (_, r) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {r.firstName} {r.lastName || ''}
          </span>
          {r.currentDesignation && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {r.currentDesignation} {r.currentCompany ? `@ ${r.currentCompany}` : ''}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Job Opening',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      width: 200,
      render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>
    },
    {
      title: 'Email / Phone',
      key: 'contact',
      width: 220,
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 13 }}>{r.email}</div>
          {r.phone && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>📞 {r.phone}</div>}
        </div>
      )
    },
    {
      title: 'Experience',
      dataIndex: 'totalExperience',
      key: 'totalExperience',
      width: 100,
      render: v => v != null ? `${v} yrs` : '-'
    },
    {
      title: 'Source / Referrer',
      key: 'source',
      width: 160,
      render: (_, r) => (
        <div>
          <Tag color="cyan">{r.source || 'CareerPortal'}</Tag>
          {r.referralEmployeeName && (
            <div style={{ fontSize: 11, color: '#FAA71A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <TeamOutlined /> Ref: {r.referralEmployeeName}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Applied Date',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
      width: 130,
      render: (v) => (
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ClockCircleOutlined /> {dayjs(v).format('DD MMM YYYY')}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v) => {
        let color = 'gold'
        if (v === 'Approved') color = 'success'
        if (v === 'Rejected') color = 'error'
        return <Tag color={color} style={{ borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>{v}</Tag>
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, r) => {
        if (r.status !== 'Pending') {
          return r.rejectionReason ? (
            <Tooltip title={`Rejection Reason: ${r.rejectionReason}`}>
              <Text type="secondary" ellipsis style={{ maxWidth: 160, fontSize: 12 }}>
                Reason: {r.rejectionReason}
              </Text>
            </Tooltip>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>Completed</Text>
          )
        }
        return (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              ghost
              icon={<CheckOutlined />}
              onClick={() => handleApprove(r.pendingAppId)}
              style={{ borderColor: '#22C55E', color: '#22C55E', background: 'transparent' }}
            >
              Approve
            </Button>
            <Button
              size="small"
              danger
              ghost
              icon={<CloseOutlined />}
              onClick={() => handleOpenReject(r)}
            >
              Reject
            </Button>
            {r.resumeFilePath && (
              <Button
                size="small"
                type="text"
                icon={<FilePdfOutlined />}
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5110'}/api/v1/files/${r.resumeFilePath}`}
                target="_blank"
                style={{ color: '#E94043' }}
              />
            )}
          </Space>
        )
      }
    }
  ]

  return (
    <>
      <Card
        bordered={false}
        className="premium-glass-card"
        style={{ borderRadius: 12, marginTop: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Radio.Group
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="Pending">Pending Queue</Radio.Button>
            <Radio.Button value="Approved">Approved Applications</Radio.Button>
            <Radio.Button value="Rejected">Rejected Applications</Radio.Button>
          </Radio.Group>
        </div>

        <Table
          dataSource={pendingApps}
          columns={columns}
          rowKey="pendingAppId"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: `No ${statusFilter.toLowerCase()} applications in queue` }}
        />
      </Card>

      {/* Reject Modal */}
      <Modal
        visible={rejectingApp !== null}
        onCancel={() => setRejectingApp(null)}
        onOk={handleRejectSubmit}
        confirmLoading={submittingRejection}
        title="Decline Candidate Application"
        okText="Decline Application"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        {rejectingApp && (
          <div>
            <div style={{ marginBottom: 16 }}>
              Are you sure you want to decline the application from{' '}
              <strong>
                {rejectingApp.firstName} {rejectingApp.lastName || ''}
              </strong>{' '}
              for <strong>{rejectingApp.jobTitle}</strong>?
            </div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Rejection Reason / Remarks</div>
            <Input.TextArea
              rows={4}
              placeholder="Provide a reason for declining (e.g. Not matching required years of experience, mismatch in expected salary)"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </>
  )
}
