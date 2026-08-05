import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, message, TimePicker, InputNumber, Switch, notification } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { shiftService } from '../../services/shiftService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import useUIStore from '../../store/uiStore'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)
const TIME_FORMAT = 'HH:mm'

export default function ShiftMasterPage() {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const { isDarkMode } = useUIStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState(null)
  const [form] = Form.useForm()

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: shiftService.getShifts,
    select: (res) => res?.data || [],
  })

  const createMutation = useMutation({
    mutationFn: shiftService.createShift,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Shift Created' })
        closeModal()
        queryClient.invalidateQueries({ queryKey: ['shifts'] })
      } else {
        notification.error({ message: 'Creation Failed', description: res.message })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => shiftService.updateShift(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Shift Updated' })
        closeModal()
        queryClient.invalidateQueries({ queryKey: ['shifts'] })
      } else {
        notification.error({ message: 'Update Failed', description: res.message })
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: shiftService.deleteShift,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: 'Shift Deleted' })
        queryClient.invalidateQueries({ queryKey: ['shifts'] })
      } else {
        notification.error({ message: 'Deletion Failed', description: res.message })
      }
    },
  })

  const openModal = (shift = null) => {
    setEditingShift(shift)
    if (shift) {
      form.setFieldsValue({
        ...shift,
        startTime: dayjs(shift.startTime, TIME_FORMAT),
        endTime: dayjs(shift.endTime, TIME_FORMAT),
        weeklyOffDays: shift.weeklyOffDays?.split(',') || []
      })
    } else {
      form.resetFields()
      form.setFieldsValue({
        halfDayThresholdHrs: 4.0,
        gracePeriodMins: 15,
        breakMins: 60,
        isNightShift: false,
        weeklyOffDays: ['Saturday', 'Sunday']
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingShift(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        startTime: values.startTime.format(TIME_FORMAT),
        endTime: values.endTime.format(TIME_FORMAT),
        weeklyOffDays: values.weeklyOffDays?.join(',') || ''
      }

      if (editingShift) {
        updateMutation.mutate({ id: editingShift.shiftId, payload })
      } else {
        createMutation.mutate(payload)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const columns = [
    {
      title: 'Shift Name',
      dataIndex: 'shiftName',
      key: 'shiftName',
      render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{text}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{record.shiftCode}</span>
        </div>
      ),
    },
    {
      title: 'Timing',
      key: 'timing',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined style={{ color: 'var(--color-primary)' }} />
          <span>{record.startTime} - {record.endTime}</span>
          {record.isNightShift && <Tag color="purple">Night</Tag>}
        </Space>
      ),
    },
    {
      title: 'Rules',
      key: 'rules',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13 }}>Half Day: {record.halfDayThresholdHrs} hrs</span>
          <span style={{ fontSize: 13 }}>Grace: {record.gracePeriodMins} mins</span>
          <span style={{ fontSize: 13 }}>Break: {record.breakMins ?? 60} mins</span>
        </div>
      )
    },
    {
      title: 'Weekly Offs',
      dataIndex: 'weeklyOffDays',
      key: 'weeklyOffDays',
      render: (days) => (
        <Space wrap size={[0, 4]}>
          {days?.split(',').map(d => <Tag key={d}>{d.substring(0,3)}</Tag>)}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => <Tag color={active ? 'success' : 'default'}>{active ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          {can(PERMISSIONS.COMPANY_SETUP.EDIT) && (
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => openModal(record)} 
            />
          )}
          {can(PERMISSIONS.COMPANY_SETUP.DELETE) && record.isActive && (
            <Popconfirm
              title="Deactivate Shift"
              description="Are you sure you want to deactivate this shift?"
              onConfirm={() => deleteMutation.mutate(record.shiftId)}
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="page-container"
    >
      <PageHeader
        title="Shift Master"
        subtitle="Manage company shifts and timing rules"
        primaryAction={
          can(PERMISSIONS.COMPANY_SETUP.CREATE) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal()}
              style={{
                background: 'linear-gradient(135deg, #A05AFF 0%, #7622FF 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(160, 90, 255, 0.3)',
                height: 40,
                borderRadius: 8
              }}
            >
              Add Shift
            </Button>
          )
        }
      />

      <div style={{
        background: isDarkMode ? 'var(--bg-glass)' : '#ffffff',
        backdropFilter: 'blur(12px)',
        borderRadius: 16,
        padding: 24,
        border: isDarkMode ? 'var(--border-glass)' : '1px solid rgba(16,17,63,0.05)',
        boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 24px rgba(16,17,63,0.03)',
      }}>
        {shifts?.length === 0 && !isLoading ? (
          <EmptyState
            title="No Shifts Found"
            description="Create your first shift to start managing attendance."
            icon={<ClockCircleOutlined />}
            action={
              can(PERMISSIONS.COMPANY_SETUP.CREATE) && (
                <Button type="primary" onClick={() => openModal()}>
                  Create Shift
                </Button>
              )
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={shifts}
            rowKey="shiftId"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            rowClassName={record => !record.isActive ? 'inactive-row' : ''}
          />
        )}
      </div>

      <Modal
        title={
          <div style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 18, background: '#A05AFF', borderRadius: 4 }} />
            {editingShift ? 'Edit Shift' : 'Add Shift'}
          </div>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
        centered
        styles={{
          mask: { backdropFilter: 'blur(8px)' },
          content: { borderRadius: 16, overflow: 'hidden' }
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="shiftName"
              label="Shift Name"
              rules={[{ required: true, message: 'Please enter shift name' }]}
            >
              <Input placeholder="e.g. Morning Shift" />
            </Form.Item>
            
            <Form.Item
              name="shiftCode"
              label="Shift Code"
              rules={[{ required: true, message: 'Please enter shift code' }]}
            >
              <Input placeholder="e.g. MORN" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[{ required: true, message: 'Please select start time' }]}
            >
              <TimePicker format={TIME_FORMAT} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="endTime"
              label="End Time"
              rules={[{ required: true, message: 'Please select end time' }]}
            >
              <TimePicker format={TIME_FORMAT} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item
              name="halfDayThresholdHrs"
              label="Half Day Threshold (Hrs)"
              tooltip="If working hours are below this, it marks a Half Day"
              rules={[{ required: true, message: 'Please specify threshold' }]}
            >
              <InputNumber min={1} max={12} step={0.5} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="gracePeriodMins"
              label="Grace Period (Mins)"
              tooltip="Late-arrival grace tolerance — does NOT affect break deduction"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="breakMins"
              label="Break / Lunch (Mins)"
              tooltip="Lunch / break duration deducted from gross hours for overtime calculation"
              rules={[{ required: true, message: 'Please specify break duration' }]}
            >
              <InputNumber min={0} max={120} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="weeklyOffDays"
            label="Weekly Off Days"
            rules={[{ required: true, message: 'Please select at least one weekly off' }]}
          >
            <Select mode="multiple" placeholder="Select off days">
              {weekDays.map(day => (
                <Select.Option key={day} value={day}>{day}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="isNightShift"
            label="Is Night Shift?"
            valuePropName="checked"
            tooltip="Enable if shift crosses midnight"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
