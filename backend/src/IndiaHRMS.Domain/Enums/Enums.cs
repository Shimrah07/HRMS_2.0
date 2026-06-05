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
    PartTime,
    Contract,
    Intern,
    Consultant
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
    Other
}

public enum LeaveStatus
{
    Pending,
    Approved,
    Rejected,
    Cancelled,
    Withdrawn
}

public enum PayrollStatus
{
    Draft,
    Processing,
    PendingApproval,
    Approved,
    Disbursed,
    Cancelled
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
    OnDuty
}

public enum AttendanceSource
{
    Biometric,
    Mobile,
    Manual,
    WebApp,
    SystemGenerated
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
    National,
    State,
    Optional,
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
    PendingApproval,
    Approved,
    Rejected,
    Open,
    OnHold,
    Closed,
    Fulfilled
}

public enum ApplicationStage
{
    Applied,
    Shortlisted,
    InterviewL1,
    InterviewL2,
    HRInterview,
    Offer,
    BackgroundCheck,
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
