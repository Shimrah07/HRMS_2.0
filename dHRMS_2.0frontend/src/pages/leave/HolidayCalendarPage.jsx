import PageHeader from '../../components/common/PageHeader'
import HolidayCalendarTab from './HolidayCalendarTab'

export default function HolidayCalendarPage() {
  return (
    <div>
      <PageHeader
        title="Location-Aware Holiday Calendar Management"
        breadcrumbs={[
          { label: 'Leave', path: '/leave' },
          { label: 'Holiday Calendar' }
        ]}
        subtitle="Manage National, State, Mandatory, and Restricted/Optional (RH) holidays with Outlook iCal calendar feed integration."
      />
      <HolidayCalendarTab />
    </div>
  )
}
