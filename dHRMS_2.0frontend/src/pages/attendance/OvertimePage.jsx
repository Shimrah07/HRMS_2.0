import React, { useState } from 'react';
import { Card, Typography, Table, DatePicker, Row, Col, Statistic, Tag, Space, Button, message } from 'antd';
import { ClockCircleOutlined, UserOutlined, FieldTimeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import api from '../../lib/axios';
import PageHeader from '../../components/common/PageHeader';

const { Title, Text } = Typography;

export default function OvertimePage() {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  const month = selectedMonth.month() + 1;
  const year = selectedMonth.year();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['overtime', month, year],
    queryFn: async () => {
      const res = await api.get(`/attendance/overtime?month=${month}&year=${year}`);
      return res.data?.data || [];
    },
  });

  const records = data || [];

  const totalOtHours = records.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);
  const totalEmployees = new Set(records.map((r) => r.employeeId)).size;
  const avgOt = totalEmployees > 0 ? (totalOtHours / totalEmployees).toFixed(1) : '0';

  const columns = [
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 120,
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Employee Name',
      dataIndex: 'employeeName',
      key: 'employeeName',
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: 'Date',
      dataIndex: 'attendanceDate',
      key: 'attendanceDate',
      width: 120,
      render: (d) => dayjs(d).format('DD MMM YYYY'),
    },
    {
      title: 'Gross Hrs',
      dataIndex: 'grossHours',
      key: 'grossHours',
      width: 100,
      render: (h) => `${Number(h || 0).toFixed(2)}h`,
    },
    {
      title: 'Break Hrs',
      dataIndex: 'breakHours',
      key: 'breakHours',
      width: 100,
      render: (h) => `${Number(h || 0).toFixed(2)}h`,
    },
    {
      title: 'Net Worked Hrs',
      dataIndex: 'netWorkingHours',
      key: 'netWorkingHours',
      width: 130,
      render: (h) => <Tag color="cyan">{Number(h || 0).toFixed(2)}h</Tag>,
    },
    {
      title: 'Shift Std Hrs',
      dataIndex: 'shiftStandardHours',
      key: 'shiftStandardHours',
      width: 120,
      render: (h) => `${Number(h || 0).toFixed(2)}h`,
    },
    {
      title: 'Computed OT Hrs',
      dataIndex: 'overtimeHours',
      key: 'overtimeHours',
      width: 140,
      render: (ot) => (
        <Tag color={ot > 0 ? 'volcano' : 'default'} style={{ fontWeight: 'bold' }}>
          {Number(ot || 0).toFixed(2)} hrs
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <PageHeader
        title="Overtime & Comp-Off Tracking"
        subtitle="Calculates overtime hours net of standard shift duration and break time deductions."
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Overtime' }]}
        actions={
          <Space>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(val) => val && setSelectedMonth(val)}
              allowClear={false}
            />
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Refresh
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Overtime Hours"
              value={totalOtHours.toFixed(1)}
              suffix="hrs"
              prefix={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Employees Logging OT"
              value={totalEmployees}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Avg OT / Employee"
              value={avgOt}
              suffix="hrs"
              prefix={<FieldTimeOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={records}
          columns={columns}
          rowKey={(r) => r.attendanceId}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
