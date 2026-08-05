import React, { useState } from 'react';
import { Modal, Upload, Button, Table, Alert, Typography, Space, message, Tag } from 'antd';
import { DownloadOutlined, UploadOutlined, FileExcelOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../../lib/axios';

const { Text } = Typography;

const BulkUploadModal = ({ open, onClose, onSuccess }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/employees/bulk/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_bulk_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Template downloaded successfully.');
    } catch (err) {
      message.error('Failed to download template.');
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select a CSV file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileList[0]);

    setUploading(true);
    setResult(null);

    try {
      const res = await api.post('/employees/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data;
      setResult(data);
      if (data?.successCount > 0) {
        message.success(`Successfully imported ${data.successCount} employee(s).`);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to upload bulk employee CSV.';
      message.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    { title: 'Row #', dataIndex: 'rowNumber', key: 'rowNumber', width: 80, render: (n) => <Tag color="blue">Row {n}</Tag> },
    { title: 'Field', dataIndex: 'field', key: 'field', width: 140, render: (f) => <Tag color="volcano">{f}</Tag> },
    { title: 'Validation Message', dataIndex: 'message', key: 'message' },
  ];

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          <span>Bulk Import Employees (CSV)</span>
        </Space>
      }
      open={open}
      onCancel={() => {
        setResult(null);
        setFileList([]);
        onClose();
      }}
      width={720}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="upload"
          type="primary"
          icon={<UploadOutlined />}
          loading={uploading}
          disabled={fileList.length === 0}
          onClick={handleUpload}
        >
          {uploading ? 'Processing Import...' : 'Import CSV'}
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message="Bulk Import Guidelines"
          description={
            <div>
              <p style={{ margin: 0 }}>
                1. Download the standard CSV template to view expected column headers.
              </p>
              <p style={{ margin: 0 }}>
                2. Mandatory fields: <strong>FirstName, OfficialEmail</strong>. Email, Phone, PAN, and Aadhaar must be unique.
              </p>
            </div>
          }
          type="info"
          showIcon
          action={
            <Button
              type="primary"
              ghost
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
              size="small"
            >
              Download Template
            </Button>
          }
        />
      </div>

      <Upload.Dragger
        accept=".csv"
        maxCount={1}
        beforeUpload={(file) => {
          setFileList([file]);
          return false;
        }}
        fileList={fileList}
        onRemove={() => setFileList([])}
        style={{ padding: 20, marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined style={{ fontSize: 36, color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">Click or drag CSV file to this area to upload</p>
        <p className="ant-upload-hint">Support for single CSV file import containing employee records</p>
      </Upload.Dragger>

      {result && (
        <div style={{ marginTop: 16 }}>
          <Space size="large" style={{ marginBottom: 12 }}>
            <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: '4px 12px', fontSize: 14 }}>
              Success: {result.successCount}
            </Tag>
            <Tag icon={<ExclamationCircleOutlined />} color="error" style={{ padding: '4px 12px', fontSize: 14 }}>
              Failed: {result.failureCount}
            </Tag>
            <Text type="secondary">Total Processed: {result.totalRows}</Text>
          </Space>

          {result.errors && result.errors.length > 0 && (
            <Table
              dataSource={result.errors}
              columns={columns}
              rowKey={(r, idx) => idx}
              size="small"
              pagination={{ pageSize: 5 }}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default BulkUploadModal;
