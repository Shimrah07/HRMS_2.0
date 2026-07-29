import PageHeader from '../../components/common/PageHeader'
import LeavePolicyTab from './LeavePolicyTab'

export default function LeavePoliciesPage() {
  return (
    <div>
      <PageHeader
        title="Leave Policy & Type Master Configuration"
        breadcrumbs={[
          { label: 'Leave', path: '/leave' },
          { label: 'Leave Policy' }
        ]}
        subtitle="Manage leave categories (PL, CL, SL, Comp-Off), accrual rules, notice periods, and 2-level approval workflows."
      />
      <LeavePolicyTab />
    </div>
  )
}
