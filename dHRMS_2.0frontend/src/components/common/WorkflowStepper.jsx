import React from 'react'
import { Steps } from 'antd'

export default function WorkflowStepper({ steps = [], current = 0 }) {
  const items = steps.map((s, idx) => ({
    title: (
      <span style={{ 
        fontSize: 13, 
        fontWeight: idx === current ? 600 : 400,
        color: idx === current ? '#FAA71A' : idx < current ? '#52c41a' : 'rgba(255, 255, 255, 0.45)'
      }}>
        {s.title}
      </span>
    ),
    description: (
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
        {s.description}
      </span>
    )
  }))

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 20
    }}>
      <Steps
        size="small"
        current={current}
        items={items}
      />
    </div>
  )
}
