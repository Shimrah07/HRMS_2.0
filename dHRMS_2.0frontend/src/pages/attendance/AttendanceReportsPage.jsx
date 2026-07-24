import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title, Text } = Typography;

export default function AttendanceReportsPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Reports & Analytics</Title>
        <Text type="secondary">View daily registers, monthly summaries, and absenteeism trends.</Text>
      </div>
      <Card>
        <Empty description="No reports generated." />
      </Card>
    </div>
  );
}
