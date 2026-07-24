import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title, Text } = Typography;

export default function AttendanceFreezePage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Attendance Freeze</Title>
        <Text type="secondary">Freeze attendance periods before payroll processing.</Text>
      </div>
      <Card>
        <Empty description="No active freeze periods." />
      </Card>
    </div>
  );
}
