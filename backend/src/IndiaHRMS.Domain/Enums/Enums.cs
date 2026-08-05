namespace IndiaHRMS.Domain.Enums;

public enum EmploymentStatus
{
    Active,
    OnNotice,
    Separated,
    Absconding,
    OnLeave,
    Suspended
}

public enum EmploymentType
{
    FullTime,
    Permanent,
    Probationary,
    Contract,
    FixedTerm,
    Temporary,
    Consultant,
    PartTime,
    Intern,
    Apprentice
}

public enum Gender
{
    Male,
    Female,
    Other,
    PreferNotToSay
}

public enum BloodGroup
{
    APositive,
    ANegative,
    BPositive,
    BNegative,
    OPositive,
    ONegative,
    ABPositive,
    ABNegative
}

public enum MaritalStatus
{
    Single,
    Married,
    Divorced,
    Widowed,
    Separated
}

public enum DocumentType
{
    Aadhar,
    PAN,
    Passport,
    DrivingLicense,
    VoterID,
    OfferLetter,
    AppointmentLetter,
    ConfirmationLetter,
    RelievingLetter,
    ExperienceLetter,
    EducationCertificate,
    BankStatement,
    Photo,
    MedicalFitnessCertificate,
    PoliceVerification,
    CategoryCertificate,
    NDA,
    DrugTestReport,
    Other
}

public enum LeaveStatus
{
    Pending,
    Level1Approved,
    Approved,
    Rejected,
    Cancelled,
    Withdrawn
}

public enum PayrollStatus
{
    Draft,
    InputsLocked,
    Calculated,
    UnderReview,
    Approved,
    Locked,
    Disbursed,
    Closed,
    OnHold,
    Rejected
}

public enum PayrollRunType
{
    Regular,
    Supplementary,
    Arrears,
    FullAndFinal,
    Bonus,
    MidMonthAdvance
}

public enum ProofStatus
{
    Pending,
    Submitted,
    Verified,
    Rejected
}

public enum DisbursementStatus
{
    Pending,
    Success,
    Failed,
    OnHold,
    Reprocessing
}

public enum PayrollDocumentType
{
    Payslip,
    Form16,
    Form16A,
    Form24Q,
    SalaryCertificate,
    CTCBreakupLetter,
    PFECR,
    ESIReturn,
    BankFile,
    GLExport
}

public enum StatutoryDeductionType
{
    PF,
    ESI,
    PT,
    LWF,
    NPS,
    VPF,
    TDS,
    Gratuity
}

public enum LopDivisorPolicy
{
    ActualDays,
    Fixed30
}

public enum SectorType
{
    Manufacturing,
    IT,
    Retail,
    Healthcare,
    Construction,
    Transport,
    Education,
    Government,
    General
}

public enum PaymentMode
{
    NEFT,
    RTGS,
    IMPS,
    Cash,
    Cheque
}

public enum AttendanceStatus
{
    Present,
    Absent,
    Leave,
    Holiday,
    WeeklyOff,
    WFH,
    HalfDay,
    LatePresent,
    OnDuty,
    MissingPunch
}

public enum AttendanceSource
{
    Biometric,
    Mobile,
    Manual,
    WebApp,
    SystemGenerated
}

public enum PunchType
{
    In,
    Out
}

public enum CompOffStatus
{
    Available,
    Utilized,
    Expired
}

public enum SeparationType
{
    Resignation,
    Termination,
    Retirement,
    Absconding,
    VRS,
    EndOfContract,
    Death
}

public enum AppraisalCycleType
{
    Annual,
    HalfYearly,
    Quarterly
}

public enum AppraisalCycleStatus
{
    Draft,
    GoalSetting,
    InProgress,
    Review,
    Calibration,
    Completed
}

public enum ReviewType
{
    Self,
    Manager,
    Peer,
    Subordinate,
    HR,
    ThreeSixty
}

public enum PIPStatus
{
    Active,
    Completed,
    Extended,
    Closed,
    Terminated
}

public enum TrainingMode
{
    Online,
    Offline,
    Hybrid
}

public enum HolidayType
{
    Mandatory,
    National,
    State,
    Optional,
    Restricted,
    Company
}

public enum ComponentType
{
    Earning,
    Deduction,
    Statutory,
    EmployerContribution,
    Reimbursement
}

public enum CalculationType
{
    Fixed,
    Percentage,
    Formula
}

public enum TaxRegime
{
    New,
    Old
}

