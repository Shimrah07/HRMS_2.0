import React, { useState } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import TravelRequestsContent from './TravelRequestsContent'

export default function TravelRequestsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Travel Requests & Travel Desk Booking Hub"
        breadcrumbs={[
          { label: 'Travel & Expense', path: '/travel-expense/travel-requests' },
          { label: 'Travel Requests' }
        ]}
        subtitle="Raise business travel requests, manage domestic and international travel bookings, and attach e-tickets."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            Raise Travel Request
          </Button>
        }
      />
      <TravelRequestsContent
        createModalOpen={createModalOpen}
        setCreateModalOpen={setCreateModalOpen}
      />
    </div>
  )
}
