import React from 'react'
import { Card, Progress, Row, Col } from 'antd'

export default function ProgressCards({ progress = {} }) {
  const depts = [
    { label: 'HR Tasks', value: progress.hrProgress ?? 0, color: '#52c41a' },
    { label: 'IT Setup', value: progress.itProgress ?? 0, color: '#1890ff' },
    { label: 'Admin Setup', value: progress.adminProgress ?? 0, color: '#722ed1' },
    { label: 'Employee Form', value: progress.employeeProgress ?? 0, color: '#eb2f96' },
    { label: 'Manager Plan', value: progress.managerProgress ?? 0, color: '#fa8c16' }
  ]

  return (
    <Card
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        marginBottom: 16
      }}
      bodyStyle={{ padding: 18 }}
    >
      <Row gutter={[16, 16]} align="middle">
        {/* Overall progress circular meter */}
        <Col xs={24} md={8} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <Progress
            type="circle"
            percent={Math.round(progress.overallProgress ?? 0)}
            strokeColor={{
              '0%': '#FAA71A',
              '100%': '#52c41a',
            }}
            width={100}
            trailColor="rgba(255,255,255,0.06)"
          />
          <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 10 }}>
            Overall Onboarding Progress
          </div>
        </Col>

        {/* Linear progress bars for departments */}
        <Col xs={24} md={16}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {depts.map(d => (
              <div key={d.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>{d.label}</span>
                  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{Math.round(d.value)}%</span>
                </div>
                <Progress
                  percent={Math.round(d.value)}
                  strokeColor={d.color}
                  size="small"
                  showInfo={false}
                  trailColor="rgba(255,255,255,0.06)"
                />
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </Card>
  )
}