public enum NotificationType
{
    LeaveApprovalRequired,
    LeaveStatusUpdated,
    PayrollRunInitiated,
    PayrollApproved,
    SalarySlipReady,
    AttendanceRegularization,
    InterviewScheduled,
    OfferAccepted,
    NewJoinerToday,
    ResignationSubmitted,
    ProbationEndingSoon,
    TDSDepositReminder,
    General,
    System
}

public enum ClearanceStatus
{
    Pending,
    Cleared,
    NA
}

public enum RequisitionStatus
{
    Draft,
    PendingHOD,
    PendingHR,
    PendingFinance,
    PendingCOO,
    Approved,
    Rejected,
    ReturnedForCorrection,
    Cancelled,
    InternalReview,
    PendingApproval,
    Open,
    OnHold,
    Closed,
    Fulfilled
}

public enum ApplicationStage
{
    Applied,
    Screening,
    Shortlisted,
    InterviewL1,
    InterviewL2,
    ManagerReview,
    HRInterview,
    Offer,
    BackgroundCheck,
    Onboarding,
    Joined,
    Rejected,
    Withdrawn
}

public enum OfferStatus
{
    Draft,
    Sent,
    Accepted,
    Rejected,
    Withdrawn,
    Expired
}

public enum NominationStatus
{
    Nominated,
    Confirmed,
    Attended,
    Completed,
    Cancelled,
    NoShow
}

public enum AccountType
{
    Savings,
    Current,
    Salary
}

public enum Relationship
{
    Father,
    Mother,
    Spouse,
    Child,
    Sibling,
    Grandparent,
    Other
}

public enum WorkMode
{
    Onsite,
    Hybrid,
    WorkFromHome,
    Field
}

public enum WeeklyOffPattern
{
    Sunday,
    SaturdaySunday,
    AlternateSaturday,
    Rotational
}

public enum PayrollGroup
{
    Monthly,
    Weekly,
    DailyWage
}

public enum EmployeeTitle
{
    Mr,
    Mrs,
    Ms,
    Dr,
    Prof,
    Er,
    Adv,
    CA
}

public enum EmployeeCategory
{
    General,
    OBC,
    SC,
    ST,
    EWS
}

public enum PwdStatus
{
    No,
    Visual,
    Hearing,
    Locomotor,
    Intellectual,
    Other
}

public enum MotherTongue
{
    Assamese,
    Bengali,
    Bodo,
    Dogri,
    Gujarati,
    Hindi,
    Kannada,
    Kashmiri,
    Konkani,
    Maithili,
    Malayalam,
    Manipuri,
    Marathi,
    Nepali,
    Odia,
    Punjabi,
    Sanskrit,
    Santali,
    Sindhi,
    Tamil,
    Telugu,
    Urdu,
    Other,
    English
}

public enum BankVerificationStatus
{
    Pending,
    Verified,
    Failed
}

public enum JobPostingStatus
{
    Draft,
    Published,
    Paused,
    Closed,
    Archived
}

public enum CandidateStatus
{
    Active,
    InProcess,
    Hired,
    Rejected,
    Withdrawn,
    Blacklisted,
    Archived
}

public enum CandidateSource
{
    CareerPortal,
    CareersPortal,
    EmployeeReferral,
    LinkedIn,
    Naukri,
    Indeed,
    Campus,
    Consultancy,
    WalkIn,
    InternalTransfer,
    CSVImport,
    ManualHREntry,
    ManualHR,
    ResumeParser,
    Other
}

public enum ExitType
{
    Voluntary,
    Retirement,
    ContractEnd,
    Absconding,
    Involuntary
}

public enum ExitStatus
{
    ResignationSubmitted,
    ManagerAcknowledged,
    NoticePeriod,
    ClearanceInProgress,
    FFSProcessing,
    DocumentsPending,
    Closed,
    Withdrawn
}

public enum CounterOfferResponse
{
    Pending,
    Accepted,
    Declined
}

public enum ClearanceDepartment
{
    IT,
    Asset,
    Finance,
    Admin,
    HR,
    Manager,
    Security
}

public enum DeptClearanceStatus
{
    Pending,
    Cleared,
    DuesPending,
    NA
}

public enum ExitDocumentType
{
    ResignationAcceptance,
    RelievingLetter,
    ExperienceLetter,
    FFSStatement,
    NOC
}

public enum ExitConductRemark
{
    Satisfactory,
    Good,
    Excellent,
    Poor,
    NotApplicable
}

public enum FFSStatus
{
    Calculated,
    Approved,
    Disbursed,
    Held
}
