import React from 'react'
import PageHeader from '../../components/common/PageHeader'
import TravelSectorRulesContent from './TravelSectorRulesContent'

export default function TravelSectorRulesPage() {
  return (
    <div>
      <PageHeader
        title="Industry T&E Policy Rulesets & Sector Configurations"
        breadcrumbs={[
          { label: 'Travel & Expense', path: '/travel-expense/sector-rules' },
          { label: 'Sector Rules' }
        ]}
        subtitle="Switch active industry policy templates (IT, Sales, Consulting Billable Tagging, Govt 7th CPC TA/DA Schedule) to enforce industry-specific rules."
      />
      <TravelSectorRulesContent />
    </div>
  )
}
