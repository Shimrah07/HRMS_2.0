// Frontend mirror of IndiaHRMS.Domain.Enums

export const EMPLOYMENT_STATUS = [
  { value: 'Active', label: 'Active' },
  { value: 'OnNotice', label: 'On Notice' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Absconding', label: 'Absconding' },
  { value: 'OnLeave', label: 'On Leave' },
  { value: 'Suspended', label: 'Suspended' },
]

export const EMPLOYMENT_TYPE = [
  { value: 'FullTime', label: 'Full Time' },
  { value: 'PartTime', label: 'Part Time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Intern', label: 'Intern' },
  { value: 'Consultant', label: 'Consultant' },
]

export const GENDER = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'PreferNotToSay', label: 'Prefer Not To Say' },
]

export const BLOOD_GROUP = [
  { value: 'APositive', label: 'A+' },
  { value: 'ANegative', label: 'A-' },
  { value: 'BPositive', label: 'B+' },
  { value: 'BNegative', label: 'B-' },
  { value: 'OPositive', label: 'O+' },
  { value: 'ONegative', label: 'O-' },
  { value: 'ABPositive', label: 'AB+' },
  { value: 'ABNegative', label: 'AB-' },
]

export const MARITAL_STATUS = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Separated', label: 'Separated' },
]

export const DOCUMENT_TYPE = [
  { value: 'Aadhar', label: 'Aadhar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'Passport', label: 'Passport' },
  { value: 'DrivingLicense', label: 'Driving License' },
  { value: 'VoterID', label: 'Voter ID' },
  { value: 'OfferLetter', label: 'Offer Letter' },
  { value: 'AppointmentLetter', label: 'Appointment Letter' },
  { value: 'ConfirmationLetter', label: 'Confirmation Letter' },
  { value: 'RelievingLetter', label: 'Relieving Letter' },
  { value: 'ExperienceLetter', label: 'Experience Letter' },
  { value: 'EducationCertificate', label: 'Education Certificate' },
  { value: 'BankStatement', label: 'Bank Statement' },
  { value: 'Photo', label: 'Photo' },
  { value: 'Other', label: 'Other' },
]

export const ACCOUNT_TYPE = [
  { value: 'Savings', label: 'Savings' },
  { value: 'Current', label: 'Current' },
  { value: 'Salary', label: 'Salary' },
]

export const RELATIONSHIP = [
  { value: 'Father', label: 'Father' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Child', label: 'Child' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Grandparent', label: 'Grandparent' },
  { value: 'Other', label: 'Other' },
]

export const LEAVE_STATUS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Withdrawn', label: 'Withdrawn' },
]

export const PAYROLL_STATUS = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Processing', label: 'Processing' },
  { value: 'PendingApproval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Disbursed', label: 'Disbursed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export const ATTENDANCE_STATUS = [
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Holiday', label: 'Holiday' },
  { value: 'WeeklyOff', label: 'Weekly Off' },
  { value: 'WFH', label: 'Work From Home' },
  { value: 'HalfDay', label: 'Half Day' },
  { value: 'LatePresent', label: 'Late Present' },
  { value: 'OnDuty', label: 'On Duty' },
]

export const COMPONENT_TYPE = [
  { value: 'Earning', label: 'Earning' },
  { value: 'Deduction', label: 'Deduction' },
  { value: 'Statutory', label: 'Statutory' },
  { value: 'EmployerContribution', label: 'Employer Contribution' },
  { value: 'Reimbursement', label: 'Reimbursement' },
]

// Status color maps for UI badges
export const STATUS_COLORS = {
  Active: 'success',
  OnNotice: 'warning',
  Separated: 'default',
  Absconding: 'error',
  OnLeave: 'processing',
  Suspended: 'error',
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  Cancelled: 'default',
  Withdrawn: 'default',
  Draft: 'default',
  Processing: 'processing',
  PendingApproval: 'warning',
  Disbursed: 'success',
  Present: 'success',
  Absent: 'error',
  Leave: 'warning',
  WFH: 'processing',
}
