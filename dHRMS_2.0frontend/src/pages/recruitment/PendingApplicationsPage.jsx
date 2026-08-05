import PageHeader from '../../components/common/PageHeader'
import PendingQueuePanel from '../../components/recruitment/PendingQueuePanel'

export default function PendingApplicationsPage() {
  return (
    <div style={{ padding: '0px' }}>
      <PageHeader
        title="Pending Candidate Queue"
        subtitle="Review, approve, or reject external submissions from the Careers Portal and referral channels."
      />
      <PendingQueuePanel />
    </div>
  )
}
