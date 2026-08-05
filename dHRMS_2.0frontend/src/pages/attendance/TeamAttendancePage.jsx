import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title, Text } = Typography;

export default function TeamAttendancePage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Team Attendance</Title>
        <Text type="secondary">View and manage attendance for your team members.</Text>
      </div>
      <Card>
        <Empty description="No team members found or data is empty." />
      </Card>
    </div>
  );
}
