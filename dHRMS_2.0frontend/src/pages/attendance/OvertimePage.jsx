import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title, Text } = Typography;

export default function OvertimePage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Overtime & Comp-Off</Title>
        <Text type="secondary">Manage overtime records and comp-off balances.</Text>
      </div>
      <Card>
        <Empty description="No overtime data available." />
      </Card>
    </div>
  );
}
