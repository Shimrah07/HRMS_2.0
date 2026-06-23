import ComingSoonPage from '../_shared/ComingSoonPage'
import { BookOutlined } from '@ant-design/icons'
import { EmptyRecruitment } from '../../components/common/HRIllustrations'

export default function RecruitmentPage() {
  return (
    <ComingSoonPage
      title="Recruitment Management"
      description="Publish job openings, track candidates through pipelines, schedule interviews, and manage offer letters."
      icon={<BookOutlined />}
      illustration={<EmptyRecruitment size={220} />}
      features={[
        'Job vacancy requisition and publishing',
        'Applicant Tracking System (ATS) pipeline',
        'Interview scheduling with calendar integrations',
        'Candidate feedback and evaluation forms',
        'Offer letter creation and approval workflow',
        'Pre-onboarding verification tracking',
      ]}
      color="#8B5CF6"
    />
  )
}

