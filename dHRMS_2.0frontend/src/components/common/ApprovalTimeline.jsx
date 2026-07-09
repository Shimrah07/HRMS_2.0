import React from 'react'
import { Card, Timeline } from 'antd'
import { CheckCircleOutlined, InfoCircleOutlined, UserOutlined } from '@ant-design/icons'

export default function ApprovalTimeline({ history = [] }) {
  const getTimelineColor = (toState) => {
    switch (toState?.toLowerCase()) {
      case 'completed': return 'green'
      case 'rejected': return 'red'
      case 'joined': return 'blue'
      default: return 'orange'
    }
  }

  const items = history.map((h, idx) => ({
    color: getTimelineColor(h.toState),
    dot: h.toState?.toLowerCase() === 'completed' ? <CheckCircleOutlined style={{ fontSize: '16px' }} /> : <InfoCircleOutlined style={{ fontSize: '16px' }} />,
    children: (
      <div style={{ paddingBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            State: {h.toState || 'Updated'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
            {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
          </span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
          {h.remarks || 'No comments provided.'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          <UserOutlined style={{ fontSize: 10 }} />
          <span>Action by: {h.updatedBy || 'System'}</span>
        </div>
      </div>
    )
  }))

  return (
    <Card
      title={<span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Workflow Transition History</span>}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 12
      }}
      bodyStyle={{ padding: '24px 24px 0' }}
    >
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '12px 0', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          No transition records found.
        </div>
      ) : (
        <Timeline items={items} />
      )}
    </Card>
  )
}
