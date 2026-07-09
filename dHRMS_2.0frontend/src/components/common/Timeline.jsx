import React from 'react'
import { Steps } from 'antd'
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  SyncOutlined
} from '@ant-design/icons'

export default function Timeline({ items = [], current = 0, direction = 'vertical' }) {
  const getIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
      case 'inprogress':
        return <SyncOutlined spin style={{ color: '#1890ff', fontSize: 16 }} />
      case 'overdue':
        return <CloseCircleFilled style={{ color: '#f5222d', fontSize: 18 }} />
      case 'blocked':
        return <ExclamationCircleFilled style={{ color: '#faad14', fontSize: 18 }} />
      case 'delayed':
        return <ClockCircleFilled style={{ color: '#fa8c16', fontSize: 18 }} />
      default:
        return <ClockCircleFilled style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: 16 }} />
    }
  }

  const stepsItems = items.map((item, idx) => {
    const isCompleted = item.status?.toLowerCase() === 'completed'
    const isOverdue = item.status?.toLowerCase() === 'overdue'

    return {
      title: (
        <span style={{ 
          color: isCompleted ? '#52c41a' : isOverdue ? '#f5222d' : 'rgba(255,255,255,0.85)',
          fontWeight: idx === current ? 600 : 400,
          fontSize: 14
        }}>
          {item.title}
        </span>
      ),
      description: (
        <div style={{ padding: '4px 0 12px' }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 12 }}>
            {item.description}
          </div>
          {item.date && (
            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: 11, marginTop: 2 }}>
              {item.date}
            </div>
          )}
          {item.remarks && (
            <div style={{ 
              color: '#faad14', 
              fontSize: 11.5, 
              marginTop: 4, 
              background: 'rgba(250,173,20,0.06)',
              padding: '2px 8px',
              borderRadius: 4,
              display: 'inline-block'
            }}>
              Remarks: {item.remarks}
            </div>
          )}
        </div>
      ),
      icon: getIcon(item.status),
    }
  })

  return (
    <div className="hrms-timeline-wrapper" style={{ padding: '12px 0' }}>
      <Steps
        current={current}
        direction={direction}
        size="small"
        items={stepsItems}
        style={{
          '--antd-wave-shadow-color': 'rgba(250,167,26,0.2)',
        }}
      />
    </div>
  )
}
