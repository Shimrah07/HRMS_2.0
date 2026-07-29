import PageHeader from '../../components/common/PageHeader'
import StatutoryLeaveTab from './StatutoryLeaveTab'

export default function StatutoryLeavePage() {
  return (
    <div>
      <PageHeader
        title="Statutory Leave Foundation (Maternity & Paternity Benefits)"
        breadcrumbs={[
          { label: 'Leave', path: '/leave' },
          { label: 'Statutory Leave' }
        ]}
        subtitle="Maternity Benefit Act 1961 (2017 Amendment) compliance engine, child order entitlement rules, and Paternity Benefit tracking."
      />
      <StatutoryLeaveTab />
    </div>
  )
}
