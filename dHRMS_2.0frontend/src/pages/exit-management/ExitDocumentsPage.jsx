import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Select, Row, Col, Statistic, Space, message, Typography } from 'antd'
import { FilePdfOutlined, DownloadOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import exitService from '../../services/exitService'

const { Option } = Select
const { Text } = Typography

export default function ExitDocumentsPage() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [genModalOpen, setGenModalOpen] = useState(false)
  const [selectedExit, setSelectedExit] = useState(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await exitService.getExitRecords({ page: 1, pageSize: 50 })
      setRecords(res.items || [])
    } catch (err) {
      console.error(err)
      message.error('Failed to load exit document records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleGenerateDocument = async (values) => {
    if (!selectedExit) return
    try {
      await exitService.generateDocument(selectedExit.exitId, values.documentType, values.conductRemark)
      message.success(`${values.documentType} generated successfully`)
      setGenModalOpen(false)
      form.resetFields()
      loadData()
    } catch (err) {
      console.error(err)
      message.error('Failed to generate exit document')
    }
  }

  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.employeeCode} · {record.departmentName}</div>
        </div>
      )
    },
    {
      title: 'Exit Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'Closed' ? 'success' : 'processing'}>{status}</Tag>
    },
    {
      title: 'Relieving Letter',
      key: 'relieving',
      render: (_, record) => {
        const doc = record.documents?.find(d => d.documentType === 'RelievingLetter')
        return doc ? (
          <Button size="small" type="link" icon={<FilePdfOutlined />} href={doc.filePath} target="_blank">
            Download PDF
          </Button>
        ) : <Text type="secondary">Not Generated</Text>
      }
    },
    {
      title: 'Experience Letter',
      key: 'experience',
      render: (_, record) => {
        const doc = record.documents?.find(d => d.documentType === 'ExperienceLetter')
        return doc ? (
          <Button size="small" type="link" icon={<FilePdfOutlined />} href={doc.filePath} target="_blank">
            Download PDF
          </Button>
        ) : <Text type="secondary">Not Generated</Text>
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" type="primary" icon={<SafetyCertificateOutlined />} onClick={() => { setSelectedExit(record); setGenModalOpen(true); }}>
          Generate Document
        </Button>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Exit Documents Management"
        subtitle="Auto-generate legally compliant, digitally signed Relieving Letters, Experience Letters, NOCs, and FFS Statements"
        breadcrumbs={[
          { title: 'Home', href: '/dashboard' },
          { title: 'Exit Management' },
          { title: 'Exit Documents' }
        ]}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Total Exit Documents Generated" value={records.reduce((acc, r) => acc + (r.documents?.length || 0), 0)} prefix={<FilePdfOutlined style={{ color: '#FAA71A' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Relieving Letters Issued" value={records.reduce((acc, r) => acc + (r.documents?.filter(d => d.documentType === 'RelievingLetter').length || 0), 0)} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="glass-card">
            <Statistic title="Experience Letters Issued" value={records.reduce((acc, r) => acc + (r.documents?.filter(d => d.documentType === 'ExperienceLetter').length || 0), 0)} prefix={<DownloadOutlined style={{ color: '#1890ff' }} />} />
          </Card>
        </Col>
      </Row>

      <Card title="Exit Document Issuance Master">
        <Table columns={columns} dataSource={records} rowKey="exitId" loading={loading} />
      </Card>

      <Modal
        title={`Generate Exit Document — ${selectedExit?.employeeName || ''}`}
        open={genModalOpen}
        onCancel={() => setGenModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleGenerateDocument}>
          <Form.Item name="documentType" label="Document Type" rules={[{ required: true }]}>
            <Select placeholder="Select Document">
              <Option value="RelievingLetter">Relieving Letter</Option>
              <Option value="ExperienceLetter">Experience Letter</Option>
              <Option value="ResignationAcceptance">Resignation Acceptance Letter</Option>
              <Option value="NOC">No Objection Certificate (NOC)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="conductRemark" label="Conduct & Character Remark" initialValue="Satisfactory">
            <Select>
              <Option value="Satisfactory">Satisfactory</Option>
              <Option value="Good">Good</Option>
              <Option value="Excellent">Excellent</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
