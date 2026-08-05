import React from 'react'
import PageHeader from '../../components/common/PageHeader'
import TravelReportsContent from './TravelReportsContent'

export default function TravelReportsPage() {
  return (
    <div>
      <PageHeader
        title="14 Enterprise Travel & Expense Reports Hub"
        breadcrumbs={[
          { label: 'Travel & Expense', path: '/travel-expense/reports' },
          { label: 'Analytics & Reports' }
        ]}
        subtitle="Executive KPI metrics, destination spend breakdown, turn-around-time analytics, and 14 exportable enterprise compliance reports."
      />
      <TravelReportsContent />
    </div>
  )
}
