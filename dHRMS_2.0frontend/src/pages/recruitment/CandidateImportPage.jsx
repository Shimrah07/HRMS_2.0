import { useState, useEffect } from 'react'
import { Card, Table, Button, Select, Upload, Space, message, Row, Col, Alert, Modal, List } from 'antd'
import { UploadOutlined, CloudUploadOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import { recruitmentService } from '../../services/recruitmentService'

const { Option } = Select

export default function CandidateImportPage() {
  const [jobs, setJobs] = useState([])
  const [selectedJobId, setSelectedJobId] = useState(null)
  const [file, setFile] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewRows, setPreviewRows] = useState([])
  const [importing, setImporting] = useState(false)
  const [resultModal, setResultModal] = useState(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const res = await recruitmentService.getAdminPostings({ status: 'Active' })
      if (res.success) {
        setJobs(res.data || [])
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to load active job openings.')
    }
  }

  const handleFileChange = async (info) => {
    const selectedFile = info.file
    setFile(selectedFile)
    setPreviewRows([])

    if (!selectedFile) return

    setLoadingPreview(true)
    try {
      const res = await recruitmentService.previewImport(selectedFile)
      if (res.success) {
        setPreviewRows(res.data || [])
        message.success(`${res.data?.length || 0} rows parsed successfully.`)
      } else {
        message.error(res.errors?.[0] || 'Failed to parse file preview.')
        setFile(null)
      }
    } catch (err) {
      console.error(err)
      message.error('An error occurred while uploading/parsing the file.')
      setFile(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleImport = async () => {
    if (!selectedJobId) {
      message.warning('Please select a target Job Opening.')
      return
    }
    if (previewRows.length === 0) {
      message.warning('No candidate records available to import.')
      return
    }

    setImporting(true)
    try {
      const payload = {
        jobId: selectedJobId,
        candidates: previewRows
      }
      const res = await recruitmentService.applyImport(payload)
      if (res.success) {
        setResultModal(res.data)
        // Reset sheet state
        setFile(null)
        setPreviewRows([])
      } else {
        message.error(res.errors?.[0] || 'Import failed.')
      }
    } catch (err) {
      console.error(err)
      message.error('An error occurred during bulk candidates import.')
    } finally {
      setImporting(false)
    }
  }

  const columns = [
    { title: 'First Name', dataIndex: 'firstName', key: 'firstName', width: 120 },
    { title: 'Last Name', dataIndex: 'lastName', key: 'lastName', width: 120, render: v => v || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 180 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', width: 130, render: v => v || '-' },
    { title: 'Current Company', dataIndex: 'currentCompany', key: 'currentCompany', width: 160, render: v => v || '-' },
    { title: 'Current Designation', dataIndex: 'currentDesignation', key: 'currentDesignation', width: 160, render: v => v || '-' },
    { title: 'Experience (Yrs)', dataIndex: 'totalExperience', key: 'totalExperience', width: 110, render: v => v != null ? `${v} yrs` : '-' },
    { title: 'Source', dataIndex: 'source', key: 'source', width: 120, render: v => v || 'CSVImport' }
  ]

  return (
    <div style={{ padding: '0px' }}>
      <PageHeader
        title="CSV / Excel Candidate Import"
        subtitle="Upload spreadsheet templates to import candidates directly into open Job Openings."
      />

      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        {/* Setup Card */}
        <Col span={24}>
          <Card bordered={false} className="premium-glass-card" style={{ borderRadius: 12 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={10}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>1. Select Target Job Opening</div>
                <Select
                  placeholder="Select Job Opening"
                  style={{ width: '100%' }}
                  value={selectedJobId}
                  onChange={v => setSelectedJobId(v)}
                >
                  {jobs.map(job => (
                    <Option key={job.jobId} value={job.jobId}>
                      {job.jobTitle} ({job.departmentName || 'General'})
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>2. Choose Candidate Sheet (CSV / Excel)</div>
                <Upload
                  beforeUpload={() => false}
                  onChange={handleFileChange}
                  fileList={file ? [file] : []}
                  maxCount={1}
                  accept=".csv,.xlsx"
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} style={{ width: '100%', borderRadius: 8 }}>
                    {file ? 'Change Spreadsheet' : 'Upload Spreadsheet'}
                  </Button>
                </Upload>
              </Col>
              <Col xs={24} md={6} style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: 24 }}>
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  loading={importing}
                  disabled={!selectedJobId || previewRows.length === 0}
                  onClick={handleImport}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(90deg, #FAA71A 0%, #f5c842 100%)',
                    border: 'none',
                    color: '#10113F',
                    fontWeight: 700,
                    borderRadius: 8,
                    height: 38
                  }}
                >
                  Confirm Import
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Preview Workspace */}
        <Col span={24}>
          <Card
            title={
              <span style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: 14 }}>
                Parsed Candidate Preview ({previewRows.length} records found)
              </span>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            {file && (
              <div style={{ marginBottom: 16 }}>
                <Alert
                  message={`Currently showing preview for file: ${file.name}`}
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}

            <Table
              dataSource={previewRows}
              columns={columns}
              rowKey={(r, idx) => r.email || idx.toString()}
              loading={loadingPreview}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Upload a candidate sheet to preview records' }}
              scroll={{ x: 1200 }}
              style={{ background: 'transparent' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Summary Dialog */}
      <Modal
        visible={resultModal !== null}
        onCancel={() => setResultModal(null)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setResultModal(null)}>
            Close
          </Button>
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
            <CheckCircleOutlined style={{ color: '#22C55E' }} />
            Bulk Candidate Import Completed
          </div>
        }
        width={600}
        destroyOnClose
      >
        {resultModal && (
          <div>
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={6} style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Total Rows</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{resultModal.totalRows}</div>
              </Col>
              <Col span={6} style={{ textAlign: 'center' }}>
                <div style={{ color: '#22C55E', fontSize: 12 }}>Imported</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#22C55E' }}>{resultModal.importedCount}</div>
              </Col>
              <Col span={6} style={{ textAlign: 'center' }}>
                <div style={{ color: '#FAA71A', fontSize: 12 }}>Skipped</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#FAA71A' }}>{resultModal.skippedCount}</div>
              </Col>
              <Col span={6} style={{ textAlign: 'center' }}>
                <div style={{ color: '#E94043', fontSize: 12 }}>Failed</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#E94043' }}>{resultModal.failedCount || 0}</div>
              </Col>
            </Row>

            {resultModal.errors?.length > 0 && (
              <div>
                <h4 style={{ fontWeight: 700, color: '#E94043', marginBottom: 8 }}>Skipped/Failed Rows & Explanations:</h4>
                <div style={{ maxHeight: 200, overflowY: 'auto', background: 'rgba(233,64,67,0.05)', border: '1px solid rgba(233,64,67,0.1)', padding: 12, borderRadius: 8 }}>
                  <List
                    size="small"
                    dataSource={resultModal.errors}
                    renderItem={err => (
                      <List.Item style={{ fontSize: 12, color: 'var(--color-text-muted)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        ⚠️ {err}
                      </List.Item>
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
