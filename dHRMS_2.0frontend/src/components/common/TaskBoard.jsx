import React from 'react'
import { Card, Badge, Avatar, Button, Tooltip, Row, Col } from 'antd'
import { CheckOutlined, LoadingOutlined, UserOutlined, WarningOutlined, PauseCircleOutlined } from '@ant-design/icons'

export default function TaskBoard({ tasks = [], onUpdateTask, canEdit = false }) {
  const categories = [
    { key: 'Pending', label: 'Pending', color: '#8c8c8c', icon: <PauseCircleOutlined /> },
    { key: 'InProgress', label: 'In Progress', color: '#1890ff', icon: <LoadingOutlined spin /> },
    { key: 'Blocked', label: 'Blocked', color: '#faad14', icon: <WarningOutlined /> },
    { key: 'Completed', label: 'Completed', color: '#52c41a', icon: <CheckOutlined /> }
  ]

  const getPriorityColor = (prio) => {
    switch (prio?.toLowerCase()) {
      case 'critical': return '#f5222d'
      case 'high': return '#fa8c16'
      case 'medium': return '#1890ff'
      default: return '#52c41a'
    }
  }

  const getFilteredTasks = (status) => {
    return tasks.filter(t => stringEquals(t.status, status))
  }

  const stringEquals = (s1, s2) => {
    return s1?.toLowerCase()?.replace(/\s+/g, '') === s2?.toLowerCase()?.replace(/\s+/g, '')
  }

  return (
    <Row gutter={16}>
      {categories.map(cat => {
        const catTasks = getFilteredTasks(cat.key)
        return (
          <Col xs={24} sm={12} md={6} key={cat.key}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 12,
              padding: 12,
              minHeight: 400
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 12,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: cat.color }}>{cat.icon}</span>
                  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontSize: 13.5 }}>{cat.label}</span>
                </div>
                <Badge count={catTasks.length} style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }} />
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {catTasks.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: 12
                  }}>
                    No tasks
                  </div>
                ) : (
                  catTasks.map(task => (
                    <Card
                      key={task.taskId}
                      size="small"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                      bodyStyle={{ padding: 10 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontSize: 12.5, lineHeight: 1.3 }}>
                          {task.taskName}
                        </div>
                        <Badge
                          count={task.priority}
                          style={{
                            backgroundColor: getPriorityColor(task.priority),
                            fontSize: 10,
                            height: 16,
                            lineHeight: '16px',
                            borderRadius: 4
                          }}
                        />
                      </div>

                      <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 11.5, marginTop: 6, lineBreak: 'anywhere' }}>
                        {task.description}
                      </div>

                      {/* Footer info */}
                      <div style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Avatar size={18} icon={<UserOutlined />} src={task.ownerPhoto} style={{ backgroundColor: '#1890ff' }} />
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{task.ownerName || 'Unassigned'}</span>
                        </div>
                        
                        {/* Actions */}
                        {canEdit && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {cat.key !== 'Completed' && (
                              <Tooltip title="Mark In Progress">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<LoadingOutlined style={{ color: '#1890ff', fontSize: 11 }} />}
                                  onClick={() => onUpdateTask(task.taskId, { status: 'InProgress' })}
                                />
                              </Tooltip>
                            )}
                            {cat.key !== 'Completed' && (
                              <Tooltip title="Complete Task">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<CheckOutlined style={{ color: '#52c41a', fontSize: 11 }} />}
                                  onClick={() => onUpdateTask(task.taskId, { status: 'Completed' })}
                                />
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </Col>
        )
      })}
    </Row>
  )
}
