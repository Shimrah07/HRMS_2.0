import PageHeader from '../../components/common/PageHeader'
import EncashmentTab from './EncashmentTab'

export default function LeaveEncashmentPage() {
  return (
    <div>
      <PageHeader
        title="Carry Forward & Leave Encashment Engine"
        breadcrumbs={[
          { label: 'Leave', path: '/leave' },
          { label: 'Leave Encashment' }
        ]}
        subtitle="Automated year-end carry-forward lapse calculation, (Basic+DA)/26 payout rate calculation, and Income Tax Sec 10(10AA) exemption simulator."
      />
      <EncashmentTab />
    </div>
  )
}
