import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { recruitmentService } from './../services/recruitmentService'

export function usePendingApplications() {
  const [pendingApps, setPendingApps] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('Pending')

  // Rejection Modal
  const [rejectingApp, setRejectingApp] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submittingRejection, setSubmittingRejection] = useState(false)

  const loadPendingQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await recruitmentService.getPendingApplications({ status: statusFilter })
      if (res.success) {
        setPendingApps(res.data || [])
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to load pending applications.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadPendingQueue()
  }, [loadPendingQueue])

  const handleApprove = async (appId) => {
    try {
      const res = await recruitmentService.approvePendingApplication(appId)
      if (res.success) {
        message.success('Application approved. Candidate added to job opening.')
        loadPendingQueue()
      } else {
        message.error(res.errors?.[0] || 'Approve action failed.')
      }
    } catch (err) {
      console.error(err)
      message.error(err.response?.data?.errors?.[0] || 'Failed to approve application.')
    }
  }

  const handleOpenReject = (app) => {
    setRejectingApp(app)
    setRejectionReason('')
  }

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      message.warning('Please enter a reason for rejecting the application.')
      return
    }

    setSubmittingRejection(true)
    try {
      const res = await recruitmentService.rejectPendingApplication(rejectingApp.pendingAppId, {
        reason: rejectionReason
      })
      if (res.success) {
        message.success('Application rejected.')
        setRejectingApp(null)
        loadPendingQueue()
      } else {
        message.error(res.errors?.[0] || 'Rejection failed.')
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to submit rejection.')
    } finally {
      setSubmittingRejection(false)
    }
  }

  return {
    pendingApps,
    loading,
    statusFilter,
    setStatusFilter,
    rejectingApp,
    setRejectingApp,
    rejectionReason,
    setRejectionReason,
    submittingRejection,
    handleApprove,
    handleOpenReject,
    handleRejectSubmit
  }
}
