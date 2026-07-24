import { useQuery } from '@tanstack/react-query'
import { Row, Col, Card, Skeleton, Tag, Progress, Button, Space, Statistic } from 'antd'
import {
  TeamOutlined,
  UserAddOutlined,
  AlertOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  CheckCircleFilled,
  WarningOutlined,
} from '@ant-design/icons'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { dashboardService } from '../../services/dashboardService'
import { employeeService } from '../../services/employeeService'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import useUIStore from '../../store/uiStore'
import { DashboardIllustration } from '../../components/common/HRIllustrations'


// Brand-aligned attendance palette
const ATTENDANCE_COLORS = {
  Present:   '#10113F',
  Absent:    '#E94043',
  OnLeave:   '#FAA71A',
  WFH:       '#861630',
  Holiday:   '#4D1B3B',
  NotMarked: 'rgba(16,17,63,0.18)',
}

function HRDashboard() {
  const { isDarkMode } = useUIStore()
  const navigate = useNavigate()
  const { data: hrData, isLoading: hrLoading } = useQuery({
    queryKey: ['dashboard', 'hr'],
    queryFn: dashboardService.getHRDashboard,
    select: (res) => res?.data,
  })

  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ['dashboard', 'recruitment'],
    queryFn: dashboardService.getRecruitmentDashboard,
    select: (res) => res?.data,
  })

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['dashboard', 'attendance-today'],
    queryFn: dashboardService.getAttendanceToday,
    select: (res) => res?.data,
  })

  const attendancePie = todayData
    ? [
        { name: 'Present', value: todayData.present },
        { name: 'Absent', value: todayData.absent },
        { name: 'On Leave', value: todayData.onLeave },
        { name: 'WFH', value: todayData.wfh },
        { name: 'Holiday', value: todayData.holiday },
        { name: 'Not Marked', value: todayData.notMarked },
      ].filter((d) => d.value > 0)
    : []

  const stats = [
    {
      title: 'Active Employees',
      value: hrData?.totalActiveEmployees,
      icon: <TeamOutlined />,
      color: '#10113F',
      delay: 0,
    },
    {
      title: 'New Joiners This Month',
      value: hrData?.newJoinersThisMonth,
      icon: <UserAddOutlined />,
      color: '#FAA71A',
      delay: 0.05,
    },
    {
      title: 'On Notice',
      value: hrData?.employeesOnNotice,
      icon: <AlertOutlined />,
      color: '#4D1B3B',
      delay: 0.1,
    },
    {
      title: 'Open Positions',
      value: hrData?.openPositions,
      icon: <RiseOutlined />,
      color: '#861630',
      delay: 0.15,
    },
    {
      title: 'Attrition Rate',
      value: hrData?.attritionRatePercent !== undefined ? `${hrData.attritionRatePercent}%` : undefined,
      icon: <AlertOutlined />,
      color: '#E94043',
      delay: 0.2,
    },
    {
      title: 'Pending Leave Approvals',
      value: hrData?.pendingLeaveApprovals,
      icon: <ClockCircleOutlined />,
      color: '#FAA71A',
      delay: 0.25,
    },
  ]

  const chartTooltipStyle = {
    borderRadius: 12,
    border: isDarkMode ? '1px solid rgba(160, 90, 255, 0.25)' : '1px solid rgba(16,17,63,0.08)',
    fontSize: 13,
    background: isDarkMode ? 'rgba(14, 7, 38, 0.97)' : 'rgba(255,255,255,0.95)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    color: isDarkMode ? '#F0F4FF' : '#10113F',
  }

  return (
    <div>
      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap' }}>
        {stats.map((s) => (
          <Col xs={24} sm={12} lg={8} xl={4} key={s.title} style={{ display: 'flex', flexDirection: 'column' }}>
            <StatCard {...s} loading={hrLoading} />
          </Col>
        ))}
      </Row>

      {/* Recruitment Hub Metrics Section */}
      <div style={{ marginBottom: 24 }}>
        <div className="hrms-section-label" style={{ marginBottom: 12 }}>
          Recruitment & ATS KPIs
        </div>
        <Row gutter={[16, 16]} style={{ display: 'flex', flexWrap: 'wrap' }}>
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
            <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
              <Statistic 
                title="Average Time to Hire" 
                value={recData?.averageTimeToHire != null ? `${recData.averageTimeToHire} Days` : 'N/A'} 
                prefix={<ClockCircleOutlined style={{ color: '#FAA71A' }} />} 
                loading={recLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
            <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
              <Statistic 
                title="Open Requisition Positions" 
                value={recData?.openPositions ?? 0} 
                prefix={<TeamOutlined style={{ color: '#3B82F6' }} />} 
                loading={recLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
            <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
              <Statistic 
                title="Candidate Conversion Rate" 
                value={recData?.candidateConversionRate != null ? `${recData.candidateConversionRate}%` : 'N/A'} 
                prefix={<RiseOutlined style={{ color: '#22C55E' }} />} 
                loading={recLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
            <Card bordered={false} style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}>
              <Statistic 
                title="Offer Acceptance Rate" 
                value={recData?.offerAcceptanceRate != null ? `${recData.offerAcceptanceRate}%` : 'N/A'} 
                prefix={<CheckCircleOutlined style={{ color: '#A855F7' }} />} 
                loading={recLoading}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Applications Stage Breakdown */}
      <div style={{ marginBottom: 24 }}>
        <div className="hrms-section-label" style={{ marginBottom: 12 }}>
          Applications Stage Breakdown
        </div>
        <Row gutter={[16, 16]} style={{ display: 'flex', flexWrap: 'wrap' }}>
          {[
            { title: 'Applied', value: recData?.appliedCount ?? 0, color: '#3B82F6', stage: 'Applied' },
            { title: 'Screening', value: recData?.screeningCount ?? 0, color: '#EAB308', stage: 'Screening' },
            { title: 'Interview', value: recData?.interviewCount ?? 0, color: '#06B6D4', stage: 'InterviewL1' },
            { title: 'Offer', value: recData?.offerCount ?? 0, color: '#F97316', stage: 'Offer' },
            { title: 'Rejected', value: recData?.rejectedCount ?? 0, color: '#EF4444', stage: 'Rejected' },
            { title: 'Joined', value: recData?.joinedCount ?? 0, color: '#22C55E', stage: 'Joined' }
          ].map((s) => (
            <Col xs={12} sm={8} lg={4} key={s.title} style={{ display: 'flex', flexDirection: 'column' }}>
              <Card 
                hoverable 
                onClick={() => navigate(`/recruitment/applications?stage=${s.stage}`)}
                bordered={false} 
                style={{ 
                  background: 'var(--color-bg-container)', 
                  border: 'var(--border-glass)', 
                  borderRadius: 12,
                  cursor: 'pointer'
                }}
                bodyStyle={{ padding: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.title}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {recLoading ? '...' : s.value}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Application Sources Widget */}
      <div style={{ marginBottom: 24 }}>
        <div className="hrms-section-label" style={{ marginBottom: 12 }}>
          Application Sources & Intake
        </div>
        <Card
          bordered={false}
          style={{ background: 'var(--color-bg-container)', border: 'var(--border-glass)', borderRadius: 12 }}
        >
          <Row gutter={[16, 16]}>
            {recData?.sourceCounts && recData.sourceCounts.length > 0 ? (
              recData.sourceCounts.map((sc) => {
                const totalCandidates = recData.totalCandidates || 1
                const percentage = Math.round((sc.count / totalCandidates) * 100)
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={sc.source}>
                    <Card
                      hoverable
                      onClick={() => navigate(`/recruitment/candidates?source=${sc.source}`)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 10,
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer'
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text-primary)' }}>{sc.source}</span>
                        <Tag color="blue">{sc.count} Candidates</Tag>
                      </div>
                      <Progress percent={percentage} size="small" strokeColor="#FAA71A" trailColor="rgba(255, 255, 255, 0.08)" />
                    </Card>
                  </Col>
                )
              })
            ) : (
              <Col span={24}>
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No candidate application source data available.
                </div>
              </Col>
            )}
          </Row>
        </Card>
      </div>

      {/* Workforce Insights Section */}
      <div style={{ marginBottom: 24 }}>
        <div className="hrms-section-label" style={{ marginBottom: 12 }}>
          Workforce Insights
        </div>
        <Row gutter={[16, 16]} style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Talent Stability */}
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div
              whileHover={{ scale: 1.025, y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{ height: '100%' }}
            >
              <div
                className="premium-glass-card"
                style={{
                  background: 'linear-gradient(135deg, #10113F 0%, #1c1d58 100%)',
                  borderRadius: 16,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 30px rgba(16, 17, 63, 0.12)',
                  height: '100%',
                }}
              >
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#FAA71A', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RiseOutlined /> Talent Stability
                    </span>
                    <span style={{ color: '#22C55E', fontSize: 11, fontWeight: 700, background: 'rgba(34, 197, 94, 0.2)', padding: '2px 8px', borderRadius: 4 }}>94.2% Stable</span>
                  </div>
                  <p style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                    Retention initiatives in the engineering department have successfully decreased month-over-month attrition by 1.2%.
                  </p>
                </div>
              </div>
            </motion.div>
          </Col>

          {/* Diversity & Inclusion */}
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div
              whileHover={{ scale: 1.025, y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{ height: '100%' }}
            >
              <div
                className="premium-glass-card"
                style={{
                  background: 'linear-gradient(135deg, #4D1B3B 0%, #682450 100%)',
                  borderRadius: 16,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 30px rgba(77, 27, 59, 0.12)',
                  height: '100%',
                }}
              >
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#FAA71A', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <TeamOutlined /> Gender Diversity
                    </span>
                    <span style={{ color: '#FAA71A', fontSize: 11, fontWeight: 700, background: 'rgba(250, 167, 26, 0.2)', padding: '2px 8px', borderRadius: 4 }}>38.5% Female</span>
                  </div>
                  <p style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                    Female representation in leadership roles increased to 38.5%, driven by the recent Q2 diversity-focused hiring drive.
                  </p>
                </div>
              </div>
            </motion.div>
          </Col>

          {/* Average Tenure */}
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div
              whileHover={{ scale: 1.025, y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{ height: '100%' }}
            >
              <div
                className="premium-glass-card"
                style={{
                  background: 'linear-gradient(135deg, #2D1B4D 0%, #3E2468 100%)',
                  borderRadius: 16,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 30px rgba(45, 27, 77, 0.12)',
                  height: '100%',
                }}
              >
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#FAA71A', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ClockCircleOutlined /> Average Tenure
                    </span>
                    <span style={{ color: '#818CF8', fontSize: 11, fontWeight: 700, background: 'rgba(129, 140, 248, 0.2)', padding: '2px 8px', borderRadius: 4 }}>4.2 Yrs Avg</span>
                  </div>
                  <p style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                    Average employee tenure stands at 4.2 years, showing a strong organization-wide talent loyalty index increase of 8%.
                  </p>
                </div>
              </div>
            </motion.div>
          </Col>

          {/* Capability Index */}
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div
              whileHover={{ scale: 1.025, y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{ height: '100%' }}
            >
              <div
                className="premium-glass-card"
                style={{
                  background: 'linear-gradient(135deg, #861630 0%, #a82041 100%)',
                  borderRadius: 16,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 30px rgba(134, 22, 48, 0.12)',
                  height: '100%',
                }}
              >
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#FAA71A', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircleOutlined /> Capability Index
                    </span>
                    <span style={{ color: '#ffffff', fontSize: 11, fontWeight: 700, background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: 4 }}>89% Done</span>
                  </div>
                  <p style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                    Compliance and POSH training completion stands at 89%. Four active leadership upskilling cohorts are running as planned.
                  </p>
                </div>
              </div>
            </motion.div>
          </Col>
        </Row>
      </div>

      <Row gutter={[20, 20]} style={{ display: 'flex', flexWrap: 'wrap' }}>
        {/* Joining Trend */}
        <Col xs={24} lg={14} style={{ display: 'flex', flexDirection: 'column' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card
              title={<span style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: 15, letterSpacing: '-0.01em', transition: 'color 0.25s' }}>12-Month Joining Trend</span>}
              style={{ borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ padding: '16px 0 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              {hrLoading ? (
                <Skeleton active paragraph={{ rows: 4 }} style={{ padding: '0 24px 24px' }} />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={hrData?.monthlyJoiningTrend || []} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                    <defs>
                      <linearGradient id="joinGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isDarkMode ? '#FAA71A' : '#10113F'} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={isDarkMode ? '#FAA71A' : '#10113F'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(160, 90, 255, 0.15)' : 'rgba(16,17,63,0.06)'} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDarkMode ? 'rgba(200,160,255,0.6)' : 'rgba(16,17,63,0.45)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDarkMode ? 'rgba(200,160,255,0.6)' : 'rgba(16,17,63,0.45)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: isDarkMode ? '#ffffff' : '#10113F' }}
                      labelStyle={{ color: isDarkMode ? '#FAA71A' : '#10113F', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="joinings" stroke={isDarkMode ? '#FAA71A' : '#10113F'} strokeWidth={2.5} fill="url(#joinGrad)" name="Joinings" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>
        </Col>

        {/* Today's Attendance */}
        <Col xs={24} lg={10} style={{ display: 'flex', flexDirection: 'column' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card
              title={<span style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: 15, letterSpacing: '-0.01em', transition: 'color 0.25s' }}>Today's Attendance</span>}
              extra={<Tag color="processing" style={{ borderRadius: 6, fontWeight: 700, fontSize: 10 }}>{dayjs().format('DD MMM YYYY')}</Tag>}
              style={{ borderRadius: 16, height: '100%', display: 'flex', flexDirection: 'column' }}
              bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              {todayLoading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={attendancePie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                          {attendancePie.map((entry, i) => (
                            <Cell key={i} fill={ATTENDANCE_COLORS[entry.name.replace(' ', '')] || '#CBD5E1'} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          itemStyle={{ color: isDarkMode ? '#ffffff' : '#10113F' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    {attendancePie.map((d) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: isDarkMode ? 'rgba(140, 70, 255, 0.06)' : 'rgba(16,17,63,0.02)', borderRadius: 6, border: isDarkMode ? '1px solid rgba(160, 90, 255, 0.12)' : 'none', transition: 'all 0.25s' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ATTENDANCE_COLORS[d.name.replace(' ', '')] || '#CBD5E1', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: isDarkMode ? 'rgba(200,160,255,0.75)' : 'rgba(16,17,63,0.6)', fontWeight: 500, transition: 'color 0.25s' }}>{d.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', transition: 'color 0.25s' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        </Col>

        {/* Headcount by Dept */}
        <Col xs={24}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card
              title={<span style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: 15, letterSpacing: '-0.01em', transition: 'color 0.25s' }}>Headcount by Department</span>}
              style={{ borderRadius: 16 }}
              bodyStyle={{ padding: '16px 0 0' }}
            >
              {hrLoading ? (
                <Skeleton active paragraph={{ rows: 3 }} style={{ padding: '0 24px 24px' }} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hrData?.headcountByDept || []} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(160, 90, 255, 0.15)' : 'rgba(16,17,63,0.06)'} />
                    <XAxis dataKey="departmentName" tick={{ fontSize: 11, fill: isDarkMode ? 'rgba(200,160,255,0.6)' : 'rgba(16,17,63,0.45)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDarkMode ? 'rgba(200,160,255,0.6)' : 'rgba(16,17,63,0.45)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: isDarkMode ? '#ffffff' : '#10113F' }}
                      labelStyle={{ color: isDarkMode ? '#FAA71A' : '#10113F', fontWeight: 'bold' }}
                      cursor={isDarkMode ? { fill: 'rgba(140, 70, 255, 0.08)' } : { fill: 'rgba(16, 17, 63, 0.025)' }}
                    />
                    <Bar
                      dataKey="count"
                      fill={isDarkMode ? '#FAA71A' : '#10113F'}
                      radius={[6, 6, 0, 0]}
                      name="Employees"
                      activeBar={{
                        fill: isDarkMode ? '#FFC355' : '#1D1F6E',
                        stroke: isDarkMode ? '#FFF4E3' : '#FAA71A',
                        strokeWidth: 1.5,
                        radius: [6, 6, 0, 0],
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Payroll Status */}
      {hrData?.payrollStatus && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Card style={{ marginTop: 20, borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircleOutlined style={{ color: '#22C55E', fontSize: 20 }} />
              <div>
                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14, transition: 'color 0.25s' }}>Latest Payroll Status: </span>
                <Tag color="success" style={{ marginLeft: 4, borderRadius: 6, fontWeight: 700, textTransform: 'uppercase', fontSize: 11 }}>{hrData.payrollStatus}</Tag>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

function ManagerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'manager'],
    queryFn: dashboardService.getManagerDashboard,
    select: (res) => res?.data,
  })

  const stats = [
    { title: 'Team Size',          value: data?.teamSize,               icon: <TeamOutlined />,        color: '#10113F', delay: 0 },
    { title: 'Present Today',      value: data?.presentToday,            icon: <CheckCircleOutlined />, color: '#FAA71A', delay: 0.05 },
    { title: 'Absent Today',       value: data?.absentToday,             icon: <AlertOutlined />,       color: '#E94043', delay: 0.1 },
    { title: 'On Leave',           value: data?.onLeaveToday,            icon: <ClockCircleOutlined />, color: '#4D1B3B', delay: 0.15 },
    { title: 'WFH Today',          value: data?.wfhToday,                icon: <TeamOutlined />,        color: '#861630', delay: 0.2 },
    { title: 'Pending Approvals',  value: data?.pendingLeaveApprovals,   icon: <ClockCircleOutlined />, color: '#FAA71A', delay: 0.25 },
  ]

  return (
    <Row gutter={[16, 16]} style={{ display: 'flex', flexWrap: 'wrap' }}>
      {stats.map((s) => (
        <Col xs={24} sm={12} lg={8} key={s.title} style={{ display: 'flex', flexDirection: 'column' }}>
          <StatCard {...s} loading={isLoading} />
        </Col>
      ))}
    </Row>
  )
}

function EmployeeDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { isDarkMode } = useUIStore()

  // Queries
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: dashboardService.getEmployeeDashboard,
    select: (res) => res?.data,
  })

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: employeeService.getMyProfile,
    select: (res) => res?.data,
  })

  const id = profile?.employeeId

  const { data: docs } = useQuery({
    queryKey: ['employee-docs', id],
    queryFn: () => employeeService.getDocuments(id),
    enabled: !!id,
    select: (res) => res?.data || [],
  })

  const { data: banks } = useQuery({
    queryKey: ['employee-banks', id],
    queryFn: () => employeeService.getBankDetails(id),
    enabled: !!id,
    select: (res) => res?.data || [],
  })

  // Profile Completion Calculations
  const storedEdu = id ? localStorage.getItem(`emp_edu_${id}`) : null
  const storedExp = id ? localStorage.getItem(`emp_exp_${id}`) : null

  const education = storedEdu ? JSON.parse(storedEdu) : [
    { key: '1', degree: 'Bachelor of Technology (B.Tech) in Computer Science', school: 'Indian Institute of Technology, Delhi', year: '2020', grade: '9.2 CGPA' },
    { key: '2', degree: 'Higher Secondary School Certificate', school: 'St. Xavier School, Delhi', year: '2016', grade: '92%' }
  ]
  const experience = storedExp ? JSON.parse(storedExp) : [
    { key: '1', role: 'Software Engineer', company: 'Tech Solutions Private Limited', start: 'Jul 2021', end: 'Dec 2023', details: 'Developed responsive user interfaces, integrated REST APIs, and managed deployment workflows.' },
    { key: '2', role: 'Associate Developer', company: 'Innova Systems', start: 'Jun 2020', end: 'Jun 2021', details: 'Built core features for client-facing financial applications.' }
  ]

  const isEduBackend = profile?.educations && profile.educations.length > 0
  const isExpBackend = profile?.experiences && profile.experiences.length > 0

  const activeEduList = isEduBackend ? profile.educations : education
  const activeExpList = isExpBackend ? profile.experiences : experience

  const completionChecks = profile ? [
    { label: 'Photo', ok: !!profile.profilePhoto },
    { label: 'PAN', ok: !!profile.maskedPAN },
    { label: 'Aadhaar', ok: !!profile.maskedAadhar },
    { label: 'Emergency Contact', ok: !!profile.emergencyContactName && !!profile.emergencyContactPhone },
    { label: 'Address', ok: !!profile.permanentAddress || !!profile.currentAddress },
    { label: 'Date of Birth', ok: !!profile.dateOfBirth },
    { label: 'Bank Details', ok: banks && banks.length > 0 },
    { label: 'Education', ok: activeEduList && activeEduList.length > 0 },
    { label: 'Experience', ok: activeExpList && activeExpList.length > 0 },
    { label: 'Documents', ok: docs && docs.length > 0 },
    { label: 'Blood Group', ok: !!profile.bloodGroup },
  ] : []

  const filled = completionChecks.filter(c => c.ok).length
  const completionPercentage = completionChecks.length > 0 ? Math.round((filled / completionChecks.length) * 100) : 0
  const missingItems = completionChecks.filter(c => !c.ok).map(c => c.label)

  // Document Verification Alert
  const pendingDocsCount = docs ? docs.filter(d => !d.isVerified).length : 0

  // Upcoming Leave Calculator
  const getNextLeaveCountdown = () => {
    if (!user?.id) return null
    const storedRequests = localStorage.getItem(`leave_requests_${user.id}`)
    if (!storedRequests) return null
    try {
      const requests = JSON.parse(storedRequests)
      const futureRequests = requests
        .filter(r => r.status === 'Approved' || r.status === 'Pending')
        .map(r => {
          const startDate = dayjs(r.start, 'DD MMM YYYY')
          const diffDays = startDate.diff(dayjs().startOf('day'), 'day')
          return { ...r, diffDays, startDate }
        })
        .filter(r => r.diffDays >= 0)
        .sort((a, b) => a.diffDays - b.diffDays)

      if (futureRequests.length > 0) {
        return futureRequests[0]
      }
    } catch (e) {
      console.error(e)
    }
    return null
  }
  const nextLeave = getNextLeaveCountdown()

  // Attendance Progress
  const getWorkingDaysSoFar = () => {
    let count = 0
    let current = dayjs().startOf('month')
    const today = dayjs()
    while (current.isBefore(today) || current.isSame(today, 'day')) {
      const dayOfWeek = current.day()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sat/Sun
        count++
      }
      current = current.add(1, 'day')
    }
    return count || 1
  }

  const workingDays = getWorkingDaysSoFar()
  const attendanceCount = dashboardData?.attendanceThisMonth || 0
  const attendanceRate = Math.min(100, Math.round((attendanceCount / workingDays) * 100))

  return (
    <Row gutter={[20, 20]} style={{ display: 'flex', flexWrap: 'wrap' }}>
      {/* Left Area (Cards, balances, holidays) */}
      <Col xs={24} lg={16} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Core Quick Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} style={{ display: 'flex', flexDirection: 'column' }}>
            <StatCard title="Attendance This Month" value={dashboardData?.attendanceThisMonth} icon={<CheckCircleOutlined />} color="#22C55E" loading={isLoading} />
          </Col>
          <Col xs={24} sm={8} style={{ display: 'flex', flexDirection: 'column' }}>
            <StatCard title="Today's Status" value={dashboardData?.todayStatus || 'Not Marked'} loading={isLoading} color="#10113F" />
          </Col>
          <Col xs={24} sm={8} style={{ display: 'flex', flexDirection: 'column' }}>
            <StatCard title="Pending Leave Applications" value={dashboardData?.pendingLeaveApplications} icon={<ClockCircleOutlined />} color="#FAA71A" loading={isLoading} />
          </Col>
        </Row>

        {/* Leave Balances */}
        {dashboardData?.leaveBalances && (
          <Card title={<span style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: 15, transition: 'color 0.25s' }}><CalendarOutlined style={{ color: '#FAA71A', marginRight: 8 }} />Leave Balances</span>} style={{ borderRadius: 16 }}>
            <Row gutter={[12, 12]}>
              {Object.entries(dashboardData.leaveBalances).map(([code, balance]) => (
                <Col xs={12} sm={8} md={6} key={code}>
                  <div style={{ background: isDarkMode ? 'rgba(140, 70, 255, 0.08)' : 'rgba(16, 17, 63, 0.02)', border: isDarkMode ? '1px solid rgba(160, 90, 255, 0.18)' : '1px solid rgba(16, 17, 63, 0.06)', borderRadius: 12, padding: 16, textAlign: 'center', transition: 'all 0.25s' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', transition: 'color 0.25s' }}>{balance}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, transition: 'color 0.25s' }}>{code}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* Upcoming Holidays */}
        {dashboardData?.upcomingHolidays?.length > 0 && (
          <Card title={<span style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: 15, transition: 'color 0.25s' }}><CalendarOutlined style={{ color: '#FAA71A', marginRight: 8 }} />Upcoming Holidays</span>} style={{ borderRadius: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dashboardData.upcomingHolidays.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < dashboardData.upcomingHolidays.length - 1 ? (isDarkMode ? '1px solid rgba(160, 90, 255, 0.15)' : '1px solid #F0F0F0') : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', transition: 'color 0.25s' }}>{h.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', transition: 'color 0.25s' }}>{dayjs(h.date).format('dddd, D MMMM YYYY')}</div>
                  </div>
                  <Tag style={{ borderRadius: 6, fontWeight: 700, textTransform: 'uppercase', fontSize: 11, background: 'rgba(77,27,59,0.15)', color: '#4D1B3B', border: '1px solid rgba(77,27,59,0.25)' }}>{h.type}</Tag>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Col>

      {/* Right Area (Storytelling insights, Profile completion widget, Docs pending review alert) */}
      <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Storytelling Insights Card */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div
            className="premium-glass-card"
            style={{
              borderRadius: 16,
              background: isDarkMode 
                ? 'linear-gradient(135deg, #10113F 0%, #151642 100%)' 
                : 'linear-gradient(135deg, #10113F 0%, #1c1d5b 100%)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 10px 24px rgba(16, 17, 63, 0.15)',
              overflow: 'hidden',
              position: 'relative',
              padding: '24px',
            }}
          >
            <div style={{ position: 'absolute', right: '-15%', bottom: '-15%', width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250, 167, 26, 0.15) 0%, transparent 70%)', filter: 'blur(15px)', pointerEvents: 'none' }} />
            
            <div style={{ fontSize: 12, fontWeight: 800, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Contextual Insights
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Attendance Progress Insight */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <CheckCircleFilled style={{ color: '#22C55E', fontSize: 16, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Attendance Target</div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }}>
                    You have achieved <strong style={{ color: '#FAA71A' }}>{attendanceRate}%</strong> attendance this month ({attendanceCount} of {workingDays} working days so far).
                  </div>
                </div>
              </div>

              {/* Upcoming Leave Countdown Insight */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <InfoCircleOutlined style={{ color: '#FAA71A', fontSize: 16, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Leave Calendar</div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }}>
                    {nextLeave ? (
                      nextLeave.diffDays === 0 ? (
                        <span>Your <strong style={{ color: '#FAA71A' }}>{nextLeave.type}</strong> starts today!</span>
                      ) : nextLeave.diffDays === 1 ? (
                        <span>Your <strong style={{ color: '#FAA71A' }}>{nextLeave.type}</strong> starts tomorrow!</span>
                      ) : (
                        <span>Your next leave begins in <strong style={{ color: '#FAA71A' }}>{nextLeave.diffDays} days</strong> ({nextLeave.type}).</span>
                      )
                    ) : (
                      'No upcoming leave requests scheduled.'
                    )}
                  </div>
                </div>
              </div>

              {/* Payslip Status Insight */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <FileTextOutlined style={{ color: '#818CF8', fontSize: 16, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Payslip Status</div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }}>
                    Your <strong style={{ color: '#FAA71A' }}>{dayjs().subtract(1, 'month').format('MMMM YYYY')}</strong> payslip is now ready.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Completion Card Widget */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Card
            title={
              <span style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: 15, transition: 'color 0.25s' }}>
                Profile Completion
              </span>
            }
            style={{ borderRadius: 16, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px' }}
          >
            {profileLoading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : (
              <>
                <Progress
                  type="circle"
                  percent={completionPercentage}
                  strokeColor={{
                    '0%': '#10113F',
                    '100%': '#FAA71A',
                  }}
                  width={110}
                  style={{ marginBottom: 20 }}
                />
                
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {completionPercentage === 100 ? 'Your Profile is complete!' : 'Complete your profile'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Completing your profile allows HR to process your documents and payroll smoothly.
                  </div>
                </div>

                {missingItems.length > 0 && (
                  <div style={{ width: '100%', background: isDarkMode ? 'rgba(250,167,26,0.08)' : 'rgba(250,167,26,0.05)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, border: '1px dashed rgba(250,167,26,0.3)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#FAA71A', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <WarningOutlined /> Action Required: Missing Items ({missingItems.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {missingItems.slice(0, 4).map((item, i) => (
                        <Tag key={i} color="warning" style={{ borderRadius: 6, fontSize: 10.5, fontWeight: 600 }}>{item}</Tag>
                      ))}
                      {missingItems.length > 4 && (
                        <Tag color="warning" style={{ borderRadius: 6, fontSize: 10.5, fontWeight: 600 }}>+{missingItems.length - 4} more</Tag>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/employees/my-profile')}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #FAA71A 0%, #f7c358 100%)'
                      : 'linear-gradient(135deg, #10113F 0%, #1c1d5b 100%)',
                    color: isDarkMode ? '#10113F' : '#ffffff',
                    border: 'none',
                    boxShadow: isDarkMode
                      ? '0 4px 14px rgba(250,167,26,0.25)'
                      : '0 4px 14px rgba(16,17,63,0.2)',
                  }}
                >
                  Go to Profile
                </Button>
              </>
            )}
          </Card>
        </motion.div>

        {/* Document Verification Alert Card */}
        {pendingDocsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid rgba(250, 167, 26, 0.25)',
                background: isDarkMode ? 'rgba(250, 167, 26, 0.05)' : 'rgba(250, 167, 26, 0.02)',
              }}
              bodyStyle={{ padding: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <WarningOutlined style={{ color: '#FAA71A', fontSize: 20, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--color-text-primary)' }}>
                    Documents Pending Verification
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                    You have <strong style={{ color: '#FAA71A' }}>{pendingDocsCount} {pendingDocsCount === 1 ? 'document' : 'documents'}</strong> currently pending verification by the HR administration team. We will notify you once reviewed.
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </Col>
    </Row>
  )
}

export default function DashboardPage() {
  const { roles, user } = useAuthStore()
  const { isDarkMode } = useUIStore()
  const isHR = roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(r))
  const isManager = roles.includes('DEPT_MANAGER')

  const greetingInfo = () => {
    const h = new Date().getHours()
    if (h < 12) return { text: 'Good morning', icon: '☀️', message: 'Ready to kickstart your day?' }
    if (h < 17) return { text: 'Good afternoon', icon: '🌤️', message: 'Hope your day is going productively!' }
    return { text: 'Good evening', icon: '🌙', message: 'Wrapping up for the day?' }
  }

  const { text, icon, message: greetMessage } = greetingInfo()

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            background: isDarkMode 
              ? 'linear-gradient(135deg, #0e0f2b 0%, #151642 50%, #201a40 100%)' 
              : 'linear-gradient(135deg, #10113F 0%, #1c1d58 50%, #2d2f82 100%)',
            color: '#fff',
            borderRadius: 24,
            padding: '28px 36px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 40px rgba(16, 17, 63, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 20
          }}
        >
          {/* Glowing background shapes for depth */}
          <div style={{ position: 'absolute', right: '-5%', top: '-25%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(250, 167, 26, 0.18) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '25%', bottom: '-50%', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: '-5%', top: '-10%', width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233, 64, 67, 0.1) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

          {/* Left Column: Greeting Details & Date Display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, zIndex: 1, flex: '1 1 65%', minWidth: 280 }}>
            {/* First Row: Greeting Header with Date Tile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* Date Display (square calendar tile replacing sun box) */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  y: {
                    repeat: Infinity,
                    duration: 3.2,
                    ease: 'easeInOut'
                  }
                }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: 3,
                  boxShadow: '0 16px 32px rgba(250, 167, 26, 0.25)',
                  border: '1px solid rgba(250, 167, 26, 0.4)'
                }}
                style={{
                  width: 64,
                  height: 64,
                  background: 'rgba(255, 255, 255, 0.09)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  borderRadius: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  textAlign: 'center',
                  padding: '4px 0',
                  flexShrink: 0,
                  cursor: 'default',
                  transition: 'box-shadow 0.3s ease, border 0.3s ease'
                }}
                title={dayjs().format('dddd, D MMMM YYYY')}
              >
                <div style={{ fontSize: 9, fontWeight: 800, color: '#FAA71A', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '0.05em' }}>
                  {dayjs().format('MMM')}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '2px 0 1px', lineHeight: 1 }}>
                  {dayjs().format('D')}
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', lineHeight: 1, letterSpacing: '0.02em' }}>
                  {dayjs().format('ddd')}
                </div>
              </motion.div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
                  System Overview
                </div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {text}, <span style={{ background: 'linear-gradient(90deg, #ffffff 0%, #FFF2CC 50%, #FAA71A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>{user?.firstName || user?.username || 'User'}</span> <span className="wave-emoji">👋</span>
                </h1>
              </div>
            </div>
            
            {/* Second Row: Message Paragraph */}
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, maxWidth: 620, lineHeight: 1.5 }}>
              {greetMessage} {isHR ? "You have unrestricted administrative operations control." : isManager ? "You have management options for your department direct reports." : "Access your self-service timesheets, leave balances, and payslips."}
            </p>
          </div>

          {/* Right Column: Illustration (aligned with the first line) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -8, 0]
            }}
            transition={{ 
              opacity: { duration: 0.6 },
              scale: { duration: 0.6 },
              y: {
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut',
                delay: 0.4
              }
            }}
            whileHover={{ 
              scale: 1.08,
              filter: isDarkMode 
                ? 'drop-shadow(0 12px 24px rgba(250, 167, 26, 0.3))' 
                : 'drop-shadow(0 12px 24px rgba(255, 255, 255, 0.25))'
            }}
            style={{ 
              flexShrink: 0, 
              opacity: 0.95, 
              zIndex: 1, 
              alignSelf: 'flex-start', 
              marginTop: 6,
              filter: isDarkMode 
                ? 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))' 
                : 'drop-shadow(0 8px 16px rgba(16, 17, 63, 0.12))',
              transition: 'filter 0.3s ease'
            }}
          >
            <DashboardIllustration size={120} />
          </motion.div>
        </motion.div>
      </div>

      {isHR ? <HRDashboard /> : isManager ? <ManagerDashboard /> : <EmployeeDashboard />}
    </div>
  )
}
