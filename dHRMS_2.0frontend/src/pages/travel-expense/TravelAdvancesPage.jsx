import React, { useState } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import TravelAdvancesContent from './TravelAdvancesContent'

export default function TravelAdvancesPage() {
  const [requestModalOpen, setRequestModalOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Travel Advance Management & Ledger"
        breadcrumbs={[
          { label: 'Travel & Expense', path: '/travel-expense/advances' },
          { label: 'Travel Advances' }
        ]}
        subtitle="Manage advance disbursements, track 30-day settlement deadlines, and enforce automatic payroll recovery rules."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRequestModalOpen(true)}>
            Request Advance
          </Button>
        }
      />
      <TravelAdvancesContent
        requestModalOpen={requestModalOpen}
        setRequestModalOpen={setRequestModalOpen}
      />
    </div>
  )
}
