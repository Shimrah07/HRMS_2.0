import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tabs, Form, Input, Button, Card, message, Table, Tag, Upload, notification } from 'antd'
import { VALIDATORS, NORMALIZE, FILTER_KEYPRESS } from '../../constants/validation'
import { SaveOutlined, KeyOutlined, AuditOutlined, UploadOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import { organizationService } from '../../services/organizationService'
import { authService } from '../../services/authService'
import PageHeader from '../../components/common/PageHeader'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import useUIStore from '../../store/uiStore'

function CompanyTab() {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const { isDarkMode } = useUIStore()
  const [form] = Form.useForm()

  const { data: company, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: organizationService.getCompany,
    select: (res) => {
      if (res?.data) form.setFieldsValue(res.data)
      return res?.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: organizationService.updateCompany,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Settings Saved',
          description: 'Company profile updated successfully.',
          placement: 'topRight'
        })
        queryClient.invalidateQueries({ queryKey: ['company'] })
      }
      else {
        notification.error({
          message: 'Update Failed',
          description: res.message || 'Failed to update company profile.',
          placement: 'topRight'
        })
      }
    },
  })

  const isEditable = can(PERMISSIONS.COMPANY_SETUP.EDIT)

  return (
    <Card title="Company Profile" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', maxWidth: 700 }}>
      <Form form={form} layout="vertical" onFinish={(vals) => updateMutation.mutate(vals)} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
        <Form.Item name="companyName" label="Company Name" rules={[VALIDATORS.required('Company Name')]}><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
        <Form.Item name="displayName" label="Display Name" rules={[VALIDATORS.required('Display Name')]}><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
        <Form.Item name="legalName" label="Legal Name" rules={[VALIDATORS.required('Legal Name')]}><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item name="cin" label="CIN" rules={[VALIDATORS.required('CIN')]}><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
          <Form.Item 
            name="pan" 
            label="PAN" 
            rules={[VALIDATORS.required('PAN'), VALIDATORS.pan]}
            normalize={NORMALIZE.uppercase}
          >
            <Input disabled={!isEditable} maxLength={10} style={{ borderRadius: 8 }} />
          </Form.Item>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item name="gstin" label="GSTIN" rules={[VALIDATORS.required('GSTIN')]}><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
          <Form.Item name="epfNumber" label="EPF Number"><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
        </div>
        <Form.Item name="address" label="Registered Address" rules={[VALIDATORS.required('Registered Address')]}><Input.TextArea disabled={!isEditable} rows={2} style={{ borderRadius: 8 }} /></Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Form.Item name="city" label="City" rules={[VALIDATORS.required('City')]}><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
          <Form.Item name="state" label="State" rules={[VALIDATORS.required('State')]}><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
          <Form.Item 
            name="pincode" 
            label="Pincode" 
            rules={[VALIDATORS.required('Pincode'), VALIDATORS.pincode]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
          >
            <Input disabled={!isEditable} maxLength={6} style={{ borderRadius: 8 }} />
          </Form.Item>
        </div>
        <Form.Item name="website" label="Website"><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
        <Form.Item name="supportEmail" label="HR Support Email" rules={[VALIDATORS.required('HR Support Email'), VALIDATORS.email]}><Input disabled={!isEditable} style={{ borderRadius: 8 }} /></Form.Item>
        {isEditable && (
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updateMutation.isPending}
            style={{ borderRadius: 8 }}>
            Save Changes
          </Button>
        )}
      </Form>
    </Card>
  )
}

function SecurityTab() {
  const { isDarkMode } = useUIStore()
  const [form] = Form.useForm()
  const changePwMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword, confirmPassword }) =>
      authService.changePassword(currentPassword, newPassword, confirmPassword),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Password Changed',
          description: 'Your password has been successfully updated.',
          placement: 'topRight'
        })
        form.resetFields()
      }
      else {
        notification.error({
          message: 'Change Failed',
          description: res.message || 'Failed to change password.',
          placement: 'topRight'
        })
      }
    },
  })

  return (
    <Card title="Change Password" style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', maxWidth: 480 }}>
      <Form form={form} layout="vertical" onFinish={(vals) => changePwMutation.mutate(vals)} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
        <Form.Item name="currentPassword" label="Current Password" rules={[VALIDATORS.required('Current Password')]}>
          <Input.Password style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item name="newPassword" label="New Password" 
          rules={[
            VALIDATORS.required('New Password'),
            { min: 8, message: 'Password must contain at least 8 characters.' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character.'
            }
          ]}>
          <Input.Password style={{ borderRadius: 8 }} />
        </Form.Item>
        <Form.Item name="confirmPassword" label="Confirm New Password"
          dependencies={['newPassword']}
          rules={[
            VALIDATORS.required('Confirm Password'),
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject('Passwords do not match');
              }
            })
          ]}
        >
          <Input.Password style={{ borderRadius: 8 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit" icon={<KeyOutlined />} loading={changePwMutation.isPending}
          style={{ borderRadius: 8 }}>
          Change Password
        </Button>
      </Form>
    </Card>
  )
}

function AuditLogsTab() {
  const { isDarkMode } = useUIStore()
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => organizationService.getAuditLogs({ page: 1, pageSize: 50 }),
    select: (res) => res?.data || [],
  })

  const columns = [
    { title: 'Action', dataIndex: 'action', key: 'action', render: (v) => <Tag color="processing">{v}</Tag> },
    { title: 'Entity', dataIndex: 'entityType', key: 'entity', render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: 'User', dataIndex: 'performedByUsername', key: 'user', render: (v) => v || '—' },
    { title: 'IP', dataIndex: 'ipAddress', key: 'ip', render: (v) => v || '—' },
    { title: 'Time', dataIndex: 'performedAt', key: 'time', render: (v) => dayjs(v).format('DD MMM YYYY HH:mm') },
  ]

  return (
    <div style={{ background: 'var(--color-card-bg)', borderRadius: 12, border: 'var(--border-glass)', overflow: 'hidden' }}>
      <Table columns={columns} dataSource={data || []} rowKey="auditLogId" loading={isLoading} pagination={{ pageSize: 20 }} />
    </div>
  )
}

export default function SettingsPage() {
  const tabs = [
    { key: 'company', label: 'Company Profile', icon: <SaveOutlined />, children: <CompanyTab /> },
    { key: 'security', label: 'Security', icon: <KeyOutlined />, children: <SecurityTab /> },
    { key: 'audit', label: 'Audit Logs', icon: <AuditOutlined />, children: <AuditLogsTab /> },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Settings"
        subtitle="Configure your HRMS workspace"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Settings' }]}
      />
      <Tabs items={tabs} />
    </motion.div>
  )
}
