import { useState, useMemo } from 'react'
import { Input, Select, Avatar, Tag, Spin, Row, Col, Badge, Drawer, Card, Button, Divider, Descriptions, Space } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SearchOutlined, UserOutlined, TeamOutlined, EnvironmentOutlined,
  PhoneOutlined, MailOutlined, ApartmentOutlined, CloseOutlined,
  ArrowRightOutlined, DollarOutlined, BankOutlined, FileTextOutlined,
  SafetyOutlined, CalendarOutlined, GlobalOutlined, InfoCircleOutlined
} from '@ant-design/icons'
import { employeeService } from '../../services/employeeService'
import { organizationService } from '../../services/organizationService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import useUIStore from '../../store/uiStore'
import { getAvatarUrl } from '../../constants/api'

// Avatar background gradient palette
const PALETTE = [
  ['linear-gradient(135deg,#10113F,#2d2f82)', '#fff'],
  ['linear-gradient(135deg,#861630,#a82041)', '#fff'],
  ['linear-gradient(135deg,#4D1B3B,#6e2754)', '#fff'],
  ['linear-gradient(135deg,#FAA71A,#f7c358)', '#10113F'],
  ['linear-gradient(135deg,#10113F,#4D1B3B)', '#fff'],
]

function hashIdx(s = '') {
  let h = 0; for (let i = 0; i < s.length; i++) { h = s.charCodeAt(i) + ((h << 5) - h); h = h & h }
  return Math.abs(h) % PALETTE.length
}

const statusBg = {
  Active: '#f6ffed', OnNotice: '#fff7e6', Separated: '#fff1f0', Suspended: '#f9f0ff', OnLeave: '#e6f7ff', Absconding: '#fff1f0'
}
const statusColor = {
  Active: '#52c41a', OnNotice: '#fa8c16', Separated: '#ff4d4f', Suspended: '#722ed1', OnLeave: '#1677ff', Absconding: '#cf1322'
}

