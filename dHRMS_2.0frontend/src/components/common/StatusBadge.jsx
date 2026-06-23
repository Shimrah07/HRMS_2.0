import { Tag } from 'antd'
import { STATUS_COLORS } from '../../constants/enums'

const STATUS_LABELS = {
  Active: 'Active',
  OnNotice: 'On Notice',
  Separated: 'Separated',
  Absconding: 'Absconding',
  OnLeave: 'On Leave',
  Suspended: 'Suspended',
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Cancelled: 'Cancelled',
  Withdrawn: 'Withdrawn',
  Draft: 'Draft',
  Processing: 'Processing',
  PendingApproval: 'Pending Approval',
  Disbursed: 'Disbursed',
  Present: 'Present',
  Absent: 'Absent',
  Leave: 'On Leave',
  WFH: 'WFH',
  FullTime: 'Full Time',
  PartTime: 'Part Time',
  Contract: 'Contract',
  Intern: 'Intern',
  Consultant: 'Consultant',
}

export default function StatusBadge({ status, size = 'default' }) {
  const color = STATUS_COLORS[status] || 'default'
  const label = STATUS_LABELS[status] || status

  return (
    <Tag color={color} style={{ borderRadius: 6, fontWeight: 500, fontSize: size === 'small' ? 11 : 12 }}>
      {label}
    </Tag>
  )
}
