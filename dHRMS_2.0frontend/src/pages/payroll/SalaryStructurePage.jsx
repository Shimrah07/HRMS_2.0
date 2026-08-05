import { useState, useEffect, useCallback } from 'react'
import {
  Card, Button, Table, Tag, Tabs, Modal, Form, Input, Select, Switch,
  Space, Popconfirm, message, Tooltip, Row, Col, Divider, InputNumber, Badge
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined,
  BankOutlined, SettingOutlined, CheckCircleOutlined, StopOutlined, CalculatorOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import PageHeader from '../../components/common/PageHeader'
import useUIStore from '../../store/uiStore'
import api from '../../lib/axios'
import PayrollSubNav from '../../components/payroll/PayrollSubNav'
import SalaryStructureBuilderView from '../../components/payroll/SalaryStructureBuilderView'

// ─── API helpers ─────────────────────────────────────────────────────────────
const salaryConfigApi = {
  getComponents: () => api.get('/payroll/components').then(r => r.data),
  createComponent: (data) => api.post('/payroll/components', data).then(r => r.data),
  updateComponent: (id, data) => api.put(`/payroll/components/${id}`, data).then(r => r.data),
  deleteComponent: (id) => api.delete(`/payroll/components/${id}`).then(r => r.data),
  getStructures: () => api.get('/payroll/structures').then(r => r.data),
  createStructure: (data) => api.post('/payroll/structures', data).then(r => r.data),
  updateStructure: (id, data) => api.put(`/payroll/structures/${id}`, data).then(r => r.data),
  deleteStructure: (id) => api.delete(`/payroll/structures/${id}`).then(r => r.data),
}

const COMPONENT_TYPE_COLORS = {
  Earning: 'green',
  Deduction: 'red',
  Statutory: 'orange',
  EmployerContribution: 'blue',
  Reimbursement: 'purple',
}

// ─── Component Modal ─────────────────────────────────────────────────────────
function ComponentModal({ open, onClose, onSave, initial }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (initial) form.setFieldsValue(initial)
    }
  }, [open, initial, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await onSave(values)
      onClose()
    } catch (err) {
      if (err?.errorFields) return // Antd validation error
      message.error(err?.response?.data?.errors?.[0] || 'Failed to save component.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={initial ? 'Edit Salary Component' : 'Add Salary Component'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText={initial ? 'Update' : 'Create'}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ isStatutory: false, isTaxable: true, isActive: true, calculationType: 'Fixed', componentType: 'Earning' }}>
        <Row gutter={16}>
          <Col span={14}>
            <Form.Item name="componentName" label="Component Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g., House Rent Allowance" />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="componentCode" label="Short Code" rules={[{ required: true, message: 'Required' }, { max: 10, message: 'Max 10 chars' }]}>
              <Input placeholder="HRA" style={{ textTransform: 'uppercase' }} disabled={!!initial} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="componentType" label="Component Type" rules={[{ required: true }]}>
              <Select>
                <Option value="Earning">Earning</Option>
                <Option value="Deduction">Deduction</Option>
                <Option value="Statutory">Statutory</Option>
                <Option value="EmployerContribution">Employer Contribution</Option>
                <Option value="Reimbursement">Reimbursement</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="calculationType" label="Calculation Type" rules={[{ required: true }]}>
              <Select>
                <Option value="Fixed">Fixed Amount</Option>
                <Option value="Percentage">% of Gross / Component</Option>
                <Option value="Formula">Formula</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="isTaxable" label="Taxable?" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="isStatutory" label="Statutory?" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" disabled={!!initial} />
            </Form.Item>
          </Col>
          {initial && (
            <Col span={8}>
              <Form.Item name="isActive" label="Active?" valuePropName="checked">
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          )}
        </Row>
      </Form>
    </Modal>
  )
}

