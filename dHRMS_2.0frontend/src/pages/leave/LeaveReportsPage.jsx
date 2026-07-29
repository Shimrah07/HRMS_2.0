import PageHeader from '../../components/common/PageHeader'
import LeaveReportsTab from './LeaveReportsTab'

export default function LeaveReportsPage() {
  return (
    <div>
      <PageHeader
        title="Leave Analytics & Enterprise Reports Hub"
        breadcrumbs={[
          { label: 'Leave', path: '/leave' },
          { label: 'Reports & Analytics' }
        ]}
        subtitle="Generate and export 15 enterprise leave reports, balance audit statements, statutory compliance logs, and tax statements."
      />
      <LeaveReportsTab />
    </div>
  )
}
