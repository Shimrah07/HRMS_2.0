import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, Form, Input, Switch, Card, Row, Col, Tag, message, notification } from 'antd'
import { PlusOutlined, EditOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { organizationService } from '../../services/organizationService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import useUIStore from '../../store/uiStore'
import { VALIDATORS, NORMALIZE, FILTER_KEYPRESS } from '../../constants/validation'

export default function LocationsPage() {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const { isDarkMode } = useUIStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form] = Form.useForm()

  const { data: locs, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: organizationService.getLocations,
    select: (res) => res?.data || [],
  })

  const createMutation = useMutation({
    mutationFn: organizationService.createLocation,
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Location Created',
          description: 'Office location branch created successfully.',
          placement: 'topRight'
        })
        closeModal()
        queryClient.invalidateQueries({ queryKey: ['locations'] })
      }
      else {
        notification.error({
          message: 'Creation Failed',
          description: res.message || 'Failed to create location.',
          placement: 'topRight'
        })
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => organizationService.updateLocation(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({
          message: 'Location Updated',
          description: 'Office location details updated successfully.',
          placement: 'topRight'
        })
        closeModal()
        queryClient.invalidateQueries({ queryKey: ['locations'] })
      }
      else {
        notification.error({
          message: 'Update Failed',
          description: res.message || 'Failed to update location.',
          placement: 'topRight'
        })
      }
    },
  })

  const openModal = (l = null) => {
    setEditing(l)
    form.resetFields()
    if (l) form.setFieldsValue(l)
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditing(null); form.resetFields() }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editing) updateMutation.mutate({ id: editing.locationId, payload: values })
    else createMutation.mutate(values)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Locations"
        subtitle="Manage office locations and branches"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Organization' }, { label: 'Locations' }]}
        actions={
          can(PERMISSIONS.COMPANY_SETUP.CREATE) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}
              style={{ borderRadius: 8, fontWeight: 600 }}>
              New Location
            </Button>
          )
        }
      />

      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading locations...</div>
      ) : !locs?.length ? (
        <EmptyState variant="locations" action={can(PERMISSIONS.COMPANY_SETUP.CREATE) ? () => openModal() : undefined} actionLabel="Add Location" />
      ) : (
        <Row gutter={[16, 16]}>
          {locs.map((loc) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={loc.locationId}>
              <motion.div whileHover={{ y: -2 }}>
                <Card
                  style={{ height: '100%' }}
                  actions={can(PERMISSIONS.COMPANY_SETUP.EDIT) ? [
                    <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => openModal(loc)}>Edit</Button>
                  ] : []}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isDarkMode ? 'rgba(250, 167, 26, 0.15)' : 'rgba(16,17,63,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <EnvironmentOutlined style={{ color: isDarkMode ? '#FAA71A' : '#10113F', fontSize: 18 }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{loc.locationName}</div>
                      {loc.isHeadOffice && <Tag color="gold" style={{ fontSize: 10, marginTop: 2 }}>HQ</Tag>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                    {[loc.address, loc.city, loc.state, loc.pincode].filter(Boolean).join(', ')}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{loc.employeeCount || 0} employees</span>
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={<span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{editing ? 'Edit Location' : 'New Location'}</span>}
        open={modalOpen} onCancel={closeModal} onOk={handleSubmit}
        okButtonProps={{ style: { borderRadius: 8 } }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} validateTrigger={['onBlur', 'onChange']} scrollToFirstError={{ focusFirstInput: true }}>
          <Form.Item name="locationName" label="Location Name" rules={[VALIDATORS.required('Location Name')]}><Input style={{ borderRadius: 8 }} /></Form.Item>
          <Form.Item name="address" label="Address" rules={[VALIDATORS.required('Address')]}><Input style={{ borderRadius: 8 }} /></Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="city" label="City" rules={[VALIDATORS.required('City')]}><Input style={{ borderRadius: 8 }} /></Form.Item>
            <Form.Item name="state" label="State" rules={[VALIDATORS.required('State')]}><Input style={{ borderRadius: 8 }} /></Form.Item>
          </div>
          <Form.Item 
            name="pincode" 
            label="Pincode" 
            rules={[VALIDATORS.required('Pincode'), VALIDATORS.pincode]}
            normalize={NORMALIZE.numeric}
            onKeyPress={FILTER_KEYPRESS.numericOnly}
            extra="Format: 6-digit number (e.g. 110001)"
          >
            <Input maxLength={6} style={{ borderRadius: 8 }} />
          </Form.Item>
          <Form.Item name="isHeadOffice" label="Head Office" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  )
}
