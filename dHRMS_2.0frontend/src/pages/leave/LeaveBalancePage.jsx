import PageHeader from '../../components/common/PageHeader'
import LeaveBalanceLedgerTab from './LeaveBalanceLedgerTab'

export default function LeaveBalancePage() {
  return (
    <div>
      <PageHeader
        title="Leave Balance & Accrual Ledger"
        breadcrumbs={[
          { label: 'Leave', path: '/leave' },
          { label: 'Leave Balance & Ledger' }
        ]}
        subtitle="Real-time leave balance gauges, transaction audit ledger, manual adjustments, and monthly pro-rata accrual engine."
      />
      <LeaveBalanceLedgerTab />
    </div>
  )
}
