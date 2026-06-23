import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, List, Avatar, Tag, Popconfirm, message, Switch, Space } from 'antd'
import { BellOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { notificationService } from '../../services/notificationService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import useUIStore from '../../store/uiStore'

dayjs.extend(relativeTime)

const NOTIF_ICONS = {
  LeaveApprovalRequired: '📋',
  LeaveStatusUpdated: '✅',
  PayrollRunInitiated: '💸',
  PayrollApproved: '✅',
  SalarySlipReady: '📄',
  AttendanceRegularization: '🕐',
  InterviewScheduled: '📅',
  NewJoinerToday: '👋',
  ResignationSubmitted: '📝',
  ProbationEndingSoon: '⏰',
  General: '🔔',
  System: '⚙️',
}

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { isDarkMode } = useUIStore()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => notificationService.getNotifications(false),
    select: (res) => res?.data || [],
  })

  const markReadMutation = useMutation({
    mutationFn: notificationService.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => {
      message.success('All notifications marked as read')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const clearAllMutation = useMutation({
    mutationFn: notificationService.clearAll,
    onSuccess: () => {
      message.success('All notifications cleared')
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unread = (data || []).filter((n) => !n.isRead).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread notifications` : 'All caught up!'}
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Notifications' }]}
        actions={
          <Space>
            {unread > 0 && (
              <Button onClick={() => markAllMutation.mutate()} loading={markAllMutation.isPending}
                icon={<CheckOutlined />} style={{ borderRadius: 8 }}>
                Mark All Read
              </Button>
            )}
            {data?.length > 0 && (
              <Popconfirm title="Clear all notifications?" onConfirm={() => clearAllMutation.mutate()}>
                <Button danger loading={clearAllMutation.isPending}
                  icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>
                  Clear All
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      />

      <div style={{ background: 'var(--color-card-bg)', borderRadius: 12, border: 'var(--border-glass)', overflow: 'hidden' }}>
        {!data?.length && !isLoading ? (
          <EmptyState variant="notifications" />
        ) : (
          <List
            loading={isLoading}
            dataSource={data || []}
            renderItem={(notif) => (
              <List.Item
                key={notif.notificationId}
                style={{
                  padding: '16px 20px',
                  background: notif.isRead ? 'transparent' : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(16,17,63,0.02)'),
                  borderLeft: notif.isRead ? '3px solid transparent' : (isDarkMode ? '3px solid #FAA71A' : '3px solid #10113F'),
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (notif.isRead) e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#FAFAFA' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = notif.isRead ? 'transparent' : (isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(16,17,63,0.02)') }}
                onClick={() => { if (!notif.isRead) markReadMutation.mutate(notif.notificationId) }}
                actions={[
                  <Popconfirm key="delete" title="Delete this notification?" onConfirm={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.notificationId) }}>
                    <Button size="small" type="text" icon={<DeleteOutlined />} danger onClick={(e) => e.stopPropagation()} />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(16,17,63,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {NOTIF_ICONS[notif.notificationType] || '🔔'}
                    </div>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: notif.isRead ? 400 : 700, color: 'var(--color-text-primary)' }}>{notif.title}</span>
                      {!notif.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: isDarkMode ? '#FAA71A' : '#10113F', flexShrink: 0 }} />}
                    </div>
                  }
                  description={
                    <div>
                      <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 13 }}>{notif.message}</p>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{dayjs(notif.createdAt).fromNow()}</span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </motion.div>
  )
}
