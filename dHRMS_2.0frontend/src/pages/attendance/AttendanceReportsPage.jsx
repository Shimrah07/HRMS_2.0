import React, { useState, useEffect } from 'react'
import { Card, Typography, Table, DatePicker, Button, Space, Tag, Spin, message, Row, Col, Statistic } from 'antd'
import { DownloadOutlined, ReloadOutlined, FileTextOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import apiClient from '../../lib/axios'
import { API } from '../../constants/api'

const { Title, Text } = Typography

export default function AttendanceReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(dayjs())
  const [loading, setLoading] = useState(false)
  const [musterData, setMusterData] = useState(null)

  const fetchMusterRoll = async (monthMoment) => {
    setLoading(true)
    try {
      const month = monthMoment.month() + 1
      const year = monthMoment.year()
      const { data } = await apiClient.get(API.ATTENDANCE.MUSTER, { params: { month, year } })
      if (data?.success) {
        setMusterData(data.data)
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to fetch statutory muster roll data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMusterRoll(selectedMonth)
  }, [selectedMonth])

  // Build dynamic day columns for 1..daysInMonth
  const daysInMonth = musterData?.daysInMonth || selectedMonth.daysInMonth()
  const dayColumns = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1
    return {
      title: `${dayNum}`,
      dataIndex: ['dailyStatus', `day_${dayNum}`],
      key: `day_${dayNum}`,
      width: 42,
      align: 'center',
      render: (status) => {
        if (!status) return '-'
        const colorMap = {
          P: 'green',
          L: 'cyan',
          HD: 'orange',
          A: 'red',
          LV: 'purple',
          WO: 'default',
          H: 'gold'
        }
        return <Tag color={colorMap[status] || 'default'} style={{ margin: 0, padding: '0 4px', fontSize: 10, fontWeight: 700 }}>{status}</Tag>
      }
    }
  })

  const baseColumns = [
    { title: 'Emp Code', dataIndex: 'employeeCode', key: 'employeeCode', fixed: 'left', width: 100 },
    { title: 'Employee Name', dataIndex: 'employeeName', key: 'employeeName', fixed: 'left', width: 160 },
    { title: 'Dept', dataIndex: 'departmentName', key: 'departmentName', width: 120 },
    { title: 'Designation', dataIndex: 'designationName', key: 'designationName', width: 140 },
    ...dayColumns,
    { title: 'P', dataIndex: 'totalPresent', key: 'totalPresent', fixed: 'right', width: 50, render: (v) => <strong>{v}</strong> },
    { title: 'A', dataIndex: 'totalAbsent', key: 'totalAbsent', fixed: 'right', width: 50, render: (v) => <span style={{ color: '#ff4d4f', fontWeight: 700 }}>{v}</span> },
    { title: 'LV', dataIndex: 'totalLeave', key: 'totalLeave', fixed: 'right', width: 50, render: (v) => <span style={{ color: '#722ed1' }}>{v}</span> }
  ]

  const handleExportCSV = () => {
    if (!musterData?.records?.length) {
      message.warning('No records available to export.')
      return
    }
    const headers = ['Emp Code', 'Employee Name', 'Department', 'Designation', ...Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`), 'Total Present', 'Total Absent', 'Total Leave']
    const rows = musterData.records.map(r => {
      const days = Array.from({ length: daysInMonth }, (_, i) => r.dailyStatus[`day_${i + 1}`] || '-')
      return [r.employeeCode, `"${r.employeeName}"`, `"${r.departmentName}"`, `"${r.designationName}"`, ...days, r.totalPresent, r.totalAbsent, r.totalLeave]
    })
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Statutory_Muster_Roll_${selectedMonth.format('MMM_YYYY')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('Muster roll exported successfully.')
  }

  const totalEmployees = musterData?.records?.length || 0
  const avgPresent = totalEmployees > 0 ? Math.round((musterData.records.reduce((acc, r) => acc + r.totalPresent, 0) / totalEmployees) * 10) / 10 : 0

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Statutory Muster Roll & Attendance Registers</Title>
          <Text type="secondary">Form T / Section 62 monthly attendance register matrix with statutory present/absent counts.</Text>
        </div>
        <Space>
          <DatePicker picker="month" value={selectedMonth} onChange={(val) => val && setSelectedMonth(val)} allowClear={false} />
          <Button icon={<ReloadOutlined />} onClick={() => fetchMusterRoll(selectedMonth)}>Refresh</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCSV}>Export CSV</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic title="Total Active Employees" value={totalEmployees} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="Avg Present Days / Employee" value={avgPresent} prefix={<CheckCircleOutlined />} precision={1} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="Target Register Month" value={selectedMonth.format('MMMM YYYY')} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card title="Monthly Attendance Register (Form T Matrix)" bodyStyle={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><Spin size="large" /></div>
        ) : (
          <Table
            dataSource={musterData?.records || []}
            columns={baseColumns}
            rowKey="employeeId"
            scroll={{ x: 1600, y: 550 }}
            pagination={{ pageSize: 20 }}
            size="small"
            bordered
          />
        )}
      </Card>
    </div>
  )
}
