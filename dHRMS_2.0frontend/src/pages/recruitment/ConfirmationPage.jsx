import React, { useEffect, useState } from 'react'
import { Card, Table, Tag, Input, Space, Badge } from 'antd'
import { SearchOutlined, CheckCircleFilled } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import { employeeService } from '../../services/employeeService'
import EmptyState from '../../components/common/EmptyState'

export default function ConfirmationPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchConfirmedEmployees = async () => {
    setLoading(true)
    try {
      const res = await employeeService.getEmployees({ type: 'Permanent', page: 1, pageSize: 200 })
      if (res?.success && Array.isArray(res.data)) {
        const confirmed = res.data.filter(e => e.employmentType === 'Permanent' && e.isActive)
        setEmployees(confirmed)
      } else {
        // Not an error — empty state is valid
        setEmployees([])
      }
    } catch (e) {
      // Silently fail — empty state shown instead of toast error
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfirmedEmployees()
  }, [])

  const columns = [
    {
      title: 'Employee Name',
      key: 'name',
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>
          {record.firstName} {record.lastName}
        </span>
      )
    },
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode'
    },
    {
      title: 'Official Email',
      dataIndex: 'officialEmail',
      key: 'officialEmail',
      render: (v) => v || '-'
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'department',
      render: (v) => v || '-'
    },
    {
      title: 'Joining Date',
      dataIndex: 'joiningDate',
      key: 'joiningDate',
      render: (text) => text ? new Date(text).toLocaleDateString('en-IN') : '-'
    },
    {
      title: 'Confirmation Date',
      dataIndex: 'confirmationDate',
      key: 'confirmationDate',
      render: (text) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          {text ? new Date(text).toLocaleDateString('en-IN') : 'Immediate'}
        </span>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <Tag color="success" icon={<CheckCircleFilled />} style={{ borderRadius: 4 }}>
          CONFIRMED
        </Tag>
      )
    }
  ]

  const filteredData = employees.filter(e =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (e.employeeCode?.toLowerCase()?.includes(search.toLowerCase()))
  )

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Welcome & Confirmation Center"
        subtitle="View the list of permanent members confirmed from the probation cycle."
      />

      <Card
        style={{
          background: 'var(--color-card-bg)',
          border: 'var(--border-glass)',
          borderRadius: 12
        }}
        bodyStyle={{ padding: 18 }}
      >
        <Space size="middle" style={{ marginBottom: 18, width: '100%', justifyContent: 'space-between' }}>
          <Input
            placeholder="Search employee name or code..."
            prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
          />
          <Badge count={filteredData.length} overflowCount={999} style={{ backgroundColor: '#52c41a' }}>
            <span style={{ color: 'var(--color-text-secondary)', marginRight: 10 }}>Total Confirmed</span>
          </Badge>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="employeeId"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <EmptyState title="No confirmed employees" subtitle="Employees will appear here after completing probation and being confirmed." /> }}
        />
      </Card>
    </div>
  )
}
