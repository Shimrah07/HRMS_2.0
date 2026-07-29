import { useState, useEffect, useMemo, useCallback } from 'react'

import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  Table, Button, Input, Select, Space, Avatar, Dropdown, Tag, message,
  Segmented, Drawer, Card, Row, Col, Tooltip, Checkbox, Spin, Empty
} from 'antd'
import {
  PlusOutlined, SearchOutlined, FilterOutlined, MoreOutlined,
  UserOutlined, EditOutlined, EyeOutlined, AppstoreOutlined,
  UnorderedListOutlined, PhoneOutlined, MailOutlined, CalendarOutlined,
  EnvironmentOutlined, TeamOutlined, CloseOutlined, ProfileOutlined,
  DownloadOutlined, ClearOutlined, BankOutlined, FileTextOutlined,
  DollarOutlined, ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { employeeService } from '../../services/employeeService'
import { organizationService } from '../../services/organizationService'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import PermissionGuard from '../../components/common/PermissionGuard'
import EmptyState from '../../components/common/EmptyState'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import { EMPLOYMENT_STATUS, EMPLOYMENT_TYPE, WORK_MODE, PAYROLL_GROUP } from '../../constants/enums'
import useUIStore from '../../store/uiStore'
import { getAvatarUrl } from '../../constants/api'

// ── Brand-palette hash-based avatar color — stable per employee name ──
const AVATAR_PALETTE = [
  'linear-gradient(135deg, #10113F 0%, #1e1f6a 100%)',  // Navy
  'linear-gradient(135deg, #861630 0%, #a82041 100%)',  // Burgundy
  'linear-gradient(135deg, #4D1B3B 0%, #6e2754 100%)',  // Plum
  'linear-gradient(135deg, #FAA71A 0%, #f7c358 100%)',  // Gold
  'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)',  // Navy→Plum
  'linear-gradient(135deg, #861630 0%, #4D1B3B 100%)',  // Burgundy→Plum
]
const AVATAR_TEXT_COLOR = ['#ffffff', '#ffffff', '#ffffff', '#10113F', '#ffffff', '#ffffff']

function hashAvatarIndex(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  return Math.abs(hash) % AVATAR_PALETTE.length
}

// ── Helper to flatten department hierarchies ──
const flattenDepts = (depts) => {
  const result = []
  const walk = (arr) => arr.forEach((d) => { result.push(d); if (d.children) walk(d.children) })
  walk(depts || [])
  return result
}

export default function EmployeeListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isDarkMode } = useUIStore()
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const filters = useMemo(() => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const search = searchParams.get('search') || ''
    const deptId = searchParams.get('deptId') || undefined
    const locationId = searchParams.get('locationId') || undefined
    const status = searchParams.get('status') || undefined
    const reportingManagerId = searchParams.get('reportingManagerId') || undefined

    const type = searchParams.getAll('type').filter(Boolean)
    const gradeId = searchParams.getAll('gradeId').filter(Boolean)
    const workMode = searchParams.getAll('workMode').filter(Boolean)
    const shiftId = searchParams.getAll('shiftId').filter(Boolean)
    const payrollGroup = searchParams.getAll('payrollGroup').filter(Boolean)
    const businessUnitId = searchParams.getAll('businessUnitId').filter(Boolean)
    const costCenterId = searchParams.getAll('costCenterId').filter(Boolean)

    return {
      page,
      pageSize,
      search,
      deptId,
      locationId,
      status,
      reportingManagerId,
      type: type.length > 0 ? type : undefined,
      gradeId: gradeId.length > 0 ? gradeId : undefined,
      workMode: workMode.length > 0 ? workMode : undefined,
      shiftId: shiftId.length > 0 ? shiftId : undefined,
      payrollGroup: payrollGroup.length > 0 ? payrollGroup : undefined,
      businessUnitId: businessUnitId.length > 0 ? businessUnitId : undefined,
      costCenterId: costCenterId.length > 0 ? costCenterId : undefined,
    }
  }, [searchParams])

  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '')

  const updateFilters = useCallback((updater) => {
    setSearchParams((prev) => {
      const page = parseInt(prev.get('page') || '1', 10)
      const pageSize = parseInt(prev.get('pageSize') || '20', 10)
      const search = prev.get('search') || ''
      const deptId = prev.get('deptId') || undefined
      const locationId = prev.get('locationId') || undefined
      const status = prev.get('status') || undefined
      const reportingManagerId = prev.get('reportingManagerId') || undefined

      const type = prev.getAll('type').filter(Boolean)
      const gradeId = prev.getAll('gradeId').filter(Boolean)
      const workMode = prev.getAll('workMode').filter(Boolean)
      const shiftId = prev.getAll('shiftId').filter(Boolean)
      const payrollGroup = prev.getAll('payrollGroup').filter(Boolean)
      const businessUnitId = prev.getAll('businessUnitId').filter(Boolean)
      const costCenterId = prev.getAll('costCenterId').filter(Boolean)

      const currentFilters = {
        page,
        pageSize,
        search,
        deptId,
        locationId,
        status,
        reportingManagerId,
        type: type.length > 0 ? type : undefined,
        gradeId: gradeId.length > 0 ? gradeId : undefined,
        workMode: workMode.length > 0 ? workMode : undefined,
        shiftId: shiftId.length > 0 ? shiftId : undefined,
        payrollGroup: payrollGroup.length > 0 ? payrollGroup : undefined,
        businessUnitId: businessUnitId.length > 0 ? businessUnitId : undefined,
        costCenterId: costCenterId.length > 0 ? costCenterId : undefined,
      }

      const nextFilters = typeof updater === 'function' ? updater(currentFilters) : updater

      const next = new URLSearchParams()
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (Array.isArray(value)) {
          value.forEach(val => {
            if (val !== undefined && val !== null && val !== '') {
              next.append(key, val)
            }
          })
        } else {
          next.set(key, value.toString())
        }
      })
      return next
    }, { replace: true })
  }, [setSearchParams])

  const [queryFilters, setQueryFilters] = useState(filters)

  useEffect(() => {
    // If page, pageSize, search, or empty filters change, update immediately
    if (
      filters.page !== queryFilters.page ||
      filters.pageSize !== queryFilters.pageSize ||
      filters.search !== queryFilters.search ||
      (!filters.deptId && !filters.locationId && !filters.status && !filters.type && !filters.gradeId && !filters.workMode && !filters.shiftId && !filters.payrollGroup && !filters.businessUnitId && !filters.costCenterId && !filters.reportingManagerId)
    ) {
      setQueryFilters(filters)
      return
    }

    const handler = setTimeout(() => {
      setQueryFilters(filters)
    }, 400)
    return () => clearTimeout(handler)
  }, [filters, queryFilters.page, queryFilters.pageSize, queryFilters.search])
  const [viewMode, setViewMode] = useState('list')
  const [previewEmpId, setPreviewEmpId] = useState(null)

  // Row selection states
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedRows, setSelectedRows] = useState([])

  // Main paginated query
  const { data, isLoading } = useQuery({
    queryKey: ['employees', queryFilters],
    queryFn: () => employeeService.getEmployees(queryFilters),
    placeholderData: keepPreviousData,
  })

  // Fetch all employees to support direct reports counting and export all
  const { data: allEmpsRes } = useQuery({
    queryKey: ['all-employees-lookup'],
    queryFn: () => employeeService.getEmployees({ pageSize: 10000 }),
  })
  const allEmployees = allEmpsRes?.data || []

  // Fetch full details of the employee being previewed in the Quick View Drawer
  const { data: fullEmpDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['employee-quick-detail', previewEmpId],
    queryFn: () => employeeService.getEmployee(previewEmpId),
    enabled: !!previewEmpId,
    select: (res) => res?.data,
  })

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: organizationService.getDepartments,
    select: (res) => res?.data || [],
  })

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: organizationService.getLocations,
    select: (res) => res?.data || [],
  })

  const { data: gradeData } = useQuery({
    queryKey: ['grades'],
    queryFn: organizationService.getGrades,
    select: (res) => res?.data || [],
  })

  const { data: buData } = useQuery({
    queryKey: ['business-units'],
    queryFn: organizationService.getBusinessUnits,
    select: (res) => res?.data || [],
  })

  const { data: ccData } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: organizationService.getCostCenters,
    select: (res) => res?.data || [],
  })

  const { data: shiftData } = useQuery({
    queryKey: ['shifts'],
    queryFn: organizationService.getShifts,
    select: (res) => res?.data || [],
  })

  const employees = data?.data || []
  const total = data?.pagination?.totalRecords ?? data?.totalCount ?? 0

  const depts = useMemo(() => flattenDepts(deptData), [deptData])

  const departmentOptions = useMemo(() => {
    return depts.map((d) => ({ value: d.deptId, label: d.deptName }))
  }, [depts])

  const locationOptions = useMemo(() => {
    return (locData || []).map((l) => ({ value: l.locationId, label: l.locationName }))
  }, [locData])

  const gradeOptions = useMemo(() => {
    return (gradeData || []).map((g) => ({ value: g.gradeId, label: g.name }))
  }, [gradeData])

  const shiftOptions = useMemo(() => {
    return (shiftData || []).map((s) => ({ value: s.shiftId, label: s.shiftName }))
  }, [shiftData])

  const businessUnitOptions = useMemo(() => {
    return (buData || []).map((b) => ({ value: b.businessUnitId, label: b.name }))
  }, [buData])

  const costCenterOptions = useMemo(() => {
    return (ccData || []).map((c) => ({ value: c.costCenterId, label: c.costCenterName }))
  }, [ccData])

  const reportingManagerOptions = useMemo(() => {
    return allEmployees.map((e) => ({
      value: e.employeeId,
      label: `${e.firstName} ${e.lastName}`,
    }))
  }, [allEmployees])

  const handleSearch = useCallback(() => {
    updateFilters((prev) => ({ ...prev, page: 1, search: searchInput }))
  }, [searchInput, updateFilters])

  // Debounce search input to filter automatically
  useEffect(() => {
    const handler = setTimeout(() => {
      updateFilters((prev) => {
        if (prev.search === searchInput) return prev
        return { ...prev, page: 1, search: searchInput || '' }
      })
    }, 300)

    return () => clearTimeout(handler)
  }, [searchInput, updateFilters])

  const handleFilter = useCallback((key, value) => {
    updateFilters((prev) => ({ ...prev, page: 1, [key]: value }))
  }, [updateFilters])

  const clearAllFilters = useCallback(() => {
    setSearchInput('')
    updateFilters({
      page: 1,
      pageSize: 20,
      search: '',
      deptId: undefined,
      locationId: undefined,
      status: undefined,
      reportingManagerId: undefined,
      type: undefined,
      gradeId: undefined,
      workMode: undefined,
      shiftId: undefined,
      payrollGroup: undefined,
      businessUnitId: undefined,
      costCenterId: undefined,
    })
  }, [updateFilters])

  const actionMenu = useCallback((record) => {
    const items = [
      { key: 'view', icon: <EyeOutlined />, label: 'View Profile', onClick: () => navigate(`/employees/${record.employeeId}`) }
    ];
    if (can(PERMISSIONS.EMPLOYEE.EDIT)) {
      items.push({ key: 'edit', icon: <EditOutlined />, label: 'Edit Profile', onClick: () => navigate(`/employees/${record.employeeId}/edit`) });
    }
    return { items };
  }, [navigate, can])

  // Export to CSV helper
  const downloadCSV = (dataToExport, filename) => {
    const headers = [
      'Employee Code', 'First Name', 'Last Name', 'Designation', 'Department',
      'Location', 'Official Email', 'Status', 'Type', 'Joining Date',
      'Grade', 'Band', 'Job Family', 'Business Unit', 'Cost Center',
      'Profit Center', 'Work Mode', 'Shift', 'Payroll Group', 'Notice Period Days'
    ]
    const csvRows = [
      headers.join(','),
      ...dataToExport.map(r => [
        `"${r.employeeCode || ''}"`,
        `"${r.firstName || ''}"`,
        `"${r.lastName || ''}"`,
        `"${r.designationTitle || ''}"`,
        `"${r.departmentName || ''}"`,
        `"${r.locationName || ''}"`,
        `"${r.officialEmail || ''}"`,
        `"${r.employmentStatus || ''}"`,
        `"${r.employmentType || ''}"`,
        `"${r.joiningDate ? new Date(r.joiningDate).toLocaleDateString('en-IN') : ''}"`,
        `"${r.gradeCode || ''}"`,
        `"${r.bandCode || ''}"`,
        `"${r.jobFamilyName || ''}"`,
        `"${r.businessUnitName || ''}"`,
        `"${r.costCenterName || ''}"`,
        `"${r.profitCenterName || ''}"`,
        `"${r.workMode || ''}"`,
        `"${r.shiftName || ''}"`,
        `"${r.payrollGroup || ''}"`,
        `"${r.noticePeriodDays || 0}"`
      ].join(','))
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleExportSelected = () => {
    if (selectedRows.length === 0) {
      message.warning('No employees selected.')
      return
    }
    downloadCSV(selectedRows, `selected_employees_${new Date().toISOString().slice(0, 10)}.csv`)
    message.success(`Exported ${selectedRows.length} employees successfully.`)
  }

  const handleExportAll = async () => {
    try {
      message.loading({ content: 'Fetching complete employee list for export...', key: 'exportAll' })
      const res = await employeeService.getEmployees({ pageSize: 10000 })
      const allData = res?.data || []
      if (allData.length === 0) {
        message.warning({ content: 'No employees to export.', key: 'exportAll' })
        return
      }
      downloadCSV(allData, `all_employees_${new Date().toISOString().slice(0, 10)}.csv`)
      message.success({ content: 'Export complete!', key: 'exportAll' })
    } catch (err) {
      message.error({ content: 'Failed to export employees.', key: 'exportAll' })
    }
  }

  const handleClearSelection = () => {
    setSelectedRowKeys([])
    setSelectedRows([])
  }

  const columns = useMemo(() => [
    {
      title: 'Employee',
      dataIndex: 'employeeId',
      key: 'employee',
      width: 240,
      sorter: (a, b) => {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase()
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase()
        return nameA.localeCompare(nameB)
      },
      render: (_, r) => {
        const initials = `${r.firstName || ''}${r.lastName || ''}`
        const idx = hashAvatarIndex(initials)
        return (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => navigate(`/employees/${r.employeeId}`)}
          >
            <Avatar
              size={38}
              src={getAvatarUrl(r.profilePhoto)}
              style={{
                background: AVATAR_PALETTE[idx],
                color: AVATAR_TEXT_COLOR[idx],
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
                border: isDarkMode ? '2px solid rgba(160, 90, 255, 0.35)' : '2px solid rgba(16,17,63,0.1)',
              }}
            >
              {r.firstName?.[0]}{r.lastName?.[0]}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>
                {r.firstName} {r.lastName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{r.employeeCode}</div>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Employee Code',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 140,
      sorter: (a, b) => (a.employeeCode || '').localeCompare(b.employeeCode || ''),
      render: (v) => <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 500, color: 'var(--color-text-primary)' }}>{v}</span>
    },
    {
      title: 'Designation',
      dataIndex: 'designationTitle',
      key: 'designation',
      width: 170,
      ellipsis: true,
      render: (v) => <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{v || '—'}</span>
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'department',
      width: 170,
      ellipsis: true,
      sorter: (a, b) => (a.departmentName || '').localeCompare(b.departmentName || ''),
      render: (v) => <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{v || '—'}</span>
    },
    {
      title: 'Reporting Manager',
      key: 'reportingManager',
      width: 180,
      ellipsis: true,
      render: (_, r) => {
        const mgr = allEmployees.find(e => e.employeeId === r.reportingManagerId)
        return mgr ? (
          <span
            style={{ color: isDarkMode ? '#FAA71A' : '#10113F', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/employees/${mgr.employeeId}`)
            }}
          >
            {mgr.firstName} {mgr.lastName}
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
        )
      }
    },
    {
      title: 'Location',
      dataIndex: 'locationName',
      key: 'location',
      width: 160,
      ellipsis: true,
      render: (v) => <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{v || '—'}</span>
    },
    {
      title: 'Type',
      dataIndex: 'employmentType',
      key: 'type',
      width: 110,
      render: (v) => <StatusBadge status={v} size="small" />
    },
    {
      title: 'Status',
      dataIndex: 'employmentStatus',
      key: 'status',
      width: 110,
      render: (v) => <StatusBadge status={v} />
    },
    {
      title: 'Work Mode',
      dataIndex: 'workMode',
      key: 'workMode',
      width: 125,
      render: (v) => v ? <Tag color="green">{WORK_MODE.find(w => w.value === v)?.label || v}</Tag> : '—'
    },
    {
      title: 'Shift',
      dataIndex: 'shiftName',
      key: 'shift',
      width: 120,
      render: (v) => v ? <Tag color="magenta">{v}</Tag> : '—'
    },
    {
      title: 'Payroll Group',
      dataIndex: 'payrollGroup',
      key: 'payrollGroup',
      width: 130,
      render: (v) => v ? <Tag color="orange">{PAYROLL_GROUP.find(p => p.value === v)?.label || v}</Tag> : '—'
    },
    {
      title: 'Cost Center',
      dataIndex: 'costCenterName',
      key: 'costCenter',
      width: 145,
      render: (v) => <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{v || '—'}</span>
    },
    {
      title: 'Joined',
      dataIndex: 'joiningDate',
      key: 'joining',
      width: 120,
      sorter: (a, b) => new Date(a.joiningDate || 0) - new Date(b.joiningDate || 0),
      render: (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Dropdown menu={actionMenu(record)} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} style={{ borderRadius: 6 }} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ], [navigate, allEmployees, isDarkMode, actionMenu])

  // Detect active filters
  const hasActiveFilters = filters.search || filters.deptId || filters.locationId || filters.status || filters.type || filters.reportingManagerId || filters.gradeId || filters.workMode || filters.shiftId || filters.payrollGroup || filters.businessUnitId || filters.costCenterId

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative', minHeight: 'calc(100vh - 120px)' }}>
      <PageHeader
        title="Employees"
        subtitle={`${total.toLocaleString()} total employees`}
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Employees' }]}
        actions={
          <Space>
            <PermissionGuard permission={PERMISSIONS.EMPLOYEE.EXPORT}>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportAll}
                style={{ borderRadius: 8, fontWeight: 500 }}
              >
                Export All (CSV)
              </Button>
            </PermissionGuard>
            <PermissionGuard permission={PERMISSIONS.EMPLOYEE.CREATE}>
              {can(PERMISSIONS.EMPLOYEE.CREATE) && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/employees/new')}
                  style={{ background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', borderRadius: 8, fontWeight: 600 }}
                >
                  Add Employee
                </Button>
              )}
            </PermissionGuard>
          </Space>
        }
      />

      {/* Filter Bar */}
      <div
        style={{
          background: 'var(--color-card-bg)',
          borderRadius: 16,
          border: 'var(--border-glass)',
          padding: '16px 20px',
          marginBottom: 20,
          boxShadow: 'var(--shadow-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <Input
            placeholder="Search name, code, email..."
            prefix={<SearchOutlined style={{ color: 'rgba(16,17,63,0.35)' }} />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            style={{ flex: '1 1 220px', maxWidth: 380, height: 40, borderRadius: 8 }}
          />
          <Select
            key="select-dept"
            showSearch
            placeholder="Department"
            allowClear
            value={filters.deptId || undefined}
            style={{ width: 160, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('deptId', v)}
            options={departmentOptions}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-loc"
            showSearch
            placeholder="Location"
            allowClear
            value={filters.locationId || undefined}
            style={{ width: 140, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('locationId', v)}
            options={locationOptions}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-status"
            showSearch
            placeholder="Status"
            allowClear
            value={filters.status || undefined}
            style={{ width: 130, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('status', v)}
            options={EMPLOYMENT_STATUS}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-type"
            mode="multiple"
            maxTagCount="responsive"
            showSearch
            placeholder="Type"
            allowClear
            value={filters.type || []}
            style={{ minWidth: 140, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('type', v)}
            options={EMPLOYMENT_TYPE}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-grade"
            mode="multiple"
            maxTagCount="responsive"
            showSearch
            placeholder="Grade"
            allowClear
            value={filters.gradeId || []}
            style={{ minWidth: 120, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('gradeId', v)}
            options={gradeOptions}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-workmode"
            mode="multiple"
            maxTagCount="responsive"
            showSearch
            placeholder="Work Mode"
            allowClear
            value={filters.workMode || []}
            style={{ minWidth: 130, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('workMode', v)}
            options={WORK_MODE}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-shift"
            mode="multiple"
            maxTagCount="responsive"
            showSearch
            placeholder="Shift"
            allowClear
            value={filters.shiftId || []}
            style={{ minWidth: 130, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('shiftId', v)}
            options={shiftOptions}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-payroll"
            mode="multiple"
            maxTagCount="responsive"
            showSearch
            placeholder="Payroll Group"
            allowClear
            value={filters.payrollGroup || []}
            style={{ minWidth: 140, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('payrollGroup', v)}
            options={PAYROLL_GROUP}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-bu"
            mode="multiple"
            maxTagCount="responsive"
            showSearch
            placeholder="Business Unit"
            allowClear
            value={filters.businessUnitId || []}
            style={{ minWidth: 160, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('businessUnitId', v)}
            options={businessUnitOptions}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-cc"
            mode="multiple"
            maxTagCount="responsive"
            showSearch
            placeholder="Cost Center"
            allowClear
            value={filters.costCenterId || []}
            style={{ minWidth: 160, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('costCenterId', v)}
            options={costCenterOptions}
            optionFilterProp="label"
            virtual={true}
          />
          <Select
            key="select-reporting-mgr"
            showSearch
            placeholder="Reporting Manager"
            allowClear
            value={filters.reportingManagerId || undefined}
            style={{ width: 180, height: 40, borderRadius: 8 }}
            onChange={(v) => handleFilter('reportingManagerId', v)}
            options={reportingManagerOptions}
            optionFilterProp="label"
            virtual={true}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} style={{ height: 40, borderRadius: 8 }}>
            Search
          </Button>
          {hasActiveFilters && (
            <Button icon={<ClearOutlined />} onClick={clearAllFilters} type="dashed" style={{ height: 40, borderRadius: 8 }}>
              Clear
            </Button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'list', label: 'List', icon: <UnorderedListOutlined /> },
              { value: 'grid', label: 'Grid', icon: <AppstoreOutlined /> },
            ]}
            style={{ borderRadius: 8 }}
          />
        </div>
      </div>

      {/* Grid View or Table View */}
      {viewMode === 'grid' ? (
        <div style={{ marginBottom: 80 }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
          ) : employees.length === 0 ? (
            <EmptyState variant="employees" action={can(PERMISSIONS.EMPLOYEE.CREATE) ? () => navigate('/employees/new') : undefined} actionLabel="Add Employee" />
          ) : (
            <Row gutter={[16, 16]}>
              {employees.map((r) => {
                const isSelected = selectedRowKeys.includes(r.employeeId)
                return (
                  <Col xs={24} sm={12} md={12} lg={8} key={r.employeeId}>
                    <motion.div
                      whileHover={{ y: -6, scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      style={{ height: '100%' }}
                    >
                      <Card
                        hoverable
                        style={{
                          borderRadius: 16,
                          overflow: 'hidden',
                          position: 'relative',
                          border: isSelected ? '2px solid #FAA71A' : 'var(--border-glass)',
                          background: 'var(--color-card-bg)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: isSelected ? '0 0 15px rgba(250, 167, 26, 0.25)' : 'var(--shadow-subtle)'
                        }}
                        bodyStyle={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}
                      >
                        {/* Checkbox for Row Selection */}
                        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              const checked = e.target.checked
                              if (checked) {
                                setSelectedRowKeys(prev => [...prev, r.employeeId])
                                setSelectedRows(prev => [...prev, r])
                              } else {
                                setSelectedRowKeys(prev => prev.filter(id => id !== r.employeeId))
                                setSelectedRows(prev => prev.filter(row => row.employeeId !== r.employeeId))
                              }
                            }}
                          />
                        </div>

                        {/* Top Cover Gradient */}
                        <div
                          style={{
                            height: 60,
                            background: isDarkMode
                              ? 'linear-gradient(135deg, #0a0c2e 0%, #4D1B3B 100%)'
                              : 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 0,
                          }}
                        />

                        {/* Card Content */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, marginTop: 10, flex: 1 }}>
                          <Avatar
                            size={68}
                            src={getAvatarUrl(r.profilePhoto)}
                            onClick={() => setPreviewEmpId(r.employeeId)}
                            style={{
                              border: '3px solid var(--color-card-bg)',
                              background: AVATAR_PALETTE[hashAvatarIndex(`${r.firstName || ''}${r.lastName || ''}`)],
                              color: AVATAR_TEXT_COLOR[hashAvatarIndex(`${r.firstName || ''}${r.lastName || ''}`)],
                              fontSize: 24,
                              fontWeight: 700,
                              boxShadow: 'var(--shadow-medium)',
                              cursor: 'pointer',
                              transition: 'transform 0.2s'
                            }}
                          >
                            {r.firstName?.[0]}{r.lastName?.[0]}
                          </Avatar>

                          <div style={{ textAlign: 'center', marginTop: 12 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              {r.firstName} {r.lastName}
                            </h3>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{r.employeeCode}</div>
                          </div>

                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
                            <StatusBadge status={r.employmentStatus} size="small" />
                            <StatusBadge status={r.employmentType} size="small" />
                          </div>

                          <div style={{ width: '100%', height: 1, background: isDarkMode ? 'rgba(160, 90, 255, 0.18)' : 'rgba(16,17,63,0.07)', margin: '16px 0' }} />

                          <div style={{ width: '100%', fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>Role:</span>
                              <Tooltip title={r.designationTitle}>
                                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '70%' }}>
                                  {r.designationTitle || '—'}
                                </span>
                              </Tooltip>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>Department:</span>
                              <Tooltip title={r.departmentName}>
                                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '70%' }}>
                                  {r.departmentName || '—'}
                                </span>
                              </Tooltip>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>Location:</span>
                              <Tooltip title={r.locationName}>
                                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '70%' }}>
                                  {r.locationName || '—'}
                                </span>
                              </Tooltip>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>Manager:</span>
                              {(() => {
                                const mgr = allEmployees.find(e => e.employeeId === r.reportingManagerId)
                                return mgr ? (
                                  <Tooltip title={`${mgr.firstName} ${mgr.lastName}`}>
                                    <span
                                      style={{ fontWeight: 600, color: isDarkMode ? '#FAA71A' : '#10113F', cursor: 'pointer', textDecoration: 'underline', textAlign: 'right', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '70%' }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/employees/${mgr.employeeId}`)
                                      }}
                                    >
                                      {mgr.firstName} {mgr.lastName}
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <span style={{ color: 'var(--color-text-muted)', textAlign: 'right' }}>—</span>
                                )
                              })()}
                            </div>
                          </div>

                          <div style={{ width: '100%', display: 'flex', gap: 8, marginTop: 16 }}>
                            <Button
                              style={{ flex: 1, borderRadius: 8 }}
                              onClick={() => setPreviewEmpId(r.employeeId)}
                              icon={<EyeOutlined />}
                            >
                              Quick View
                            </Button>
                            <Button
                              type="primary"
                              style={{ flex: 1, borderRadius: 8, background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff' }}
                              onClick={() => navigate(`/employees/${r.employeeId}`)}
                              icon={<ProfileOutlined />}
                            >
                              Profile
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </Col>
                )
              })}
            </Row>
          )}

          {/* Grid Pagination */}
          {!isLoading && total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, background: 'var(--color-card-bg)', border: 'var(--border-glass)', borderRadius: 12, padding: '12px 16px', boxShadow: 'var(--shadow-subtle)' }}>
              <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--color-text-secondary)', marginRight: 'auto' }}>
                {Math.min((filters.page - 1) * filters.pageSize + 1, total)}-{Math.min(filters.page * filters.pageSize, total)} of {total} employees
              </span>
              <Button
                disabled={filters.page === 1}
                onClick={() => updateFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                style={{ borderRadius: 8, marginRight: 8 }}
              >
                Previous
              </Button>
              <Button
                disabled={filters.page * filters.pageSize >= total}
                onClick={() => updateFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                style={{ borderRadius: 8 }}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div style={{ background: 'var(--color-card-bg)', borderRadius: 16, border: 'var(--border-glass)', overflow: 'hidden', boxShadow: 'var(--shadow-subtle)', marginBottom: 80 }}>
          <Table
            sticky={true}
            scroll={{ x: 1980 }}
            columns={columns}
            dataSource={employees}
            rowKey="employeeId"
            loading={isLoading}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys, rows) => {
                setSelectedRowKeys(keys)
                setSelectedRows(rows)
              }
            }}
            pagination={{
              current: filters.page,
              pageSize: filters.pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t, r) => `${r[0]}-${r[1]} of ${t} employees`,
              onChange: (page, pageSize) => updateFilters((prev) => ({ ...prev, page, pageSize })),
              style: { padding: '12px 16px' },
            }}
            locale={{ emptyText: <EmptyState title="No employees found" description="Try adjusting your filters or add a new employee." /> }}
            onRow={(record) => ({
              style: { cursor: 'pointer' },
              onClick: (e) => {
                // Ignore clicks on checkbox columns, dropdown action trigger or button
                if (
                  e.target.closest('.ant-table-selection-column') ||
                  e.target.closest('.ant-checkbox-wrapper') ||
                  e.target.closest('.ant-dropdown-trigger') ||
                  e.target.closest('.ant-btn')
                ) {
                  return
                }
                setPreviewEmpId(record.employeeId)
              },
            })}
          />
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedRowKeys.length > 0 && (
          <motion.div
            initial={{ y: 80, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 80, x: '-50%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              background: isDarkMode ? 'var(--color-card-bg-elevated)' : '#10113F',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: 14,
              boxShadow: isDarkMode ? '0 10px 32px rgba(5, 2, 20, 0.7)' : '0 10px 32px rgba(16, 17, 63, 0.45)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              border: 'var(--border-glass)'
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: '0.02em' }}>
              <TeamOutlined style={{ marginRight: 8, color: '#FAA71A' }} />
              {selectedRowKeys.length} Row{selectedRowKeys.length > 1 ? 's' : ''} Selected
            </span>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
            <Space size={12}>
              <PermissionGuard permission={PERMISSIONS.EMPLOYEE.EXPORT}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExportSelected}
                  style={{ background: '#FAA71A', borderColor: '#FAA71A', color: '#10113F', fontWeight: 600, borderRadius: 8 }}
                >
                  Export Selected (CSV)
                </Button>
              </PermissionGuard>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleClearSelection}
                style={{ color: '#ffffffb3', borderRadius: 8 }}
              >
                Clear Selection
              </Button>
            </Space>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick View Drawer */}
      <Drawer
        title={null}
        placement="right"
        width={420}
        onClose={() => setPreviewEmpId(null)}
        open={previewEmpId !== null}
        styles={{ body: { padding: 0, background: 'var(--color-surface)' } }}
        closable={false}
      >
        {(() => {
          const previewEmp = allEmployees.find(e => e.employeeId === previewEmpId) || employees.find(e => e.employeeId === previewEmpId)
          if (!previewEmp) return null

          const pName = `${previewEmp.firstName} ${previewEmp.middleName ? previewEmp.middleName + ' ' : ''}${previewEmp.lastName}`

          // Count direct reports from allEmployees list
          const directReportsCount = allEmployees.filter(e => e.reportingManagerId === previewEmp.employeeId).length

          return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Cover Gradient */}
              <div style={{ height: 130, background: 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)', position: 'relative', flexShrink: 0 }}>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => setPreviewEmpId(null)}
                  style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%' }}
                />
              </div>

              {/* Profile Main */}
              <div style={{ textAlign: 'center', marginTop: -50, padding: '0 24px', position: 'relative', zIndex: 2, flexShrink: 0 }}>
                <Avatar
                  size={100}
                  src={getAvatarUrl(previewEmp.profilePhoto)}
                  style={{
                    border: isDarkMode ? '4px solid var(--color-card-bg-elevated)' : '4px solid #fff',
                    background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)',
                    fontSize: 36,
                    fontWeight: 800,
                    boxShadow: 'var(--shadow-medium)',
                  }}
                >
                  {previewEmp.firstName?.[0]}{previewEmp.lastName?.[0]}
                </Avatar>

                <h2 style={{ margin: '12px 0 4px', fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {pName}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: 'monospace', fontWeight: 600 }}>{previewEmp.employeeCode}</p>

                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 }}>
                  <StatusBadge status={previewEmp.employmentStatus} />
                  <StatusBadge status={previewEmp.employmentType} />
                </div>
              </div>

              {/* Scrollable details */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {isDetailsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 12, color: 'var(--color-text-muted)' }}>Loading summary...</div>
                  </div>
                ) : (
                  <>
                    {/* Work details */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Work Information
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Designation / Role</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.designationTitle || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Department</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.departmentName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Location</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.locationName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Reporting Manager</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <UserOutlined style={{ color: '#FAA71A' }} />
                            {(() => {
                              const mgr = allEmployees.find(e => e.employeeId === previewEmp.reportingManagerId)
                              return mgr ? (
                                <span
                                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                  onClick={() => {
                                    setPreviewEmpId(null)
                                    navigate(`/employees/${mgr.employeeId}`)
                                  }}
                                >
                                  {mgr.firstName} {mgr.lastName}
                                </span>
                              ) : (
                                'Board of Directors'
                              )
                            })()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Direct Reports</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <TeamOutlined style={{ color: '#FAA71A' }} />
                            {directReportsCount} Employee{directReportsCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Date of Joining</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {previewEmp.joiningDate ? new Date(previewEmp.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Org Structure Placement */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Organizational Placement
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Business Unit</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullEmpDetails?.businessUnitName || previewEmp.businessUnitName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Division</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullEmpDetails?.divisionName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Sub-Department</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullEmpDetails?.subDeptName || '—'}</div>
                        </div>
                      </div>
                    </Card>

                    {/* Classification details */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Job Architecture
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Grade</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullEmpDetails?.gradeName || previewEmp.gradeCode || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Band / Level</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullEmpDetails?.bandName || previewEmp.bandCode || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Job Family</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullEmpDetails?.jobFamilyName || previewEmp.jobFamilyName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Job Function</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullEmpDetails?.jobFunctionName || '—'}</div>
                        </div>
                      </div>
                    </Card>

                    {/* Cost Accounting */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Cost Accounting
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Cost Center</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.costCenterName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Profit Center</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullEmpDetails?.profitCenterName || '—'}</div>
                        </div>
                      </div>
                    </Card>

                    {/* Attendance Settings */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Work & Shift Settings
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Work Mode</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.workMode || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Shift</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.shiftName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Weekly Off Pattern</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.weeklyOffPattern || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Payroll Group</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.payrollGroup || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Notice Period</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.noticePeriodDays !== undefined ? `${previewEmp.noticePeriodDays} Days` : '—'}</div>
                        </div>
                      </div>
                    </Card>

                    {/* Contact information */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Contact Details
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Official Email</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                            {previewEmp.officialEmail ? (
                              <a href={`mailto:${previewEmp.officialEmail}`} style={{ color: 'inherit', textDecoration: 'underline' }}>{previewEmp.officialEmail}</a>
                            ) : '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Personal Phone</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {previewEmp.personalPhone ? (
                              <a href={`tel:${previewEmp.personalPhone}`} style={{ color: 'inherit' }}>{previewEmp.personalPhone}</a>
                            ) : '—'}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Bank Summary */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Bank Summary
                      </h4>
                      {fullEmpDetails?.bankDetails && fullEmpDetails.bankDetails.length > 0 ? (
                        <div>
                          {fullEmpDetails.bankDetails.map((bank, index) => (
                            <div key={bank.bankDetailId || index} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: index < fullEmpDetails.bankDetails.length - 1 ? 12 : 0, borderBottom: index < fullEmpDetails.bankDetails.length - 1 ? 'var(--border-glass)' : 'none' }}>
                              <BankOutlined style={{ fontSize: 20, color: 'var(--color-text-primary)' }} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{bank.bankName} {bank.isPrimary && <Tag color="success" style={{ fontSize: 10, zoom: 0.85 }}>Primary</Tag>}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>A/C: {bank.maskedAccountNumber || '************'} · {bank.accountType}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <BankOutlined />
                          No bank accounts configured
                        </div>
                      )}
                    </Card>

                    {/* Documents Summary */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Documents Summary
                      </h4>
                      {fullEmpDetails?.documents && fullEmpDetails.documents.length > 0 ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Total Uploaded:</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>{fullEmpDetails.documents.length} File(s)</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {fullEmpDetails.documents.map((doc, idx) => (
                              <Tag key={doc.docId || idx} color={doc.isVerified ? 'success' : 'warning'} style={{ borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FileTextOutlined />
                                {doc.docType} {doc.isVerified ? '✓' : '?'}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileTextOutlined />
                          No documents uploaded yet
                        </div>
                      )}
                    </Card>

                    {/* ESS Summaries (Salary and Timelines if exists) */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Compensation Summary (ESS)
                      </h4>
                      {fullEmpDetails ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Probation Period:</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {previewEmp.probationEndDate ? `Ends ${new Date(previewEmp.probationEndDate).toLocaleDateString('en-IN')}` : '—'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Salary Revision Count:</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {fullEmpDetails.salaryHistory ? `${fullEmpDetails.salaryHistory.length} Milestones` : '0'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <DollarOutlined />
                          No compensation details available
                        </div>
                      )}
                    </Card>
                  </>
                )}
              </div>

              {/* Drawer footer actions */}
              <div style={{ padding: 16, borderTop: 'var(--border-glass)', background: 'var(--color-card-bg)', display: 'flex', gap: 12, flexShrink: 0 }}>
                <Button style={{ flex: 1, borderRadius: 8 }} onClick={() => setPreviewEmpId(null)}>
                  Close
                </Button>
                <Button
                  type="primary"
                  style={{ flex: 1, borderRadius: 8, background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', fontWeight: 600 }}
                  onClick={() => {
                    setPreviewEmpId(null)
                    navigate(`/employees/${previewEmp.employeeId}`)
                  }}
                  icon={<ArrowRightOutlined />}
                >
                  Full Profile
                </Button>
              </div>
            </div>
          )
        })()}
      </Drawer>
    </motion.div>
  )
}