// ─── Structure Modal ──────────────────────────────────────────────────────────
function StructureModal({ open, onClose, onSave, initial, components }) {
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState([{ componentId: undefined, fixedValue: 0, formula: '' }])

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (initial) {
        form.setFieldsValue({
          structureName: initial.structureName,
          effectiveFrom: initial.effectiveFrom,
          effectiveTo: initial.effectiveTo || '',
          isActive: initial.isActive,
        })
        setRows(initial.components?.length > 0
          ? initial.components.map(c => ({ componentId: c.componentId, fixedValue: c.fixedValue, formula: c.formula || '' }))
          : [{ componentId: undefined, fixedValue: 0, formula: '' }])
      } else {
        setRows([{ componentId: undefined, fixedValue: 0, formula: '' }])
      }
    }
  }, [open, initial, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      const payload = {
        ...values,
        components: rows.filter(r => r.componentId).map(r => ({
          componentId: r.componentId,
          fixedValue: r.fixedValue || 0,
          formula: r.formula || null
        }))
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      if (err?.errorFields) return
      message.error(err?.response?.data?.errors?.[0] || 'Failed to save structure.')
    } finally {
      setSaving(false)
    }
  }

  const updateRow = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  return (
    <Modal
      title={initial ? 'Edit Salary Structure' : 'Create Salary Structure'}
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={saving}
      okText={initial ? 'Update' : 'Create'}
      width={760}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item name="structureName" label="Structure Name" rules={[{ required: true }]}>
              <Input placeholder="e.g., Standard Monthly Structure" />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item name="effectiveTo" label="Effective To (optional)">
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ fontSize: 12, margin: '8px 0 12px' }}>Component Assignments</Divider>

        {rows.map((row, idx) => (
          <Row key={idx} gutter={8} style={{ marginBottom: 8, alignItems: 'center' }}>
            <Col span={10}>
              <Select
                value={row.componentId}
                onChange={v => updateRow(idx, 'componentId', v)}
                placeholder="Select component"
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="label"
                options={components.map(c => ({ label: `${c.componentName} (${c.componentCode})`, value: c.componentId }))}
              />
            </Col>
            <Col span={7}>
              <InputNumber
                value={row.fixedValue}
                onChange={v => updateRow(idx, 'fixedValue', v)}
                placeholder="Fixed amount / %"
                style={{ width: '100%' }}
                prefix="₹"
                min={0}
              />
            </Col>
            <Col span={5}>
              <Input
                value={row.formula}
                onChange={e => updateRow(idx, 'formula', e.target.value)}
                placeholder="Formula (optional)"
              />
            </Col>
            <Col span={2}>
              <Button size="small" danger type="text" onClick={() => setRows(prev => prev.filter((_, i) => i !== idx))}>✕</Button>
            </Col>
          </Row>
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setRows(prev => [...prev, { componentId: undefined, fixedValue: 0, formula: '' }])}
          size="small"
          style={{ marginTop: 4 }}
        >
          Add Component
        </Button>
      </Form>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SalaryStructurePage() {
  const { isDarkMode } = useUIStore()
  const [components, setComponents] = useState([])
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(false)
  const [compModal, setCompModal] = useState({ open: false, initial: null })
  const [structModal, setStructModal] = useState({ open: false, initial: null })
  const [builderModalOpen, setBuilderModalOpen] = useState(false)

  const loadComponents = useCallback(async () => {
    try {
      const res = await salaryConfigApi.getComponents()
      setComponents(res.data || [])
    } catch { setComponents([]) }
  }, [])

  const loadStructures = useCallback(async () => {
    try {
      const res = await salaryConfigApi.getStructures()
      setStructures(res.data || [])
    } catch { setStructures([]) }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadComponents(), loadStructures()]).finally(() => setLoading(false))
  }, [loadComponents, loadStructures])

  // ─── Component CRUD ───────────────────────────────────────────────────────
  const handleSaveComponent = async (values) => {
    if (compModal.initial) {
      await salaryConfigApi.updateComponent(compModal.initial.componentId, values)
      message.success('Component updated successfully.')
    } else {
      await salaryConfigApi.createComponent(values)
      message.success('Component created successfully.')
    }
    await loadComponents()
  }

  const handleDeleteComponent = async (id) => {
    try {
      const res = await salaryConfigApi.deleteComponent(id)
      message.success(res.message || 'Component deleted.')
      await loadComponents()
    } catch (err) {
      message.error(err?.response?.data?.errors?.[0] || 'Delete failed.')
    }
  }

  // ─── Structure CRUD ───────────────────────────────────────────────────────
  const handleSaveStructure = async (values) => {
    if (structModal.initial) {
      await salaryConfigApi.updateStructure(structModal.initial.structureId, values)
      message.success('Structure updated successfully.')
    } else {
      await salaryConfigApi.createStructure(values)
      message.success('Structure created successfully.')
    }
    await loadStructures()
  }

  const handleDeleteStructure = async (id) => {
    try {
      const res = await salaryConfigApi.deleteStructure(id)
      message.success(res.message || 'Structure deactivated.')
      await loadStructures()
    } catch (err) {
      message.error(err?.response?.data?.errors?.[0] || 'Delete failed.')
    }
  }

  // ─── Table Columns ────────────────────────────────────────────────────────
  const componentColumns = [
    {
      title: 'Component Name',
      dataIndex: 'componentName',
      key: 'componentName',
      render: (v, r) => <Space><strong>{v}</strong><Tag style={{ fontSize: 10 }}>{r.componentCode}</Tag></Space>
    },
    {
      title: 'Type',
      dataIndex: 'componentType',
      key: 'componentType',
      render: (v) => <Tag color={COMPONENT_TYPE_COLORS[v] || 'default'}>{v}</Tag>
    },
    { title: 'Calculation', dataIndex: 'calculationType', key: 'calculationType' },
    { title: 'Taxable', dataIndex: 'isTaxable', key: 'isTaxable', render: v => v ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <StopOutlined style={{ color: '#ccc' }} /> },
    { title: 'Statutory', dataIndex: 'isStatutory', key: 'isStatutory', render: v => v ? <Tag color="orange">Statutory</Tag> : null },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: v => <Badge status={v ? 'success' : 'default'} text={v ? 'Active' : 'Inactive'} />
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Tooltip title={r.isStatutory ? "Statutory components cannot be edited" : "Edit"}>
            <Button
              size="small" icon={<EditOutlined />} type="text"
              disabled={r.isStatutory}
              onClick={() => setCompModal({ open: true, initial: r })}
            />
          </Tooltip>
          <Popconfirm title="Remove this component?" onConfirm={() => handleDeleteComponent(r.componentId)} okText="Yes" cancelText="No">
            <Button size="small" icon={<DeleteOutlined />} type="text" danger disabled={r.isStatutory} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const structureColumns = [
    { title: 'Structure Name', dataIndex: 'structureName', key: 'structureName', render: v => <strong>{v}</strong> },
    {
      title: 'Effective Period',
      key: 'period',
      render: (_, r) => `${r.effectiveFrom} → ${r.effectiveTo || 'Ongoing'}`
    },
    {
      title: 'Components',
      key: 'components',
      render: (_, r) => (
        <Space wrap>
          {(r.components || []).slice(0, 4).map(c => (
            <Tag key={c.id} color={COMPONENT_TYPE_COLORS[c.componentType] || 'default'} style={{ fontSize: 10 }}>
              {c.componentCode || c.componentName}
            </Tag>
          ))}
          {r.components?.length > 4 && <Tag>+{r.components.length - 4} more</Tag>}
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: v => <Badge status={v ? 'success' : 'default'} text={v ? 'Active' : 'Inactive'} />
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} type="text" onClick={() => setStructModal({ open: true, initial: r })} />
          <Popconfirm title="Deactivate this structure?" onConfirm={() => handleDeleteStructure(r.structureId)} okText="Yes" cancelText="No">
            <Button size="small" icon={<DeleteOutlined />} type="text" danger />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const tabs = [
    {
      key: 'builder',
      label: <Space><CalculatorOutlined />Salary Structure Builder</Space>,
      children: <SalaryStructureBuilderView onSaveSuccess={() => loadStructures()} />
    },
    {
      key: 'components',
      label: <Space><AppstoreOutlined />Salary Components Catalog</Space>,
      children: (
        <Card
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCompModal({ open: true, initial: null })} style={{ borderRadius: 8 }}>
              Add Component
            </Button>
          }
          style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}
        >
          <Table
            columns={componentColumns}
            dataSource={components}
            rowKey="componentId"
            loading={loading}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      )
    },
    {
      key: 'structures',
      label: <Space><BankOutlined />Saved Structures</Space>,
      children: (
        <Card
          extra={
            <Button type="default" icon={<PlusOutlined />} onClick={() => setStructModal({ open: true, initial: null })} style={{ borderRadius: 8 }}>
              Create Template
            </Button>
          }
          style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}
        >
          <Table
            columns={structureColumns}
            dataSource={structures}
            rowKey="structureId"
            loading={loading}
            pagination={{ pageSize: 8 }}
            size="small"
            expandable={{
              expandedRowRender: record => (
                <Table
                  columns={[
                    { title: 'Component', dataIndex: 'componentName', key: 'name' },
                    { title: 'Code', dataIndex: 'componentCode', key: 'code', render: v => <Tag>{v}</Tag> },
                    { title: 'Type', dataIndex: 'componentType', key: 'type', render: v => <Tag color={COMPONENT_TYPE_COLORS[v]}>{v}</Tag> },
                    { title: 'Calc. Type', dataIndex: 'calculationType', key: 'calc' },
                    { title: 'Fixed Value', dataIndex: 'fixedValue', key: 'fixed', render: v => v > 0 ? `₹${v.toLocaleString('en-IN')}` : '—' },
                    { title: 'Formula', dataIndex: 'formula', key: 'formula', render: v => v || '—' },
                  ]}
                  dataSource={record.components || []}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ),
            }}
          />
        </Card>
      )
    }
  ]

  const [savedModalOpen, setSavedModalOpen] = useState(false)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Salary Structure Builder"
        subtitle="Full employee CTC salary configuration workspace — decide annual CTC, configure payslip & beneficiary components, and view live division."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Payroll', path: '/payroll' }, { label: 'Salary Structure Builder' }]}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<BankOutlined />}
              onClick={() => {
                loadStructures()
                setSavedModalOpen(true)
              }}
              style={{ background: '#6366f1', borderColor: '#6366f1', borderRadius: 8 }}
            >
              Saved Structures
            </Button>
          </Space>
        }
      />

      <div style={{ marginTop: 16 }}>
        <PayrollSubNav activeKey="salary-config" />
        <SalaryStructureBuilderView onSaveSuccess={() => loadStructures()} />
      </div>

      {/* Modal: View Saved Salary Structures */}
      <Modal
        title={
          <Space>
            <BankOutlined style={{ color: '#6366f1' }} />
            <span>Saved Salary Structures & Templates</span>
          </Space>
        }
        open={savedModalOpen}
        onCancel={() => setSavedModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tag color="purple">Total Templates: {structures.length}</Tag>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => setStructModal({ open: true, initial: null })}
          >
            Create New Template
          </Button>
        </div>
        <Table
          columns={structureColumns}
          dataSource={structures}
          rowKey="structureId"
          loading={loading}
          pagination={{ pageSize: 6 }}
          size="small"
          expandable={{
            expandedRowRender: record => (
              <Table
                columns={[
                  { title: 'Component', dataIndex: 'componentName', key: 'name' },
                  { title: 'Code', dataIndex: 'componentCode', key: 'code', render: v => <Tag>{v}</Tag> },
                  { title: 'Type', dataIndex: 'componentType', key: 'type', render: v => <Tag color={COMPONENT_TYPE_COLORS[v]}>{v}</Tag> },
                  { title: 'Calc. Type', dataIndex: 'calculationType', key: 'calc' },
                  { title: 'Fixed Value', dataIndex: 'fixedValue', key: 'fixed', render: v => v > 0 ? `₹${v.toLocaleString('en-IN')}` : '—' },
                  { title: 'Formula', dataIndex: 'formula', key: 'formula', render: v => v || '—' },
                ]}
                dataSource={record.components || []}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ),
          }}
        />
      </Modal>

      <ComponentModal
        open={compModal.open}
        onClose={() => setCompModal({ open: false, initial: null })}
        onSave={handleSaveComponent}
        initial={compModal.initial}
      />

      <StructureModal
        open={structModal.open}
        onClose={() => setStructModal({ open: false, initial: null })}
        onSave={handleSaveStructure}
        initial={structModal.initial}
        components={components}
      />
    </motion.div>
  )
}