export default function DirectoryPage() {
  const navigate = useNavigate()
  const { isDarkMode } = useUIStore()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState(null)
  const [filterDesig, setFilterDesig] = useState(null)
  const [filterLoc, setFilterLoc] = useState(null)
  const [filterManager, setFilterManager] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)

  // Quick View Drawer state
  const [previewEmpId, setPreviewEmpId] = useState(null)

  // Fetch all employees
  const { data: empRes, isLoading } = useQuery({
    queryKey: ['employee-directory-all'],
    queryFn: () => employeeService.getEmployees({ pageSize: 10000 }),
  })

  // Fetch departments, designations, locations
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: organizationService.getDepartments,
    select: (r) => r?.data || [],
  })

  const { data: desigData } = useQuery({
    queryKey: ['designations'],
    queryFn: organizationService.getDesignations,
    select: (r) => r?.data || [],
  })

  const { data: locData } = useQuery({
    queryKey: ['locations'],
    queryFn: organizationService.getLocations,
    select: (r) => r?.data || [],
  })

  // Fetch detailed employee info for the drawer
  const { data: fullEmpDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['employee-directory-detail', previewEmpId],
    queryFn: () => employeeService.getEmployee(previewEmpId),
    enabled: !!previewEmpId,
    select: (res) => res?.data,
  })

  const allEmployees = empRes?.data || []

  const flattenDepts = (arr) => {
    const r = []
    const walk = (a) => a?.forEach((d) => { r.push(d); if (d.children) walk(d.children) })
    walk(arr)
    return r
  }
  const flatDepts = useMemo(() => flattenDepts(deptData), [deptData])

  // Filter options lists
  const managerOptions = useMemo(() => {
    const managers = allEmployees
      .filter((e) => allEmployees.some((sub) => sub.reportingManagerId === e.employeeId))
    return managers.map((m) => ({ value: m.employeeId, label: `${m.firstName} ${m.lastName}` }))
  }, [allEmployees])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allEmployees.filter((e) => {
      const matchSearch = !q ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        (e.employeeCode || '').toLowerCase().includes(q) ||
        (e.officialEmail || '').toLowerCase().includes(q) ||
        (e.designationTitle || '').toLowerCase().includes(q) ||
        (e.departmentName || '').toLowerCase().includes(q) ||
        (e.locationName || '').toLowerCase().includes(q)
      const matchDept = !filterDept || e.deptId === filterDept
      const matchDesig = !filterDesig || e.designationId === filterDesig
      const matchLoc = !filterLoc || e.locationId === filterLoc
      const matchManager = !filterManager || e.reportingManagerId === filterManager
      const matchStatus = !filterStatus || e.employmentStatus === filterStatus
      return matchSearch && matchDept && matchDesig && matchLoc && matchManager && matchStatus
    })
  }, [allEmployees, search, filterDept, filterDesig, filterLoc, filterManager, filterStatus])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Employee Directory"
        subtitle={`${filtered.length} employee${filtered.length !== 1 ? 's' : ''} found`}
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Employees', path: '/employees' }, { label: 'Directory' }]}
      />

      {/* Advanced Filter Bar */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, padding: '16px 20px',
        background: 'var(--color-card-bg)', borderRadius: 14, border: 'var(--border-glass)',
        boxShadow: 'var(--shadow-subtle)'
      }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
          placeholder="Search name, code, email, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, borderRadius: 10, height: 42 }}
        />
        <Select
          allowClear placeholder="Department" value={filterDept} onChange={setFilterDept}
          options={flatDepts.map((d) => ({ value: d.deptId, label: d.deptName }))}
          style={{ minWidth: 150, borderRadius: 10, height: 42 }} showSearch optionFilterProp="label"
        />
        <Select
          allowClear placeholder="Designation" value={filterDesig} onChange={setFilterDesig}
          options={(desigData || []).map((d) => ({ value: d.designationId, label: d.title }))}
          style={{ minWidth: 150, borderRadius: 10, height: 42 }} showSearch optionFilterProp="label"
        />
        <Select
          allowClear placeholder="Location" value={filterLoc} onChange={setFilterLoc}
          options={(locData || []).map((l) => ({ value: l.locationId, label: l.locationName }))}
          style={{ minWidth: 140, borderRadius: 10, height: 42 }} showSearch optionFilterProp="label"
        />
        <Select
          allowClear placeholder="Manager" value={filterManager} onChange={setFilterManager}
          options={managerOptions}
          style={{ minWidth: 160, borderRadius: 10, height: 42 }} showSearch optionFilterProp="label"
        />
        <Select
          allowClear placeholder="Status" value={filterStatus} onChange={setFilterStatus}
          options={[
            { value: 'Active', label: 'Active' },
            { value: 'OnNotice', label: 'On Notice' },
            { value: 'OnLeave', label: 'On Leave' },
            { value: 'Separated', label: 'Separated' }
          ]}
          style={{ minWidth: 120, borderRadius: 10, height: 42 }}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No employees found" description="Try adjusting your filters or search term." />
      ) : (
        <Row gutter={[16, 16]}>
          {filtered.map((emp) => {
            const idx = hashIdx(emp.employeeId)
            const [bg, color] = PALETTE[idx]
            const fullName = `${emp.firstName} ${emp.lastName}`
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={emp.employeeId}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={() => setPreviewEmpId(emp.employeeId)}
                  style={{
                    cursor: 'pointer',
                    background: 'var(--color-card-bg)',
                    border: 'var(--border-glass)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-subtle)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}>
                  {/* Card accent bar */}
                  <div style={{ height: 4, background: isDarkMode ? 'linear-gradient(90deg, #FAA71A, #10113F)' : 'linear-gradient(90deg, #10113F, #FAA71A)' }} />

                  {/* Card body */}
                  <div style={{ padding: '20px 18px 18px' }}>
                    {/* Avatar + status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                      <Avatar size={52} src={getAvatarUrl(emp.profilePhoto)}
                        style={{ background: bg, color, fontSize: 18, fontWeight: 800, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}>
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </Avatar>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{fullName}</div>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 2 }}>{emp.employeeCode}</div>
                        <div style={{ marginTop: 6 }}>
                          <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: isDarkMode ? `${statusColor[emp.employmentStatus] || '#52c41a'}20` : statusBg[emp.employmentStatus] || '#f6ffed', color: statusColor[emp.employmentStatus] || '#52c41a' }}>
                            {emp.employmentStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: 'var(--border-glass)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ApartmentOutlined style={{ color: '#FAA71A', fontSize: 12, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          <strong>{emp.designationTitle}</strong>
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TeamOutlined style={{ color: '#FAA71A', fontSize: 12, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{emp.departmentName}</span>
                      </div>
                      {emp.locationName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <EnvironmentOutlined style={{ color: '#FAA71A', fontSize: 12, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{emp.locationName}</span>
                        </div>
                      )}
                      {emp.officialEmail && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <MailOutlined style={{ color: '#FAA71A', fontSize: 12, flexShrink: 0 }} />
                          <a href={`mailto:${emp.officialEmail}`} onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: 11, color: isDarkMode ? '#FAA71A' : '#10113F', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {emp.officialEmail}
                          </a>
                        </div>
                      )}
                      {emp.personalPhone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <PhoneOutlined style={{ color: '#FAA71A', fontSize: 12, flexShrink: 0 }} />
                          <a href={`tel:${emp.personalPhone}`} onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: 11, color: isDarkMode ? '#FAA71A' : '#10113F' }}>
                            {emp.personalPhone}
                          </a>
                        </div>
                      )}
                      {emp.reportingManagerName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4, borderTop: 'var(--border-glass)' }}>
                          <UserOutlined style={{ color: 'var(--color-text-muted)', fontSize: 11, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Reports to: <strong>{emp.reportingManagerName}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Col>
            )
          })}
        </Row>
      )}

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
          const previewEmp = allEmployees.find(e => e.employeeId === previewEmpId)
          if (!previewEmp) return null

          const pName = `${previewEmp.firstName} ${previewEmp.lastName}`
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
                  <Tag color="green">{previewEmp.employmentStatus}</Tag>
                  <Tag color="blue">{previewEmp.employmentType}</Tag>
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
                    {/* Basic Info */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Basic Information
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Official Email</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{previewEmp.officialEmail || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Personal Phone</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.personalPhone || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Date of Birth</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {fullEmpDetails?.dateOfBirth ? new Date(fullEmpDetails.dateOfBirth).toLocaleDateString('en-IN') : '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Gender</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fullEmpDetails?.gender || '—'}</div>
                        </div>
                      </div>
                    </Card>

                    {/* Employment Info */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Employment details
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Designation</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.designationTitle || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Department</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.departmentName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Joining Date</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {previewEmp.joiningDate ? new Date(previewEmp.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Cost Center</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.costCenterName || '—'}</div>
                        </div>
                      </div>
                    </Card>

                    {/* Reporting Structure */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Reporting Structure
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Direct Manager</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {previewEmp.reportingManagerName || 'Board of Directors (CEO)'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Skip-Level Manager</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {fullEmpDetails?.l2ReportingManagerName || '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Direct Reports</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {directReportsCount} Employee{directReportsCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Organization Placement */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Organization Information
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Business Unit</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.businessUnitName || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Grade</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.gradeCode || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Band</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.bandCode || '—'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Weekly Off Pattern</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{previewEmp.weeklyOffPattern || '—'}</div>
                        </div>
                      </div>
                    </Card>

                    {/* Recruitment History (Future-Ready) */}
                    <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)', boxShadow: 'var(--shadow-subtle)' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: 13, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                        Recruitment History (ATS)
                      </h4>
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <InfoCircleOutlined />
                        No recruitment record logs found (Seeded via Direct Master Upload)
                      </div>
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
