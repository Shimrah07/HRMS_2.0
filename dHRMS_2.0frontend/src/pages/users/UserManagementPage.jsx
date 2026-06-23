import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tabs, Table, Button, Avatar, Tag, Switch, Popconfirm, Modal, Form, Input, Select,
  Checkbox, message, Space, Badge, notification
} from 'antd'
import { VALIDATORS } from '../../constants/validation'
import { PlusOutlined, KeyOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { userService } from '../../services/userService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import useUIStore from '../../store/uiStore'

function UsersTab() {
  const queryClient = useQueryClient()
  const { isDarkMode } = useUIStore()
  const { can } = usePermission()
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 })
  const [createModal, setCreateModal] = useState(false)
  const [assignModal, setAssignModal] = useState(null)
  const [createForm] = Form.useForm()
  const [assignForm] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => userService.getUsers(filters),
  })

  const { data: rolesData } = useQuery({ queryKey: ['roles'], queryFn: userService.getRoles, select: (r) => r?.data || [] })

  const users = data?.data || []
  const total = data?.totalCount || 0

  const toggleActiveMutation = useMutation({
    mutationFn: userService.toggleActive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const toggleLockMutation = useMutation({
    mutationFn: ({ id, isLocked }) => userService.toggleLock(id, isLocked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: userService.adminResetPassword,
    onSuccess: (res) => {
      if (res.success) {
        Modal.success({ title: 'Temporary Password', content: `New password: ${res.data}`, okText: 'Copy & Close' })
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'User Created',
          description: 'System user account created successfully.',
          placement: 'topRight'
        })
        setCreateModal(false)
        createForm.resetFields()
        queryClient.invalidateQueries({ queryKey: ['users'] })
      }
      else {
        notification.error({
          message: 'Creation Failed',
          description: res.message || 'Failed to create user.',
          placement: 'topRight'
        })
      }
    },
  })

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, roleIds }) => userService.assignRoles(id, roleIds),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Roles Assigned',
          description: 'User roles updated successfully.',
          placement: 'topRight'
        })
        setAssignModal(null)
        queryClient.invalidateQueries({ queryKey: ['users'] })
      }
      else {
        notification.error({
          message: 'Assignment Failed',
          description: res.message || 'Failed to update user roles.',
          placement: 'topRight'
        })
      }
    },
  })

  const columns = [
    {
      title: 'User', key: 'user',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar style={{ background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)', fontWeight: 700 }}>
            {r.firstName?.[0] || r.username?.[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.firstName} {r.lastName}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>@{r.username}</div>
          </div>
        </div>
      ),
    },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => <span style={{ fontSize: 13 }}>{v}</span> },
    {
      title: 'Roles', dataIndex: 'roles', key: 'roles',
      render: (roles) => (roles || []).map((r) => <Tag key={r} style={{ fontSize: 11 }}>{r}</Tag>),
    },
    {
      title: 'Active', dataIndex: 'isActive', key: 'active',
      render: (v, r) => can(PERMISSIONS.USER_MANAGEMENT.EDIT) ? (
        <Popconfirm title={v ? 'Deactivate this user?' : 'Activate this user?'} onConfirm={() => toggleActiveMutation.mutate(r.userId)}>
          <Switch checked={v} size="small" style={{ background: v ? '#22C55E' : undefined }} />
        </Popconfirm>
      ) : (
        <Switch checked={v} size="small" disabled style={{ background: v ? '#22C55E' : undefined }} />
      ),
    },
    {
      title: 'Locked', dataIndex: 'isLocked', key: 'locked',
      render: (v, r) => can(PERMISSIONS.USER_MANAGEMENT.EDIT) ? (
        <Popconfirm title={v ? 'Unlock user?' : 'Lock user?'} onConfirm={() => toggleLockMutation.mutate({ id: r.userId, isLocked: !v })}>
          <Button size="small" type="text" icon={v ? <LockOutlined style={{ color: '#E94043' }} /> : <UnlockOutlined style={{ color: '#22C55E' }} />} />
        </Popconfirm>
      ) : (
        <span style={{ padding: '0 8px' }}>{v ? <LockOutlined style={{ color: '#E94043' }} /> : <UnlockOutlined style={{ color: '#22C55E' }} />}</span>
      ),
    },
    {
      title: '', key: 'actions',
      render: (_, r) => (
        <Space>
          {can(PERMISSIONS.USER_MANAGEMENT.ASSIGN) && (
            <Button size="small" onClick={() => { setAssignModal(r); assignForm.setFieldsValue({ roleIds: r.roles }) }} style={{ borderRadius: 6, fontSize: 12 }}>Roles</Button>
          )}
          {can(PERMISSIONS.USER_MANAGEMENT.EDIT) && (
            <Popconfirm title="Reset this user's password?" onConfirm={() => resetPasswordMutation.mutate(r.userId)}>
              <Button size="small" icon={<KeyOutlined />} type="text" style={{ borderRadius: 6 }} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {can(PERMISSIONS.USER_MANAGEMENT.CREATE) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}
            style={{ background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', borderRadius: 8, fontWeight: 600 }}>New User</Button>
        </div>
      )}

      <div style={{ background: 'var(--color-card-bg)', borderRadius: 12, border: 'var(--border-glass)', overflow: 'hidden' }}>
        <Table
          columns={columns} dataSource={users} rowKey="userId" loading={isLoading}
          pagination={{ current: filters.page, pageSize: filters.pageSize, total, onChange: (page, pageSize) => setFilters({ page, pageSize }) }}
          locale={{ emptyText: <EmptyState title="No users found" /> }}
        />
      </div>

      {/* Create User Modal */}
      <Modal title={<span style={{ fontWeight: 700 }}>Create User</span>} open={createModal} onCancel={() => setCreateModal(false)}
        onOk={() => createForm.validateFields().then((vals) => createMutation.mutate(vals))}
        confirmLoading={createMutation.isPending} okButtonProps={{ style: { background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', border: 'none' } }}>
      <Form form={createForm} layout="vertical" style={{ marginTop: 16 }} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
        <Form.Item name="username" label="Username" rules={[VALIDATORS.required('Username')]}><Input style={{ borderRadius: 8 }} /></Form.Item>
        <Form.Item name="email" label="Email" rules={[VALIDATORS.required('Email'), VALIDATORS.email]}><Input style={{ borderRadius: 8 }} /></Form.Item>
        <Form.Item name="firstName" label="First Name" rules={[VALIDATORS.required('First Name')]}><Input style={{ borderRadius: 8 }} /></Form.Item>
        <Form.Item name="lastName" label="Last Name" rules={[VALIDATORS.required('Last Name')]}><Input style={{ borderRadius: 8 }} /></Form.Item>
        <Form.Item 
          name="password" 
          label="Password" 
          rules={[
            VALIDATORS.required('Password'),
            { min: 8, message: 'Password must contain at least 8 characters.' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character.'
            }
          ]}
        >
          <Input.Password style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item name="roleIds" label="Roles" rules={[VALIDATORS.requiredSelect('Roles')]}>
          <Select mode="multiple" style={{ borderRadius: 8 }} options={(rolesData || []).map((r) => ({ value: r.roleId, label: r.roleName || r.roleCode }))} />
        </Form.Item>
      </Form>
      </Modal>

      {/* Assign Roles Modal */}
      <Modal title={<span style={{ fontWeight: 700 }}>Assign Roles — {assignModal?.username}</span>}
        open={!!assignModal} onCancel={() => setAssignModal(null)}
        onOk={() => assignForm.validateFields().then((v) => assignRolesMutation.mutate({ id: assignModal.userId, roleIds: v.roleIds }))}
        confirmLoading={assignRolesMutation.isPending} okButtonProps={{ style: { background: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', border: 'none' } }}>
        <Form form={assignForm} layout="vertical" style={{ marginTop: 16 }} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
          <Form.Item name="roleIds" label="Roles" rules={[VALIDATORS.requiredSelect('Roles')]}>
            <Select mode="multiple" style={{ borderRadius: 8 }} options={(rolesData || []).map((r) => ({ value: r.roleId, label: r.roleName || r.roleCode }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function RolesTab() {
  const { isDarkMode } = useUIStore()
  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: userService.getRoles, select: (r) => r?.data || [] })

  return (
    <div style={{ background: 'var(--color-card-bg)', borderRadius: 12, border: 'var(--border-glass)', overflow: 'hidden' }}>
      <Table
        dataSource={roles} rowKey="roleId" loading={isLoading}
        columns={[
          { title: 'Role', dataIndex: 'roleCode', render: (v) => <Tag style={{ fontWeight: 600 }}>{v}</Tag> },
          { title: 'Name', dataIndex: 'roleName', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
          { title: 'System', dataIndex: 'isSystem', render: (v) => v ? <Tag color="processing">System</Tag> : <Tag>Custom</Tag> },
          { title: 'Permissions', dataIndex: 'permissions', render: (perms) => <span style={{ color: 'var(--color-text-secondary)' }}>{perms?.length || 0} permissions</span> },
        ]}
        pagination={false}
        locale={{ emptyText: <EmptyState title="No roles found" /> }}
      />
    </div>
  )
}

function PermissionMatrixTab() {
  const { isDarkMode } = useUIStore()
  const { data: matrix, isLoading } = useQuery({ queryKey: ['permission-matrix'], queryFn: userService.getPermissionMatrix, select: (r) => r?.data })

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading matrix...</div>
  if (!matrix) return <EmptyState title="No permission data" />

  const { roles, permissions, matrix: permsMatrix } = matrix

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 16px', textAlign: 'left', background: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(16, 17, 63, 0.03)', color: 'var(--color-text-primary)', fontWeight: 700, border: 'var(--border-glass)' }}>Permission</th>
            {roles.map((r) => (
              <th key={r.roleId} style={{ padding: '10px 12px', textAlign: 'center', background: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(16, 17, 63, 0.03)', color: 'var(--color-text-primary)', fontWeight: 700, border: 'var(--border-glass)' }}>
                {r.roleCode}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permissions.map((p, i) => (
            <tr key={p.permissionId} style={{ background: i % 2 === 0 ? 'transparent' : (isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(16, 17, 63, 0.01)') }}>
              <td style={{ padding: '8px 16px', border: 'var(--border-glass)', color: 'var(--color-text-primary)' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.permissionCode}</span>
              </td>
              {roles.map((r) => {
                const has = permsMatrix[r.roleCode]?.includes(p.permissionCode)
                return (
                  <td key={r.roleId} style={{ padding: '8px 12px', textAlign: 'center', border: 'var(--border-glass)' }}>
                    {has ? <span style={{ color: '#22C55E', fontWeight: 700 }}>✓</span> : <span style={{ color: isDarkMode ? 'rgba(255,255,255,0.15)' : '#E5E7EB' }}>–</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function UserManagementPage() {
  const tabs = [
    { key: 'users', label: 'Users', children: <UsersTab /> },
    { key: 'roles', label: 'Roles', children: <RolesTab /> },
    { key: 'matrix', label: 'Permission Matrix', children: <PermissionMatrixTab /> },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Users & Roles"
        subtitle="Manage system access and permissions"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Administration' }, { label: 'Users & Roles' }]}
      />
      <Tabs items={tabs} style={{ background: 'var(--color-card-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: 16, padding: '20px 20px 0', border: 'var(--border-glass)', boxShadow: 'var(--shadow-subtle)' }} />
    </motion.div>
  )
}
