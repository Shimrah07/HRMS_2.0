import React, { useState } from 'react'
import { Table, Button, Space, Tag, Modal, Form, Input, notification, Tooltip } from 'antd'
import { CheckOutlined, CloseOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { attendanceService } from '../../services/attendanceService'
import useUIStore from '../../store/uiStore'

export default function RegularizationQueuePage() {
  const queryClient = useQueryClient()
  const { isDarkMode } = useUIStore()
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [selectedReg, setSelectedReg] = useState(null)
  const [form] = Form.useForm()

  const { data: queue, isLoading } = useQuery({
    queryKey: ['regularization-queue'],
    queryFn: attendanceService.getRegularizationQueue,
    select: (res) => res?.data || [],
  })

  const approveMutation = useMutation({
    mutationFn: attendanceService.approveRegularization,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Approved successfully', description: res.message })
        queryClient.invalidateQueries({ queryKey: ['regularization-queue'] })
      } else {
        notification.error({ message: 'Action Failed', description: res.message })
      }
    }
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => attendanceService.rejectRegularization(id, reason),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Rejected successfully', description: res.message })
        closeRejectModal()
        queryClient.invalidateQueries({ queryKey: ['regularization-queue'] })
      } else {
        notification.error({ message: 'Action Failed', description: res.message })
      }
    }
  })

  const handleApprove = (record) => {
    approveMutation.mutate(record.key)
  }

  const openRejectModal = (record) => {
    setSelectedReg(record)
    setRejectModalOpen(true)
  }

  const closeRejectModal = () => {
    setRejectModalOpen(false)
    setSelectedReg(null)
    form.resetFields()
  }

  const handleReject = async () => {
    try {
      const values = await form.validateFields()
      rejectMutation.mutate({ id: selectedReg.key, reason: values.reason })
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <Space>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)'
          }}>
            <UserOutlined />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600 }}>{record.employeeName}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{record.employeeCode}</span>
          </div>
        </Space>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150
    },
    {
      title: 'Requested Times',
      key: 'times',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 13 }}><ClockCircleOutlined style={{ color: 'var(--color-success)', marginRight: 4 }} /> In: {record.requestedCheckIn}</span>
          <span style={{ fontSize: 13 }}><ClockCircleOutlined style={{ color: 'var(--color-danger)', marginRight: 4 }} /> Out: {record.requestedCheckOut}</span>
        </Space>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => <span style={{ color: 'var(--color-text-muted)' }}>{text}</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Approve">
            <Button 
              type="text" 
              icon={<CheckOutlined style={{ color: 'var(--color-success)' }} />} 
              onClick={() => handleApprove(record)}
              loading={approveMutation.isPending && approveMutation.variables === record.key}
            />
          </Tooltip>
          <Tooltip title="Reject">
            <Button 
              type="text" 
              danger 
              icon={<CloseOutlined />} 
              onClick={() => openRejectModal(record)} 
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="page-container"
    >
      <PageHeader
        title="Regularization Queue"
        subtitle="Review and action pending attendance regularizations"
      />

      <div style={{
        background: isDarkMode ? 'var(--bg-glass)' : '#ffffff',
        backdropFilter: 'blur(12px)',
        borderRadius: 16,
        padding: 24,
        border: isDarkMode ? 'var(--border-glass)' : '1px solid rgba(16,17,63,0.05)',
        boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 24px rgba(16,17,63,0.03)',
      }}>
        {queue?.length === 0 && !isLoading ? (
          <EmptyState
            title="All Caught Up!"
            description="There are no pending regularization requests for your team."
            icon={<CheckOutlined style={{ fontSize: 48, color: 'var(--color-success)' }} />}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={queue}
            rowKey="key"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        )}
      </div>

      <Modal
        title="Reject Regularization"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={closeRejectModal}
        confirmLoading={rejectMutation.isPending}
        okText="Reject Request"
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <Form.Item
            name="reason"
            label="Rejection Reason"
            rules={[{ required: true, message: 'You must provide a reason for rejection' }]}
          >
            <Input.TextArea rows={4} placeholder="e.g. Please provide manager approval email before regularizing this day." />
          </Form.Item>
        </Form>
      </Modal>

    </motion.div>
  )
}
