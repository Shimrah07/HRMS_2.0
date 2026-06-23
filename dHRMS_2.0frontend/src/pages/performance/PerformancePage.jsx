import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tabs,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Slider,
  Progress,
  Tag,
  Row,
  Col,
  Rate,
  Switch,
  Popconfirm,
  Tooltip,
  Alert,
  Empty,
  message,
} from 'antd'
import {
  TrophyOutlined,
  SolutionOutlined,
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UserOutlined,
  LineChartOutlined,
  SendOutlined,
  AuditOutlined,
  StarOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import dayjs from 'dayjs'

import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import performanceService from '../../services/performanceService'
import { employeeService } from '../../services/employeeService'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import { EmptyPerformance } from '../../components/common/HRIllustrations'

const { TabPane } = Tabs
const { TextArea } = Input

// Rating scale descriptors
const RATING_LABELS = {
  1: 'Needs Improvement (1/5)',
  2: 'Approaching Expectations (2/5)',
  3: 'Meets Expectations (3/5)',
  4: 'Exceeds Expectations (4/5)',
  5: 'Outstanding (5/5)',
}

export default function PerformancePage() {
  const queryClient = useQueryClient()
  const { user, hasRole, hasAnyRole } = useAuthStore()
  const { isDarkMode } = useUIStore()

  // Roles checking
  const isAdmin = hasAnyRole('HR_ADMIN', 'HR_MANAGER', 'SUPER_ADMIN')
  const isManager = hasRole('DEPT_MANAGER')

  // Selected state for filters
  const [selectedCycleId, setSelectedCycleId] = useState(null)
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null)

  // Modals state
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [isGoalReviewModalOpen, setIsGoalReviewModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [isPipModalOpen, setIsPipModalOpen] = useState(false)

  // Modals editing references
  const [editingGoal, setEditingGoal] = useState(null)
  const [reviewingGoal, setReviewingGoal] = useState(null)
  const [selectedPip, setSelectedPip] = useState(null)

  // Form references
  const [cycleForm] = Form.useForm()
  const [goalForm] = Form.useForm()
  const [goalReviewForm] = Form.useForm()
  const [reviewForm] = Form.useForm()
  const [pipForm] = Form.useForm()

  // ─── 1. FETCH API DATA ───────────────────────────────────────────────────

  // Get all appraisal cycles
  const { data: cyclesRes, isLoading: cyclesLoading } = useQuery({
    queryKey: ['performance', 'cycles'],
    queryFn: performanceService.getCycles,
  })
  const cycles = cyclesRes?.data || []

  // Track currently active/selected cycle
  const activeCycle = cycles.find((c) => c.cycleId === selectedCycleId) || cycles[0]

  useEffect(() => {
    if (cycles.length > 0 && !selectedCycleId) {
      // Auto-select the first cycle (usually latest) or current open one
      const openCycle = cycles.find(
        (c) => c.status === 'GoalSetting' || c.status === 'InProgress' || c.status === 'Review'
      )
      setSelectedCycleId(openCycle ? openCycle.cycleId : cycles[0].cycleId)
    }
  }, [cycles, selectedCycleId])

  // Get employees (for Managers/HR Admins dropdown)
  const { data: employeesRes } = useQuery({
    queryKey: ['performance', 'employees'],
    queryFn: () => employeeService.getEmployees({ pageSize: 1000 }),
    enabled: isManager || isAdmin,
  })
  const employees = employeesRes?.data?.items || employeesRes?.data || []

  // Filter team members based on role
  const teamMembers = employees.filter((emp) => {
    if (isAdmin) return true // HR Admins see everyone
    if (isManager) return emp.reportingManagerId === user?.employeeId // Managers see direct reports
    return false
  })

  // Set default selected team member
  useEffect(() => {
    if (teamMembers.length > 0 && !selectedTeamMemberId) {
      setSelectedTeamMemberId(teamMembers[0].employeeId)
    }
  }, [teamMembers, selectedTeamMemberId])

  // Fetch current user's goals
  const { data: myGoalsRes, isLoading: myGoalsLoading } = useQuery({
    queryKey: ['performance', 'goals', 'my', selectedCycleId],
    queryFn: () =>
      performanceService.getGoals({
        cycleId: selectedCycleId,
        employeeId: user?.employeeId,
      }),
    enabled: !!selectedCycleId && !!user?.employeeId,
  })
  const myGoals = myGoalsRes?.data || []

  // Fetch team member's goals
  const { data: teamGoalsRes, isLoading: teamGoalsLoading } = useQuery({
    queryKey: ['performance', 'goals', 'team', selectedCycleId, selectedTeamMemberId],
    queryFn: () =>
      performanceService.getGoals({
        cycleId: selectedCycleId,
        employeeId: selectedTeamMemberId,
      }),
    enabled: !!selectedCycleId && !!selectedTeamMemberId && (isManager || isAdmin),
  })
  const teamGoals = teamGoalsRes?.data || []

  // Fetch reviews for company-wide distribution or self review
  const { data: myReviewsRes } = useQuery({
    queryKey: ['performance', 'reviews', 'my', selectedCycleId],
    queryFn: () =>
      performanceService.getReviews({
        cycleId: selectedCycleId,
        employeeId: user?.employeeId,
      }),
    enabled: !!selectedCycleId && !!user?.employeeId,
  })
  const myReviews = myReviewsRes?.data || []

  const { data: allReviewsRes } = useQuery({
    queryKey: ['performance', 'reviews', 'all', selectedCycleId],
    queryFn: () => performanceService.getReviews({ cycleId: selectedCycleId }),
    enabled: !!selectedCycleId && isAdmin,
  })
  const allReviews = allReviewsRes?.data || []

  // Fetch PIPs
  const { data: pipsRes, isLoading: pipsLoading } = useQuery({
    queryKey: ['performance', 'pips', user?.employeeId],
    queryFn: () =>
      performanceService.getPips(
        isAdmin || isManager ? {} : { employeeId: user?.employeeId }
      ),
    enabled: !!user?.employeeId,
  })
  const pips = pipsRes?.data || []

  // ─── 2. MUTATIONS (CREATE/UPDATE/DELETE) ───────────────────────────────────

  const cycleMutation = useMutation({
    mutationFn: performanceService.createCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'cycles'] })
      message.success('Appraisal cycle created successfully!')
      setIsCycleModalOpen(false)
      cycleForm.resetFields()
    },
  })

  const goalCreateMutation = useMutation({
    mutationFn: performanceService.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'goals'] })
      message.success('Goal created successfully!')
      setIsGoalModalOpen(false)
      goalForm.resetFields()
    },
  })

  const goalUpdateMutation = useMutation({
    mutationFn: ({ id, payload }) => performanceService.updateGoal(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'goals'] })
      message.success('Goal updated successfully!')
      setIsGoalModalOpen(false)
      setIsGoalReviewModalOpen(false)
      setEditingGoal(null)
      setReviewingGoal(null)
      goalForm.resetFields()
      goalReviewForm.resetFields()
    },
  })

  const goalDeleteMutation = useMutation({
    mutationFn: performanceService.deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'goals'] })
      message.success('Goal deleted successfully!')
    },
  })

  const reviewSubmitMutation = useMutation({
    mutationFn: performanceService.submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'reviews'] })
      message.success('Performance review submitted successfully!')
      setIsReviewModalOpen(false)
      reviewForm.resetFields()
    },
  })

  const pipCreateMutation = useMutation({
    mutationFn: performanceService.createPip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'pips'] })
      message.success('Performance Improvement Plan initiated!')
      setIsPipModalOpen(false)
      pipForm.resetFields()
    },
  })

  const pipUpdateMutation = useMutation({
    mutationFn: ({ id, payload }) => performanceService.updatePip(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance', 'pips'] })
      message.success('PIP updated successfully!')
      setIsPipModalOpen(false)
      setSelectedPip(null)
      pipForm.resetFields()
    },
  })

  // ─── 3. FORM SUBMIT HANDLERS ─────────────────────────────────────────────

  const handleCycleSubmit = (values) => {
    const payload = {
      ...values,
      startDate: values.dateRange[0].format('YYYY-MM-DD'),
      endDate: values.dateRange[1].format('YYYY-MM-DD'),
      goalSettingDeadline: values.goalSettingDeadline?.format('YYYY-MM-DD'),
      midYearDeadline: values.midYearDeadline?.format('YYYY-MM-DD'),
      finalReviewDeadline: values.finalReviewDeadline?.format('YYYY-MM-DD'),
    }
    delete payload.dateRange
    cycleMutation.mutate(payload)
  }

  const handleGoalSubmit = (values) => {
    if (editingGoal) {
      goalUpdateMutation.mutate({
        id: editingGoal.goalId,
        payload: { ...editingGoal, ...values },
      })
    } else {
      goalCreateMutation.mutate({
        ...values,
        cycleId: selectedCycleId,
        employeeId: user?.employeeId,
      })
    }
  }

  const handleGoalReviewSubmit = (values) => {
    goalUpdateMutation.mutate({
      id: reviewingGoal.goalId,
      payload: { ...reviewingGoal, ...values },
    })
  }

  const handleReviewSubmit = (values) => {
    reviewSubmitMutation.mutate({
      ...values,
      cycleId: selectedCycleId,
      employeeId: selectedTeamMemberId,
      reviewType: 'Manager',
      status: 'Submitted',
    })
  }

  const handlePipSubmit = (values) => {
    if (selectedPip) {
      pipUpdateMutation.mutate({
        id: selectedPip.pipId,
        payload: {
          ...selectedPip,
          ...values,
        },
      })
    } else {
      pipCreateMutation.mutate({
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
      })
    }
  }

  // ─── 4. HELPER COMPUTATIONS ──────────────────────────────────────────────

  const myTotalWeightage = myGoals.reduce((sum, g) => sum + g.weightage, 0)
  const myAvgProgress =
    myGoals.length > 0
      ? Math.round(
          myGoals.reduce((sum, g) => {
            const act = parseFloat(g.actualValue) || 0
            const tar = parseFloat(g.targetValue) || 1
            const ratio = Math.min(100, (act / tar) * 100)
            return sum + ratio * (g.weightage / 100)
          }, 0)
        )
      : 0

  const teamTotalWeightage = teamGoals.reduce((sum, g) => sum + g.weightage, 0)
  const teamAvgProgress =
    teamGoals.length > 0
      ? Math.round(
          teamGoals.reduce((sum, g) => {
            const act = parseFloat(g.actualValue) || 0
            const tar = parseFloat(g.targetValue) || 1
            const ratio = Math.min(100, (act / tar) * 100)
            return sum + ratio * (g.weightage / 100)
          }, 0)
        )
      : 0

  // Appraisal Cycle status tag renderer
  const renderCycleStatusTag = (status) => {
    const tags = {
      Draft: <Tag color="default">Draft</Tag>,
      GoalSetting: <Tag color="processing">OKR Setting</Tag>,
      InProgress: <Tag color="warning">In Progress</Tag>,
      Review: <Tag color="error">Appraisal Review</Tag>,
      Calibration: <Tag color="purple">Calibration</Tag>,
      Completed: <Tag color="success">Completed</Tag>,
    }
    return tags[status] || <Tag>{status}</Tag>
  }

  // ─── 5. CHART DATA PREPARATIONS ──────────────────────────────────────────

  // Simulating bell curve ratings count (based on loaded reviews)
  const getBellCurveData = () => {
    const ratings = [1, 2, 3, 4, 5]
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    
    // Count real ratings
    allReviews.forEach((r) => {
      if (r.overallRating) {
        const rounded = Math.round(r.overallRating)
        if (counts[rounded] !== undefined) counts[rounded]++
      }
    })

    const total = allReviews.length || 10 // Fallback to visualize curve if no reviews submitted yet
    
    // Standard recommended distribution: 10% (1), 20% (2), 40% (3), 20% (4), 10% (5)
    return ratings.map((r) => ({
      rating: `${r} Star`,
      ActualCount: allReviews.length > 0 ? counts[r] : Math.round(total * (r === 3 ? 0.4 : r === 2 || r === 4 ? 0.2 : 0.1)),
      TargetPercent: r === 3 ? 40 : r === 2 || r === 4 ? 20 : 10,
    }))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Performance Management"
        subtitle="Set organizational OKRs, perform self & manager appraisals, and manage team milestones."
      />

      {/* Cycle Selector Banner */}
      <Card
        className="w-full"
        style={{
          background: 'var(--color-card-bg)',
          backdropFilter: 'blur(12px)',
          border: 'var(--border-glass)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarOutlined style={{ fontSize: 20, color: 'var(--color-accent)' }} />
            <div>
              <h3 className="text-sm font-semibold uppercase text-[var(--color-text-muted)] tracking-wider">
                Appraisal Cycle
              </h3>
              <Select
                value={selectedCycleId}
                onChange={setSelectedCycleId}
                style={{ width: 280, fontWeight: 'bold' }}
                loading={cyclesLoading}
                className="mt-1 font-semibold"
                size="large"
              >
                {cycles.map((c) => (
                  <Select.Option key={c.cycleId} value={c.cycleId}>
                    {c.cycleName}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>

          {activeCycle && (
            <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--color-text-secondary)]">
              <div>
                <span className="font-bold block text-xs uppercase text-[var(--color-text-muted)]">
                  Timeline
                </span>
                {dayjs(activeCycle.startDate).format('MMM D, YYYY')} -{' '}
                {dayjs(activeCycle.endDate).format('MMM D, YYYY')}
              </div>
              <div>
                <span className="font-bold block text-xs uppercase text-[var(--color-text-muted)]">
                  Deadline
                </span>
                {activeCycle.finalReviewDeadline
                  ? dayjs(activeCycle.finalReviewDeadline).format('MMM D, YYYY')
                  : 'N/A'}
              </div>
              <div>
                <span className="font-bold block text-xs uppercase text-[var(--color-text-muted)] flex items-center gap-1">
                  Status
                </span>
                <span className="block mt-1">{renderCycleStatusTag(activeCycle.status)}</span>
              </div>
            </div>
          )}

          {isAdmin && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCycleModalOpen(true)}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              Configure Cycle
            </Button>
          )}
        </div>
      </Card>

      {/* Main Tabs */}
      <Tabs
        defaultActiveKey="my-goals"
        style={{
          background: 'var(--color-card-bg)',
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          border: 'var(--border-glass)',
          boxShadow: 'var(--shadow-subtle)',
        }}
      >
        {/* ─── TAB 1: MY OKRs ─────────────────────────────────────────────────── */}
        <TabPane
          tab={
            <span>
              <TrophyOutlined /> My Goals (OKRs)
            </span>
          }
          key="my-goals"
        >
          <div className="space-y-6">
            {/* KPI Cards */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <StatCard
                  title="Goal Completion Progress"
                  value={`${myAvgProgress}%`}
                  subtitle="Weighted completion of active goals"
                  icon={<TrophyOutlined />}
                  color="var(--color-accent)"
                  loading={myGoalsLoading}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <StatCard
                  title="Total Goal Weightage"
                  value={`${myTotalWeightage}/100%`}
                  subtitle="Target: Sum of goal weightages = 100%"
                  icon={<SolutionOutlined />}
                  color={myTotalWeightage === 100 ? 'green' : 'var(--color-danger)'}
                  loading={myGoalsLoading}
                />
              </Col>
              <Col xs={24} sm={24} md={8}>
                <StatCard
                  title="Appraisal Review"
                  value={myReviews[0]?.overallRating ? `${myReviews[0]?.overallRating}/5` : 'Pending'}
                  subtitle={
                    myReviews[0]?.overallRating
                      ? RATING_LABELS[Math.round(myReviews[0]?.overallRating)]
                      : 'Awaiting manager evaluation'
                  }
                  icon={<StarOutlined />}
                  color="var(--color-secondary)"
                  loading={myGoalsLoading}
                />
              </Col>
            </Row>

            {/* Goals Info Banner */}
            {activeCycle?.status === 'GoalSetting' && (
              <Alert
                message="Goal Setting Period is Open"
                description={`You can define and modify your targets for the ${activeCycle.cycleName} cycle until ${
                  activeCycle.goalSettingDeadline
                    ? dayjs(activeCycle.goalSettingDeadline).format('MMMM D, YYYY')
                    : 'the cycle moves forward'
                }. Ensure your total weightage sums to 100%.`}
                type="info"
                showIcon
                action={
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      setEditingGoal(null)
                      goalForm.resetFields()
                      setIsGoalModalOpen(true)
                    }}
                    style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                  >
                    Add Goal
                  </Button>
                }
              />
            )}

            {/* Goals list */}
            {myGoals.length === 0 ? (
              <Empty
                image={<EmptyPerformance size={160} />}
                description="No goals configured for this appraisal cycle."
              >
                {activeCycle?.status === 'GoalSetting' && (
                  <Button type="primary" onClick={() => setIsGoalModalOpen(true)}>
                    Create First Goal
                  </Button>
                )}
              </Empty>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myGoals.map((goal) => {
                  const actual = parseFloat(goal.actualValue) || 0
                  const target = parseFloat(goal.targetValue) || 1
                  const progress = Math.min(100, Math.round((actual / target) * 100))

                  return (
                    <motion.div
                      key={goal.goalId}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                    >
                      <Card
                        style={{
                          background: 'var(--color-card-bg-elevated)',
                          borderRadius: 'var(--radius-lg)',
                          border: 'var(--border-glass)',
                          boxShadow: 'var(--shadow-xs)',
                        }}
                        actions={
                          (activeCycle?.status === 'GoalSetting' || activeCycle?.status === 'Review')
                            ? [
                                activeCycle?.status === 'GoalSetting' && (
                                  <Tooltip title="Edit Goal">
                                    <EditOutlined
                                      key="edit"
                                      onClick={() => {
                                        setEditingGoal(goal)
                                        goalForm.setFieldsValue(goal)
                                        setIsGoalModalOpen(true)
                                      }}
                                    />
                                  </Tooltip>
                                ),
                                activeCycle?.status === 'GoalSetting' && (
                                  <Popconfirm
                                    title="Delete Goal"
                                    description="Are you sure you want to delete this OKR?"
                                    onConfirm={() => goalDeleteMutation.mutate(goal.goalId)}
                                    okText="Yes"
                                    cancelText="No"
                                  >
                                    <DeleteOutlined key="delete" style={{ color: 'var(--color-danger)' }} />
                                  </Popconfirm>
                                ),
                                activeCycle?.status === 'Review' && (
                                  <Button
                                    type="link"
                                    icon={<AuditOutlined />}
                                    onClick={() => {
                                      setReviewingGoal(goal)
                                      goalReviewForm.setFieldsValue({
                                        actualValue: goal.actualValue,
                                        selfRating: goal.selfRating,
                                      })
                                      setIsGoalReviewModalOpen(true)
                                    }}
                                  >
                                    Self Rating
                                  </Button>
                                ),
                              ].filter(Boolean)
                            : undefined
                        }
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <Tag color="var(--color-primary)" className="font-bold">
                              Weight: {goal.weightage}%
                            </Tag>
                            <h4 className="font-bold text-base mt-2 text-[var(--color-text-primary)]">
                              {goal.goalTitle}
                            </h4>
                          </div>
                          <Tag
                            color={
                              goal.status === 'Completed'
                                ? 'success'
                                : goal.status === 'In Review'
                                ? 'warning'
                                : 'processing'
                            }
                          >
                            {goal.status}
                          </Tag>
                        </div>

                        <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                          {goal.description || 'No description provided.'}
                        </p>

                        <div className="mt-4 space-y-3">
                          <div>
                            <div className="flex justify-between text-xs font-semibold text-[var(--color-text-muted)]">
                              <span>KPI Target: {goal.kpi || 'Not specified'}</span>
                              <span>
                                {goal.actualValue || 0} / {goal.targetValue || 0}
                              </span>
                            </div>
                            <Progress
                              percent={progress}
                              strokeColor="var(--color-accent)"
                              trailColor="rgba(16, 17, 63, 0.08)"
                              size="small"
                              className="mt-1"
                            />
                          </div>

                          <Row gutter={16} className="bg-black/5 dark:bg-white/5 p-2 rounded">
                            <Col span={12}>
                              <span className="block text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                                Self Rating
                              </span>
                              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                                {goal.selfRating ? `${goal.selfRating}/5` : 'Not Rated'}
                              </span>
                            </Col>
                            <Col span={12}>
                              <span className="block text-[10px] text-[var(--color-text-muted)] font-bold uppercase">
                                Manager Rating
                              </span>
                              <span className="text-xs font-bold text-[var(--color-accent)]">
                                {goal.managerRating ? `${goal.managerRating}/5` : 'Pending'}
                              </span>
                            </Col>
                          </Row>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </TabPane>

        {/* ─── TAB 2: TEAM REVIEW ──────────────────────────────────────────────── */}
        {(isManager || isAdmin) && (
          <TabPane
            tab={
              <span>
                <UserOutlined /> Team Evaluator
              </span>
            }
            key="team-eval"
          >
            <div className="space-y-6">
              {/* Member Selector */}
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-[var(--color-text-secondary)]">
                  Select Team Member:
                </span>
                <Select
                  value={selectedTeamMemberId}
                  onChange={setSelectedTeamMemberId}
                  style={{ width: 280 }}
                  placeholder="Select employee"
                >
                  {teamMembers.map((emp) => (
                    <Select.Option key={emp.employeeId} value={emp.employeeId}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {selectedTeamMemberId ? (
                <div className="space-y-6">
                  {/* Team Member Stats */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12}>
                      <StatCard
                        title="Goal Progress"
                        value={`${teamAvgProgress}%`}
                        subtitle="Overall weighted average of targets completed"
                        icon={<TrophyOutlined />}
                        color="var(--color-accent)"
                        loading={teamGoalsLoading}
                      />
                    </Col>
                    <Col xs={24} sm={12}>
                      <StatCard
                        title="Total Configured Weightage"
                        value={`${teamTotalWeightage}/100%`}
                        subtitle="Sum of employee goal weightages"
                        icon={<SolutionOutlined />}
                        color={teamTotalWeightage === 100 ? 'green' : 'var(--color-danger)'}
                        loading={teamGoalsLoading}
                      />
                    </Col>
                  </Row>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Goal Evaluator Cards */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="font-bold text-lg text-[var(--color-text-primary)] flex items-center gap-2">
                        <TrophyOutlined /> Member Goals & Ratings
                      </h3>

                      {teamGoals.length === 0 ? (
                        <Empty description="No goals configured for this team member." />
                      ) : (
                        teamGoals.map((goal) => {
                          const actual = parseFloat(goal.actualValue) || 0
                          const target = parseFloat(goal.targetValue) || 1
                          const progress = Math.min(100, Math.round((actual / target) * 100))

                          return (
                            <Card
                              key={goal.goalId}
                              style={{
                                background: 'var(--color-card-bg-elevated)',
                                border: 'var(--border-glass)',
                              }}
                              actions={
                                activeCycle?.status === 'Review'
                                  ? [
                                      <Button
                                        type="link"
                                        icon={<StarOutlined />}
                                        onClick={() => {
                                          setReviewingGoal(goal)
                                          goalReviewForm.setFieldsValue({
                                            managerRating: goal.managerRating || 3,
                                          })
                                          setIsGoalReviewModalOpen(true)
                                        }}
                                      >
                                        Assign Rating
                                      </Button>,
                                    ]
                                  : undefined
                              }
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <Tag color="var(--color-primary)">Weight: {goal.weightage}%</Tag>
                                  <h4 className="font-bold mt-2 text-sm">{goal.goalTitle}</h4>
                                </div>
                                <Tag>{goal.status}</Tag>
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                {goal.description}
                              </p>

                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="block text-[10px] text-[var(--color-text-muted)] font-semibold">
                                    KPI Target: {goal.kpi}
                                  </span>
                                  <span className="block text-xs font-bold mt-1">
                                    Actual: {goal.actualValue || 0} / {goal.targetValue || 0}
                                  </span>
                                  <Progress
                                    percent={progress}
                                    strokeColor="var(--color-accent)"
                                    size="small"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="bg-black/5 dark:bg-white/5 p-2 rounded flex justify-around">
                                  <div>
                                    <span className="block text-[10px] text-[var(--color-text-muted)] uppercase font-bold">
                                      Self Rating
                                    </span>
                                    <span className="text-sm font-extrabold text-[var(--color-text-primary)]">
                                      {goal.selfRating ? `${goal.selfRating}/5` : '—'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] text-[var(--color-text-muted)] uppercase font-bold">
                                      Manager Rating
                                    </span>
                                    <span className="text-sm font-extrabold text-[var(--color-accent)]">
                                      {goal.managerRating ? `${goal.managerRating}/5` : 'Pending'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          )
                        })
                      )}
                    </div>

                    {/* Final Evaluation Card */}
                    <div className="lg:col-span-1 self-start">
                      <Card
                        title="Submit Overall Review"
                        style={{
                          background: 'var(--color-card-bg-elevated)',
                          border: 'var(--border-glass)',
                          position: 'sticky',
                          top: 24,
                        }}
                      >
                        <Form
                          form={reviewForm}
                          layout="vertical"
                          onFinish={handleReviewSubmit}
                          initialValues={{
                            overallRating: 3,
                            promotionRecommended: false,
                            incrementRecommended: 0,
                          }}
                        >
                          <Form.Item
                            name="overallRating"
                            label="Overall Performance Rating"
                            rules={[{ required: true }]}
                          >
                            <Rate allowHalf style={{ color: 'var(--color-accent)' }} />
                          </Form.Item>

                          <Form.Item name="strengths" label="Strengths / Key Accomplishments">
                            <TextArea rows={3} placeholder="Describe main strengths..." />
                          </Form.Item>

                          <Form.Item name="areasForImprovement" label="Areas for Development">
                            <TextArea rows={3} placeholder="Describe improvement plan..." />
                          </Form.Item>

                          <Form.Item name="trainingRecommendations" label="Training Recommended">
                            <Input placeholder="e.g. Leadership Bootcamp, AWS Certification" />
                          </Form.Item>

                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="incrementRecommended" label="Increment (%)">
                                <Input type="number" min={0} max={100} suffix="%" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name="promotionRecommended"
                                label="Promote?"
                                valuePropName="checked"
                              >
                                <Switch checkedChildren="Yes" unCheckedChildren="No" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item className="mb-0">
                            <Button
                              type="primary"
                              htmlType="submit"
                              icon={<SendOutlined />}
                              loading={reviewSubmitMutation.isLoading}
                              block
                              style={{
                                background: 'var(--color-accent)',
                                borderColor: 'var(--color-accent)',
                              }}
                            >
                              Submit Evaluation
                            </Button>
                          </Form.Item>
                        </Form>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <Empty description="No team members available." />
              )}
            </div>
          </TabPane>
        )}

        {/* ─── TAB 3: ADMIN CALIBRATION ─────────────────────────────────────────── */}
        {isAdmin && (
          <TabPane
            tab={
              <span>
                <LineChartOutlined /> Cycles & Normalization
              </span>
            }
            key="admin-cycles"
          >
            <div className="space-y-6">
              {/* Analytics Plots */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bell curve distribution simulation */}
                <Card
                  title="Bell Curve Rating Distribution"
                  style={{
                    background: 'var(--color-card-bg-elevated)',
                    border: 'var(--border-glass)',
                  }}
                >
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getBellCurveData()}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="rating" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="ActualCount" fill="var(--color-primary)" name="Actual Submissions" />
                        <Bar dataKey="TargetPercent" fill="var(--color-accent)" name="Target Distribution (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Performance Cycles Table */}
                <Card
                  title="Appraisal Cycles History"
                  style={{
                    background: 'var(--color-card-bg-elevated)',
                    border: 'var(--border-glass)',
                  }}
                >
                  <Table
                    dataSource={cycles}
                    columns={[
                      {
                        title: 'Cycle Name',
                        dataIndex: 'cycleName',
                        key: 'cycleName',
                      },
                      {
                        title: 'Type',
                        dataIndex: 'cycleType',
                        key: 'cycleType',
                        render: (type) => <span className="font-semibold text-xs">{type}</span>,
                      },
                      {
                        title: 'Start - End',
                        key: 'dates',
                        render: (_, record) => (
                          <span className="text-xs">
                            {dayjs(record.startDate).format('MM/YY')} -{' '}
                            {dayjs(record.endDate).format('MM/YY')}
                          </span>
                        ),
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => renderCycleStatusTag(status),
                      },
                    ]}
                    pagination={{ pageSize: 4 }}
                    size="small"
                  />
                </Card>
              </div>
            </div>
          </TabPane>
        )}

        {/* ─── TAB 4: PIP ──────────────────────────────────────────────────────── */}
        <TabPane
          tab={
            <span>
              <AlertOutlined /> PIP Dashboard
            </span>
          }
          key="pips"
        >
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">
                Performance Improvement Plans (PIP)
              </h3>
              {(isManager || isAdmin) && (
                <Button
                  type="primary"
                  danger
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedPip(null)
                    pipForm.resetFields()
                    setIsPipModalOpen(true)
                  }}
                >
                  Initiate PIP
                </Button>
              )}
            </div>

            {pips.length === 0 ? (
              <Empty description="No active or past Performance Improvement Plans." />
            ) : (
              <Table
                dataSource={pips}
                rowKey="pipId"
                style={{
                  background: 'var(--color-card-bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                }}
                columns={[
                  {
                    title: 'Employee',
                    dataIndex: 'employeeName',
                    key: 'employee',
                    render: (text, record) => (
                      <div>
                        <span className="font-bold block text-sm">
                          {text || `${record.employee?.firstName} ${record.employee?.lastName}`}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {record.employeeCode || record.employee?.employeeCode}
                        </span>
                      </div>
                    ),
                  },
                  {
                    title: 'Duration',
                    key: 'duration',
                    render: (_, record) => (
                      <span className="text-xs">
                        {dayjs(record.startDate).format('MMM D, YYYY')} -{' '}
                        {dayjs(record.endDate).format('MMM D, YYYY')}
                      </span>
                    ),
                  },
                  {
                    title: 'Reason',
                    dataIndex: 'reason',
                    key: 'reason',
                    ellipsis: true,
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status) => {
                      const colors = {
                        Active: 'error',
                        Completed: 'success',
                        Extended: 'warning',
                        Closed: 'default',
                        Terminated: 'magenta',
                      }
                      return <Tag color={colors[status] || 'default'}>{status}</Tag>
                    },
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_, record) => (
                      <div className="flex gap-2">
                        <Button
                          size="small"
                          onClick={() => {
                            Modal.info({
                              title: 'PIP Detailed Milestones',
                              content: (
                                <div className="space-y-3 mt-3">
                                  <div>
                                    <h5 className="font-bold text-xs uppercase text-[var(--color-text-muted)]">
                                      Areas for Improvement
                                    </h5>
                                    <p className="text-sm">{record.improvementAreas || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-xs uppercase text-[var(--color-text-muted)]">
                                      Milestones / Action Items
                                    </h5>
                                    <p className="text-sm">{record.milestones || 'Not specified'}</p>
                                  </div>
                                  {record.closedAt && (
                                    <span className="text-[10px] block text-[var(--color-text-muted)]">
                                      Closed at: {dayjs(record.closedAt).format('MMM D, YYYY HH:mm')}
                                    </span>
                                  )}
                                </div>
                              ),
                            })
                          }}
                        >
                          View Details
                        </Button>
                        {(isManager || isAdmin) && record.status === 'Active' && (
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => {
                              setSelectedPip(record)
                              pipForm.setFieldsValue({
                                improvementAreas: record.improvementAreas,
                                milestones: record.milestones,
                                status: record.status,
                              })
                              setIsPipModalOpen(true)
                            }}
                          >
                            Update
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            )}
          </div>
        </TabPane>
      </Tabs>

      {/* ─── MODAL: APPRAISAL CYCLE CONFIGURATION (HR ADMIN) ─────────────────── */}
      <Modal
        title="Configure Appraisal Cycle"
        open={isCycleModalOpen}
        onCancel={() => setIsCycleModalOpen(false)}
        footer={null}
        destroyOnClose
        className="glass-modal"
      >
        <Form form={cycleForm} layout="vertical" onFinish={handleCycleSubmit}>
          <Form.Item
            name="cycleName"
            label="Cycle Name"
            rules={[{ required: true, message: 'Cycle name required.' }]}
          >
            <Input placeholder="e.g. Annual Appraisals 2026" />
          </Form.Item>

          <Form.Item
            name="cycleType"
            label="Cycle Period Type"
            rules={[{ required: true }]}
            initialValue="Annual"
          >
            <Select>
              <Select.Option value="Annual">Annual Cycle</Select.Option>
              <Select.Option value="HalfYearly">Half-Yearly Cycle</Select.Option>
              <Select.Option value="Quarterly">Quarterly Cycle</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Cycle Duration (Start - End)"
            rules={[{ required: true, message: 'Select dates.' }]}
          >
            <DatePicker.RangePicker className="w-full" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="goalSettingDeadline" label="Goal Deadline">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="midYearDeadline" label="Mid-Year Review">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="finalReviewDeadline" label="Final Appraisal">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="status" label="Initial Status" initialValue="Draft">
            <Select>
              <Select.Option value="Draft">Draft (Private)</Select.Option>
              <Select.Option value="GoalSetting">Open for OKRs Setup</Select.Option>
              <Select.Option value="InProgress">In Progress (Execution)</Select.Option>
              <Select.Option value="Review">Appraisal Evaluation Phase</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Button onClick={() => setIsCycleModalOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={cycleMutation.isLoading}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              Configure Cycle
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── MODAL: OKR GOAL CONFIGURATION (EMPLOYEE) ───────────────────────── */}
      <Modal
        title={editingGoal ? 'Update Goal Details' : 'Add New OKR Goal'}
        open={isGoalModalOpen}
        onCancel={() => setIsGoalModalOpen(false)}
        footer={null}
        destroyOnClose
        className="glass-modal"
      >
        <Form form={goalForm} layout="vertical" onFinish={handleGoalSubmit}>
          <Form.Item
            name="goalTitle"
            label="Goal Title"
            rules={[{ required: true, message: 'Specify goal title.' }]}
          >
            <Input placeholder="e.g. Redesign leaves UI for mobile viewport" />
          </Form.Item>

          <Form.Item name="description" label="Detailed Description">
            <TextArea rows={3} placeholder="Describe the OKR, action plan, and key results..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="kpi"
                label="KPI Descriptor"
                rules={[{ required: true, message: 'Specify metric.' }]}
              >
                <Input placeholder="e.g. Mobile CSS compliance %" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="targetValue"
                label="Target Numeric Value"
                rules={[{ required: true, message: 'Specify numerical target.' }]}
              >
                <Input placeholder="e.g. 100" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="weightage"
            label="Goal Weightage (%)"
            rules={[{ required: true }]}
            initialValue={20}
          >
            <Slider min={5} max={100} step={5} marks={{ 20: '20%', 50: '50%', 100: '100%' }} />
          </Form.Item>

          <Form.Item className="mb-0 text-right mt-6">
            <Button onClick={() => setIsGoalModalOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={goalCreateMutation.isLoading || goalUpdateMutation.isLoading}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── MODAL: OKR GOAL REVIEW / RATING ─────────────────────────────────── */}
      <Modal
        title="Appraise Goal Accomplishments"
        open={isGoalReviewModalOpen}
        onCancel={() => setIsGoalReviewModalOpen(false)}
        footer={null}
        destroyOnClose
        className="glass-modal"
      >
        <Form form={goalReviewForm} layout="vertical" onFinish={handleGoalReviewSubmit}>
          <div className="mb-4">
            <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
              {reviewingGoal?.goalTitle}
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Target Value: {reviewingGoal?.targetValue} ({reviewingGoal?.kpi})
            </p>
          </div>

          {/* If Employee: Self Appraising */}
          {reviewingGoal?.employeeId === user?.employeeId ? (
            <>
              <Form.Item
                name="actualValue"
                label="Actual Accomplished Value"
                rules={[{ required: true, message: 'Enter actual values.' }]}
              >
                <Input placeholder="e.g. 95" />
              </Form.Item>

              <Form.Item name="selfRating" label="Self Rating" rules={[{ required: true }]}>
                <Slider min={1} max={5} step={1} marks={{ 1: '1/5', 3: '3/5', 5: '5/5' }} />
              </Form.Item>

              <Form.Item name="status" label="Status" initialValue="In Review">
                <Select>
                  <Select.Option value="In Review">Submit for Manager Appraisal</Select.Option>
                  <Select.Option value="Active">Keep Active</Select.Option>
                </Select>
              </Form.Item>
            </>
          ) : (
            /* If Manager: Evaluating employee */
            <>
              <div className="bg-black/5 dark:bg-white/5 p-3 rounded mb-4">
                <span className="block text-[10px] uppercase text-[var(--color-text-muted)] font-bold">
                  Employee Self-Assessment
                </span>
                <p className="text-sm font-semibold mt-1">
                  Actual Reached: {reviewingGoal?.actualValue || 'Not entered yet'}
                </p>
                <p className="text-sm font-semibold">
                  Self Rating: {reviewingGoal?.selfRating ? `${reviewingGoal.selfRating}/5` : 'Not rated yet'}
                </p>
              </div>

              <Form.Item
                name="managerRating"
                label="Assign Manager Rating"
                rules={[{ required: true }]}
              >
                <Slider min={1} max={5} step={1} marks={{ 1: '1/5', 3: '3/5', 5: '5/5' }} />
              </Form.Item>
            </>
          )}

          <Form.Item className="mb-0 text-right mt-6">
            <Button onClick={() => setIsGoalReviewModalOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={goalUpdateMutation.isLoading}
              style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              Submit Rating
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── MODAL: INITIATE / UPDATE PIP (MANAGER / ADMIN) ──────────────────── */}
      <Modal
        title={selectedPip ? 'Update PIP Milestones' : 'Initiate Performance Improvement Plan'}
        open={isPipModalOpen}
        onCancel={() => setIsPipModalOpen(false)}
        footer={null}
        destroyOnClose
        className="glass-modal"
      >
        <Form form={pipForm} layout="vertical" onFinish={handlePipSubmit}>
          {!selectedPip && (
            <>
              <Form.Item
                name="employeeId"
                label="Underperforming Employee"
                rules={[{ required: true, message: 'Select employee.' }]}
              >
                <Select placeholder="Select team member">
                  {teamMembers.map((emp) => (
                    <Select.Option key={emp.employeeId} value={emp.employeeId}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="startDate"
                    label="Plan Start Date"
                    rules={[{ required: true, message: 'Select start date.' }]}
                  >
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="endDate"
                    label="Target End Date"
                    rules={[{ required: true, message: 'Select end date.' }]}
                  >
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="reason"
                label="Reason for Initiating Plan"
                rules={[{ required: true, message: 'State performance concerns.' }]}
              >
                <TextArea rows={3} placeholder="Describe persistent performance lapses..." />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="improvementAreas"
            label="Specific Focus & Improvement Areas"
            rules={[{ required: true, message: 'State focus points.' }]}
          >
            <TextArea rows={3} placeholder="Specify development areas (e.g. delivery velocity, quality checking)..." />
          </Form.Item>

          <Form.Item
            name="milestones"
            label="Action Plan & Check-in Milestones"
            rules={[{ required: true, message: 'Set review milestones.' }]}
          >
            <TextArea rows={3} placeholder="Set week-by-week checkpoints and target milestones..." />
          </Form.Item>

          {selectedPip && (
            <Form.Item name="status" label="PIP Current Status" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="Active">Active (Ongoing)</Select.Option>
                <Select.Option value="Extended">Extended (Plan prolonged)</Select.Option>
                <Select.Option value="Completed">Completed (Passed expectations)</Select.Option>
                <Select.Option value="Closed">Closed (Ended without pass)</Select.Option>
                <Select.Option value="Terminated">Terminated (Discharged)</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item className="mb-0 text-right mt-6">
            <Button onClick={() => setIsPipModalOpen(false)} className="mr-2">
              Cancel
            </Button>
            <Button
              type="primary"
              danger
              htmlType="submit"
              loading={pipCreateMutation.isLoading || pipUpdateMutation.isLoading}
            >
              {selectedPip ? 'Update PIP' : 'Initiate PIP'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
