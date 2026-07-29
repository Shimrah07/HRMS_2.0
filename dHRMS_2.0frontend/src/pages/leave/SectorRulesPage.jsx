import PageHeader from '../../components/common/PageHeader'
import SectorConfigTab from './SectorConfigTab'

export default function SectorRulesPage() {
  return (
    <div>
      <PageHeader
        title="Sector-Specific Leave Rules Matrix"
        breadcrumbs={[
          { label: 'Leave', path: '/leave' },
          { label: 'Sector Rules' }
        ]}
        subtitle="Factories Act 1948 Sec 79 compliance (1/20 accrual & 240-day attendance threshold), IT flexi rules, and Retail festival blackout window management."
      />
      <SectorConfigTab />
    </div>
  )
}
