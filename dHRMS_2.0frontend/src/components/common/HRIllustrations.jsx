/**
 * HRIllustrations.jsx
 *
 * Uses the actual unDraw SVG files in /src/assets/illustrations/.
 * Each named export is a React component that renders the corresponding illustration.
 * Brand palette: #10113F (navy), #FAA71A (gold), #861630 (burgundy), #FFF4E3 (soft)
 *
 * Usage:
 *   import { LoginIllustration, EmptyEmployees } from './HRIllustrations'
 *   <LoginIllustration size={320} />
 */

// ── Import each SVG as a URL (Vite resolves these to asset paths) ──────────
import secureLoginSvg    from '../../assets/illustrations/undraw_secure-login_m11a (1).svg'
import onlineCommunity   from '../../assets/illustrations/undraw_online-community_3o0l.svg'
import timeManagement    from '../../assets/illustrations/undraw_time-management_4ss6.svg'
import comingHome        from '../../assets/illustrations/undraw_coming-home_jmbc.svg'
import teamGoals         from '../../assets/illustrations/undraw_team-goals_0026.svg'
import certificate       from '../../assets/illustrations/undraw_certificate_cqps.svg'
import mapSvg            from '../../assets/illustrations/undraw_map_cuix.svg'
import hiringSvg         from '../../assets/illustrations/undraw_hiring_8szx.svg'
import gradesSvg         from '../../assets/illustrations/undraw_grades_hqyk.svg'
import onlineStats       from '../../assets/illustrations/undraw_online-stats_d57c.svg'
import noDataSvg         from '../../assets/illustrations/undraw_no-data_ig65.svg'
import movingForward     from '../../assets/illustrations/undraw_moving-forward_md35.svg'
import onTheWay          from '../../assets/illustrations/undraw_on-the-way_zwi3.svg'
import forgotPassword    from '../../assets/illustrations/undraw_forgot-password_nttj.svg'

// ── Shared wrapper ───────────────────────────────────────────────────────────
function IllustrationImg({ src, size, alt = '', style = {} }) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      style={{
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'block',
        userSelect: 'none',
        ...style,
      }}
    />
  )
}

// ── Named Illustration Exports ───────────────────────────────────────────────

/** Login page — secure login illustration */
export function LoginIllustration({ size = 320 }) {
  return <IllustrationImg src={secureLoginSvg} size={size} alt="Secure login" />
}

/** Forgot password page illustration */
export function ForgotPasswordIllustration({ size = 260 }) {
  return <IllustrationImg src={forgotPassword} size={size} alt="Forgot password" />
}

/** Dashboard — analytics/stats illustration */
export function DashboardIllustration({ size = 200 }) {
  return <IllustrationImg src={onlineStats} size={size} alt="Dashboard analytics" />
}

/** Empty Employees — online community */
export function EmptyEmployees({ size = 160 }) {
  return <IllustrationImg src={onlineCommunity} size={size} alt="No employees found" />
}

/** Empty Attendance — time management */
export function EmptyAttendance({ size = 160 }) {
  return <IllustrationImg src={timeManagement} size={size} alt="No attendance records" />
}

/** Empty Leave — coming home / rest */
export function EmptyLeave({ size = 160 }) {
  return <IllustrationImg src={comingHome} size={size} alt="No leave requests" />
}

/** Empty Notifications — moving forward / all clear */
export function EmptyNotifications({ size = 160 }) {
  return <IllustrationImg src={movingForward} size={size} alt="No notifications" />
}

/** Empty Departments — team goals / org */
export function EmptyDepartments({ size = 160 }) {
  return <IllustrationImg src={teamGoals} size={size} alt="No departments configured" />
}

/** Empty Designations — certificate / achievement */
export function EmptyDesignations({ size = 160 }) {
  return <IllustrationImg src={certificate} size={size} alt="No designations configured" />
}

/** Empty Locations — map */
export function EmptyLocations({ size = 160 }) {
  return <IllustrationImg src={mapSvg} size={size} alt="No locations configured" />
}

/** Empty Recruitment — hiring */
export function EmptyRecruitment({ size = 160 }) {
  return <IllustrationImg src={hiringSvg} size={size} alt="No recruitment data" />
}

/** Empty Performance — grades / review */
export function EmptyPerformance({ size = 160 }) {
  return <IllustrationImg src={gradesSvg} size={size} alt="No performance data" />
}

/** Empty Documents — on the way */
export function EmptyDocuments({ size = 160 }) {
  return <IllustrationImg src={onTheWay} size={size} alt="No documents" />
}

/** Generic empty / no data */
export function EmptyDefault({ size = 160 }) {
  return <IllustrationImg src={noDataSvg} size={size} alt="No data" />
}

/** Org chart / team illustration */
export function OrgChartIllustration({ size = 160 }) {
  return <IllustrationImg src={onlineCommunity} size={size} alt="Org chart" />
}
