import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Switch, Row, Col, Statistic, Space, message, Typography } from 'antd'
import { GlobalOutlined, SettingOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import exitService from '../../services/exitService'

const { Option } = Select
const { Text } = Typography

const DEFAULT_SECTORS = [
  { sectorName: 'IT', priority: 'Critical', desc: 'IP/data security clearance, immediate code repo access revoke, DLP audit & NDA reminder' },
  { sectorName: 'Manufacturing', priority: 'High', desc: 'Shop-floor tool return checklist, safety gear check & factory gate pass' },
  { sectorName: 'Healthcare', priority: 'Critical', desc: 'Clinical handover, patient record access revoke & Medical Council intimation' },
  { sectorName: 'BFSI', priority: 'Critical', desc: 'Regulatory reporting of key personnel exit, fidelity bond closure & compliance signoff' },
  { sectorName: 'Sales', priority: 'High', desc: 'Client relationship handover, non-compete reminder & transition plan' },
  { sectorName: 'Government', priority: 'Critical', desc: 'Pension processing, vigilance clearance NOC & service book updation' },
  { sectorName: 'Consulting', priority: 'High', desc: 'Client project transition, billing closure & account manager reassignment' },
  { sectorName: 'Retail', priority: 'Medium', desc: 'Store-level clearance, cash reconciliation & inventory check' },
]

export default function ExitSectorRulesPage() {
  const [loading, setLoading] = useState(false)
  const [configs, setConfigs] = useState([])
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [selectedSector, setSelectedSector] = useState(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await exitService.getSectorConfigs()
      setConfigs(res || [])
    } catch (err) {
      console.error(err)
      message.error('Failed to load sector rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveConfig = async (values) => {
    try {
      await exitService.saveSectorConfig({
        sectorName: values.sectorName,
        priority: values.priority,
        configJson: values.configJson,
        isActive: values.isActive !== false
      })
      message.success(`Sector configuration for ${values.sectorName} saved`)
      setConfigModalOpen(false)
      form.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to save sector rule')
    }
  }

  const columns = [
    {
      title: 'Sector / Industry',
      dataIndex: 'sectorName',
      key: 'sectorName',
      render: (text) => <Text style={{ fontWeight: 600 }}>{text}</Text>
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (p) => <Tag color={p === 'Critical' ? 'red' : p === 'High' ? 'orange' : 'blue'}>{p}</Tag>
    },
    {
      title: 'Offboarding Checklist Rules',
      dataIndex: 'configJson',
      key: 'configJson',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => active !== false ? <Tag color="success">Active</Tag> : <Tag color="default">Inactive</Tag>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" icon={<SettingOutlined />} onClick={() => { setSelectedSector(record); form.setFieldsValue(record); setConfigModalOpen(true); }}>
          Configure
        </Button>
      )
    }
  ]

  const displayData = DEFAULT_SECTORS.map(ds => {
    const found = configs.find(c => c.sectorName === ds.sectorName)
    return {
      sectorName: ds.sectorName,
      priority: found?.priority || ds.priority,
      configJson: found?.configJson || ds.desc,
      isActive: found ? found.isActive : true
    }
  })

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Sector-Specific Exit Rules & Offboarding Configuration"
        subtitle="Configure industry-tailored exit rules for IT, Manufacturing, Healthcare, BFSI, Sales, Government, Consulting, and Retail"
        breadcrumbs={[
          { title: 'Home', href: '/dashboard' },
          { title: 'Exit Management' },
          { title: 'Sector Rules' }
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Configured Sectors" value={8} prefix={<GlobalOutlined style={{ color: '#FAA71A' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Critical Compliance Rules" value={4} prefix={<SafetyCertificateOutlined style={{ color: '#ff4d4f' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Active Offboarding Matrices" value={8} prefix={<SettingOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
      </Row>

      <Card title="Sector-Wise Exit Matrix Rules">
        <Table columns={columns} dataSource={displayData} rowKey="sectorName" loading={loading} />
      </Card>

      <Modal
        title={`Configure Exit Rules — ${selectedSector?.sectorName || ''}`}
        open={configModalOpen}
        onCancel={() => setConfigModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveConfig}>
          <Form.Item name="sectorName" label="Sector Name" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="priority" label="Security & Compliance Priority" rules={[{ required: true }]}>
            <Select>
              <Option value="Critical">Critical</Option>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Form.Item>
          <Form.Item name="configJson" label="Offboarding Checklist Configuration (JSON / Text)" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="isActive" label="Rule Active" valuePropName="checked" initialValue={true}>
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
