import PageHeader from '../../components/common/PageHeader'
import LeaveApplicationsTab from './LeaveApplicationsTab'

export default function LeaveApplicationsPage() {
  return (
    <div>
      <PageHeader
        title="Leave Management"
        breadcrumbs={[
          { label: 'Leave', path: '/leave' },
          { label: 'My Leave & Applications' }
        ]}
        subtitle="Apply for leave, track application status, and process team approval requests."
      />
      <LeaveApplicationsTab />
    </div>
  )
}
