import React, { useState } from 'react'
import { Button } from 'antd'
import { AlertOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import TravelPoliciesContent from './TravelPoliciesContent'

export default function TravelPoliciesPage() {
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Travel Policy & Grade Entitlements"
        breadcrumbs={[
          { label: 'Travel & Expense', path: '/travel-expense/policies' },
          { label: 'Policy & Entitlements' }
        ]}
        subtitle="Manage grade-wise travel matrix (Bands A-E), city tier daily allowance slabs, and policy exception requests."
        actions={
          <Button type="primary" danger icon={<AlertOutlined />} onClick={() => setExceptionModalOpen(true)}>
            Request Policy Exception
          </Button>
        }
      />
      <TravelPoliciesContent
        exceptionModalOpen={exceptionModalOpen}
        setExceptionModalOpen={setExceptionModalOpen}
      />
    </div>
  )
}
