import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, message, Tree, notification } from 'antd'
import { VALIDATORS } from '../../constants/validation'
import { PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { organizationService } from '../../services/organizationService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import useUIStore from '../../store/uiStore'

function DeptTree({ depts, onEdit, onDelete }) {
  const { can } = usePermission()
  const { isDarkMode } = useUIStore()
  if (!depts?.length) return null

  const renderDept = (dept, level = 0) => (
    <div key={dept.deptId}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          marginLeft: level * 24,
          borderRadius: 8,
          marginBottom: 4,
          background: level === 0 ? (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(16,17,63,0.03)') : 'transparent',
          border: level === 0 ? (isDarkMode ? 'var(--border-glass)' : '1px solid rgba(16,17,63,0.08)') : 'none',
          borderLeft: level > 0 ? (isDarkMode ? '2px solid rgba(255,255,255,0.2)' : '2px solid rgba(16,17,63,0.12)') : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TeamOutlined style={{ color: isDarkMode ? '#FAA71A' : '#10113F', opacity: 0.5 }} />
          <div>
            <span style={{ fontWeight: level === 0 ? 700 : 500, color: 'var(--color-text-primary)', fontSize: 14 }}>{dept.deptName}</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>{dept.deptCode}</span>
            <Tag style={{ marginLeft: 8 }} color="default">{dept.employeeCount || 0} employees</Tag>
          </div>
        </div>
        <Space>
          {can(PERMISSIONS.COMPANY_SETUP.EDIT) && (
            <Button size="small" icon={<EditOutlined />} type="text" onClick={() => onEdit(dept)} style={{ borderRadius: 6 }} />
          )}
          {can(PERMISSIONS.COMPANY_SETUP.DELETE) && (
            <Popconfirm title="Delete this department?" onConfirm={() => onDelete(dept.deptId)}>
              <Button size="small" icon={<DeleteOutlined />} type="text" danger style={{ borderRadius: 6 }} />
            </Popconfirm>
          )}
        </Space>
      </div>
      {dept.children?.map((child) => renderDept(child, level + 1))}
    </div>
  )

  return <div>{depts.map((d) => renderDept(d))}</div>
}

export default function DepartmentsPage() {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const { isDarkMode } = useUIStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [form] = Form.useForm()

  const { data: depts, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: organizationService.getDepartments,
    select: (res) => res?.data || [],
  })

  const createMutation = useMutation({
    mutationFn: organizationService.createDepartment,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Department Created',
          description: 'Department created successfully.',
          placement: 'topRight'
        })
        closeModal()
        queryClient.invalidateQueries({ queryKey: ['departments'] })
      }
      else {
        notification.error({
          message: 'Creation Failed',
          description: res.message || 'Failed to create department.',
          placement: 'topRight'
        })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => organizationService.updateDepartment(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Department Updated',
          description: 'Department updated successfully.',
          placement: 'topRight'
        })
        closeModal()
        queryClient.invalidateQueries({ queryKey: ['departments'] })
      }
      else {
        notification.error({
          message: 'Update Failed',
          description: res.message || 'Failed to update department.',
          placement: 'topRight'
        })
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: organizationService.deleteDepartment,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Department Deactivated',
          description: 'Department deactivated successfully.',
          placement: 'topRight'
        })
        queryClient.invalidateQueries({ queryKey: ['departments'] })
      }
      else {
        notification.error({
          message: 'Deactivation Failed',
          description: res.message || 'Failed to deactivate department.',
          placement: 'topRight'
        })
      }
    },
  })

  const openModal = (dept = null) => {
    setEditingDept(dept)
    form.resetFields()
    if (dept) form.setFieldsValue({ deptName: dept.deptName, deptCode: dept.deptCode })
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditingDept(null); form.resetFields() }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.deptId, payload: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const flatDepts = []
  const flatten = (arr) => arr.forEach((d) => { flatDepts.push(d); if (d.children) flatten(d.children) })
  flatten(depts || [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Departments"
        subtitle="Manage your organizational structure"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Organization' }, { label: 'Departments' }]}
        actions={
          can(PERMISSIONS.COMPANY_SETUP.CREATE) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
              style={{ borderRadius: 8, fontWeight: 600 }}>
              New Department
            </Button>
          )
        }
      />

      <div style={{ background: 'var(--color-card-bg)', borderRadius: 12, border: 'var(--border-glass)', padding: 20 }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : !depts?.length ? (
          <EmptyState variant="departments" action={can(PERMISSIONS.COMPANY_SETUP.CREATE) ? () => openModal() : undefined} actionLabel="Add Department" />
        ) : (
          <DeptTree depts={depts} onEdit={openModal} onDelete={(id) => deleteMutation.mutate(id)} />
        )}
      </div>

      <Modal
        title={<span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{editingDept ? 'Edit Department' : 'New Department'}</span>}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText={editingDept ? 'Update' : 'Create'}
        okButtonProps={{ style: { borderRadius: 8 } }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
          <Form.Item name="deptName" label="Department Name" rules={[VALIDATORS.required('Department Name')]}>
            <Input style={{ borderRadius: 8 }} placeholder="e.g. Engineering" />
          </Form.Item>
          <Form.Item name="deptCode" label="Department Code" rules={[VALIDATORS.required('Department Code')]}>
            <Input style={{ borderRadius: 8 }} placeholder="e.g. ENG" />
          </Form.Item>
          <Form.Item name="parentDeptId" label="Parent Department">
            <Select allowClear placeholder="Select parent (optional)" style={{ borderRadius: 8 }}
              options={flatDepts.filter((d) => !editingDept || d.deptId !== editingDept.deptId).map((d) => ({ value: d.deptId, label: d.deptName }))} />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
