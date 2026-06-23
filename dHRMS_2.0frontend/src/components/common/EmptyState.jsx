import { motion } from 'framer-motion'
import { Button } from 'antd'
import {
  EmptyEmployees,
  EmptyDocuments,
  EmptyAttendance,
  EmptyLeave,
  EmptyNotifications,
  EmptyDefault,
  EmptyLocations,
  EmptyDepartments,
  EmptyDesignations,
  EmptyRecruitment,
  EmptyPerformance,
} from './HRIllustrations'
import useUIStore from '../../store/uiStore'

const VARIANT_CONFIG = {
  employees: {
    Illustration: EmptyEmployees,
    defaultTitle: 'No employees found',
    defaultDesc: 'Try adjusting your filters or add a new employee to get started.',
    defaultActionLabel: 'Add Employee',
  },
  documents: {
    Illustration: EmptyDocuments,
    defaultTitle: 'No documents uploaded yet.',
    defaultDesc: 'Complete your employee profile by uploading required documents.',
    defaultActionLabel: 'Upload Now',
  },
  attendance: {
    Illustration: EmptyAttendance,
    defaultTitle: 'No attendance records available.',
    defaultDesc: 'Punch in to start recording your attendance and timesheets.',
    defaultActionLabel: 'Mark Attendance',
  },
  leave: {
    Illustration: EmptyLeave,
    defaultTitle: 'No leave requests found.',
    defaultDesc: 'Apply for leave to submit time off requests.',
    defaultActionLabel: 'Apply for Leave',
  },
  payroll: {
    Illustration: EmptyDefault,
    defaultTitle: 'No payslips available.',
    defaultDesc: 'Your monthly payslips will appear here once processed by HR.',
    defaultActionLabel: 'View Details',
  },
  directory: {
    Illustration: EmptyEmployees,
    defaultTitle: 'No employees in the directory.',
    defaultDesc: "Search the organization's directory to find colleagues.",
    defaultActionLabel: 'Search Colleagues',
  },
  notifications: {
    Illustration: EmptyNotifications,
    defaultTitle: 'All caught up!',
    defaultDesc: 'You have no new notifications. Check back later.',
  },
  locations: {
    Illustration: EmptyLocations,
    defaultTitle: 'No locations configured',
    defaultDesc: 'Add your office branches, headquarters, and location details.',
    defaultActionLabel: 'Add Location',
  },
  departments: {
    Illustration: EmptyDepartments,
    defaultTitle: 'No departments configured',
    defaultDesc: 'Set up your organizational structure and departments.',
    defaultActionLabel: 'Add Department',
  },
  designations: {
    Illustration: EmptyDesignations,
    defaultTitle: 'No designations configured',
    defaultDesc: 'Define job roles, hierarchy levels, and grades.',
    defaultActionLabel: 'Add Designation',
  },
  recruitment: {
    Illustration: EmptyRecruitment,
    defaultTitle: 'No recruitment data',
    defaultDesc: 'Job postings and candidate pipelines will appear here.',
    defaultActionLabel: 'Manage Jobs',
  },
  performance: {
    Illustration: EmptyPerformance,
    defaultTitle: 'No performance reviews',
    defaultDesc: 'Performance cycles and review data will appear here.',
    defaultActionLabel: 'Manage Cycle',
  },
  default: {
    Illustration: EmptyDefault,
    defaultTitle: 'No data found',
    defaultDesc: 'Nothing to show here yet.',
    defaultActionLabel: 'Get Started',
  },
}

export default function EmptyState({
  title,
  description,
  action,
  actionLabel,
  variant = 'default',
  size = 160,
}) {
  const { isDarkMode } = useUIStore()
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.default
  const { Illustration } = config
  const displayTitle = title || config.defaultTitle
  const displayDesc = description || config.defaultDesc

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '52px 24px',
        textAlign: 'center',
      }}
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          marginBottom: 28,
          opacity: isDarkMode ? 0.88 : 1,
          filter: isDarkMode ? 'brightness(0.92) saturate(0.85)' : 'none',
          transition: 'opacity 0.2s ease, filter 0.2s ease',
        }}
      >
        <Illustration size={size} />
      </motion.div>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: isDarkMode ? 'rgba(240, 244, 255, 0.92)' : '#10113F',
          letterSpacing: '-0.01em',
          transition: 'color 0.2s ease',
        }}
      >
        {displayTitle}
      </h3>

      {displayDesc && (
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 13.5,
            color: isDarkMode ? 'rgba(240, 244, 255, 0.45)' : 'rgba(16,17,63,0.5)',
            maxWidth: 320,
            lineHeight: 1.6,
            transition: 'color 0.2s ease',
          }}
        >
          {displayDesc}
        </p>
      )}

      {/* CTA */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ marginTop: 24 }}
        >
          <Button
            type="primary"
            onClick={action}
            style={{
              height: 40,
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13.5,
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
            {actionLabel || config.defaultActionLabel || 'Get Started'}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
