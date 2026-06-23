import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, Form, Input, InputNumber, Table, Space, message, Tag, notification } from 'antd'
import { VALIDATORS } from '../../constants/validation'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { organizationService } from '../../services/organizationService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import useUIStore from '../../store/uiStore'

export default function DesignationsPage() {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const { isDarkMode } = useUIStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const { data: desigs, isLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: organizationService.getDesignations,
    select: (res) => res?.data || [],
  })

  const createMutation = useMutation({
    mutationFn: organizationService.createDesignation,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Designation Created',
          description: 'Designation role created successfully.',
          placement: 'topRight'
        })
        closeModal()
        queryClient.invalidateQueries({ queryKey: ['designations'] })
      }
      else {
        notification.error({
          message: 'Creation Failed',
          description: res.message || 'Failed to create designation.',
          placement: 'topRight'
        })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => organizationService.updateDesignation(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Designation Updated',
          description: 'Designation role updated successfully.',
          placement: 'topRight'
        })
        closeModal()
        queryClient.invalidateQueries({ queryKey: ['designations'] })
      }
      else {
        notification.error({
          message: 'Update Failed',
          description: res.message || 'Failed to update designation.',
          placement: 'topRight'
        })
      }
    },
  })

  const openModal = (d = null) => {
    setEditing(d)
    form.resetFields()
    if (d) form.setFieldsValue(d)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null); form.resetFields() }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editing) updateMutation.mutate({ id: editing.designationId, payload: values })
    else createMutation.mutate(values)
  }

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', render: (v) => <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{v}</span> },
    { title: 'Grade', dataIndex: 'grade', key: 'grade', render: (v) => v ? <Tag>{v}</Tag> : '—' },
    { title: 'Level', dataIndex: 'level', key: 'level', render: (v) => v || '—' },
    { title: 'Min Basic (₹)', dataIndex: 'minBasic', key: 'minBasic', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    { title: 'Max Basic (₹)', dataIndex: 'maxBasic', key: 'maxBasic', render: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
    { title: 'Employees', dataIndex: 'employeeCount', key: 'count', render: (v) => <Tag color="default">{v || 0}</Tag> },
    {
      title: '', key: 'actions', width: 60,
      render: (_, r) => can(PERMISSIONS.COMPANY_SETUP.EDIT) ? (
        <Button size="small" icon={<EditOutlined />} type="text" onClick={() => openModal(r)} style={{ borderRadius: 6 }} />
      ) : null,
    },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Designations"
        subtitle="Manage job titles and salary bands"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Organization' }, { label: 'Designations' }]}
        actions={
          can(PERMISSIONS.COMPANY_SETUP.CREATE) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
              style={{ borderRadius: 8, fontWeight: 600 }}>
              New Designation
            </Button>
          )
        }
      />

      <div style={{ background: 'var(--color-card-bg)', borderRadius: 12, border: 'var(--border-glass)', overflow: 'hidden' }}>
        <Table columns={columns} dataSource={desigs} rowKey="designationId" loading={isLoading} pagination={false}
          locale={{ emptyText: <EmptyState variant="designations" action={can(PERMISSIONS.COMPANY_SETUP.CREATE) ? () => openModal() : undefined} actionLabel="Add Designation" /> }} />
      </div>

      <Modal
        title={<span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{editing ? 'Edit Designation' : 'New Designation'}</span>}
        open={modalOpen} onCancel={closeModal} onOk={handleSubmit}
        okButtonProps={{ style: { borderRadius: 8 } }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
          <Form.Item name="title" label="Title" rules={[VALIDATORS.required('Title')]}><Input style={{ borderRadius: 8 }} placeholder="e.g. Senior Software Engineer" /></Form.Item>
          <Form.Item name="grade" label="Grade" rules={[VALIDATORS.required('Grade')]}><Input style={{ borderRadius: 8 }} placeholder="e.g. L5" /></Form.Item>
          <Form.Item name="level" label="Level" rules={[VALIDATORS.required('Level')]}><InputNumber style={{ width: '100%', borderRadius: 8 }} min={1} /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="minBasic" label="Min Basic (₹)" rules={[VALIDATORS.required('Min Basic')]}><InputNumber style={{ width: '100%', borderRadius: 8 }} min={0} /></Form.Item>
            <Form.Item 
              name="maxBasic" 
              label="Max Basic (₹)" 
              dependencies={['minBasic']}
              rules={[
                VALIDATORS.required('Max Basic'),
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (value !== undefined && value !== null) {
                      const min = getFieldValue('minBasic');
                      if (min !== undefined && min !== null && value < min) {
                        return Promise.reject(new Error('Max basic salary must be greater than or equal to min basic salary.'));
                      }
                    }
                    return Promise.resolve();
                  }
                })
              ]}
            >
              <InputNumber style={{ width: '100%', borderRadius: 8 }} min={0} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </motion.div>
  )
}
