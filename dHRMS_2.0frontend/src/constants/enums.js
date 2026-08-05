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
  { value: 'Permanent', label: 'Permanent' },
  { value: 'Probationary', label: 'Probationary' },
  { value: 'Contract', label: 'Contract' },
  { value: 'FixedTerm', label: 'Fixed Term' },
  { value: 'Temporary', label: 'Temporary' },
  { value: 'Consultant', label: 'Consultant' },
  { value: 'PartTime', label: 'Part Time' },
  { value: 'Intern', label: 'Intern' },
  { value: 'Apprentice', label: 'Apprentice' },
]

export const WORK_MODE = [
  { value: 'Onsite', label: 'Onsite' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'WorkFromHome', label: 'Work From Home' },
  { value: 'Field', label: 'Field' },
]

export const WEEKLY_OFF_PATTERN = [
  { value: 'Sunday', label: 'Sunday' },
  { value: 'SaturdaySunday', label: 'Saturday + Sunday' },
  { value: 'AlternateSaturday', label: 'Alternate Saturday' },
  { value: 'Rotational', label: 'Rotational' },
]

export const PAYROLL_GROUP = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Weekly', label: 'Weekly' },
  { value: 'DailyWage', label: 'Daily Wage' },
]


export const GENDER = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Transgender' },
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
  { value: 'MedicalFitnessCertificate', label: 'Medical Fitness Certificate' },
  { value: 'PoliceVerification', label: 'Police Verification' },
  { value: 'CategoryCertificate', label: 'Category Certificate' },
  { value: 'NDA', label: 'NDA' },
  { value: 'DrugTestReport', label: 'Drug Test Report' },
  { value: 'Other', label: 'Other' },
]

export const EMPLOYEE_TITLE = [
  { value: 'Mr', label: 'Mr.' },
  { value: 'Mrs', label: 'Mrs.' },
  { value: 'Ms', label: 'Ms.' },
  { value: 'Dr', label: 'Dr.' },
  { value: 'Prof', label: 'Prof.' },
  { value: 'Er', label: 'Er.' },
  { value: 'Adv', label: 'Adv.' },
  { value: 'CA', label: 'CA' },
]

export const EMPLOYEE_CATEGORY = [
  { value: 'General', label: 'General' },
  { value: 'OBC', label: 'OBC' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
  { value: 'EWS', label: 'EWS' },
]

export const PWD_STATUS = [
  { value: 'No', label: 'No' },
  { value: 'Visual', label: 'Visual' },
  { value: 'Hearing', label: 'Hearing' },
  { value: 'Locomotor', label: 'Locomotor' },
  { value: 'Intellectual', label: 'Intellectual' },
  { value: 'Other', label: 'Other' },
]

export const MOTHER_TONGUE = [
  { value: 'Assamese', label: 'Assamese' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Bodo', label: 'Bodo' },
  { value: 'Dogri', label: 'Dogri' },
  { value: 'English', label: 'English' },
  { value: 'Gujarati', label: 'Gujarati' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Kannada', label: 'Kannada' },
  { value: 'Kashmiri', label: 'Kashmiri' },
  { value: 'Konkani', label: 'Konkani' },
  { value: 'Maithili', label: 'Maithili' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Manipuri', label: 'Manipuri' },
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Nepali', label: 'Nepali' },
  { value: 'Odia', label: 'Odia' },
  { value: 'Punjabi', label: 'Punjabi' },
  { value: 'Sanskrit', label: 'Sanskrit' },
  { value: 'Santali', label: 'Santali' },
  { value: 'Sindhi', label: 'Sindhi' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Other', label: 'Other' },
]

export const BANK_VERIFICATION_STATUS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Failed', label: 'Failed' },
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
  Verified: 'success',
  Failed: 'error',
}

export const BANK_LIST = [
  { value: 'State Bank of India', label: 'State Bank of India' },
  { value: 'HDFC Bank', label: 'HDFC Bank' },
  { value: 'ICICI Bank', label: 'ICICI Bank' },
  { value: 'Axis Bank', label: 'Axis Bank' },
  { value: 'Kotak Mahindra Bank', label: 'Kotak Mahindra Bank' },
  { value: 'IndusInd Bank', label: 'IndusInd Bank' },
  { value: 'Yes Bank', label: 'Yes Bank' },
  { value: 'Federal Bank', label: 'Federal Bank' },
  { value: 'IDFC First Bank', label: 'IDFC First Bank' },
  { value: 'Standard Chartered Bank', label: 'Standard Chartered Bank' },
  { value: 'Punjab National Bank', label: 'Punjab National Bank' },
  { value: 'Bank of Baroda', label: 'Bank of Baroda' },
  { value: 'Canara Bank', label: 'Canara Bank' },
  { value: 'Union Bank of India', label: 'Union Bank of India' },
  { value: 'Indian Bank', label: 'Indian Bank' },
  { value: 'Bank of India', label: 'Bank of India' },
  { value: 'Central Bank of India', label: 'Central Bank of India' },
  { value: 'Indian Overseas Bank', label: 'Indian Overseas Bank' },
  { value: 'UCO Bank', label: 'UCO Bank' },
  { value: 'Bank of Maharashtra', label: 'Bank of Maharashtra' },
  { value: 'Punjab & Sind Bank', label: 'Punjab & Sind Bank' },
]
