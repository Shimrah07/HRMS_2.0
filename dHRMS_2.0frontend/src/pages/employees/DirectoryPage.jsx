import { useState, useMemo } from 'react'
import { Input, Select, Avatar, Tag, Spin, Row, Col, Badge } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SearchOutlined, UserOutlined, TeamOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, ApartmentOutlined } from '@ant-design/icons'
import { employeeService } from '../../services/employeeService'
import { organizationService } from '../../services/organizationService'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import useUIStore from '../../store/uiStore'

// ── Avatar palette ────────────────────────────────────────────────────────────
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

  const { data: empRes, isLoading } = useQuery({
    queryKey: ['employee-directory-all'],
    queryFn: () => employeeService.getEmployees({ pageSize: 10000 }),
  })

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

  const allEmployees = empRes?.data || []

  const flattenDepts = (arr) => {
    const r = []
    const walk = (a) => a?.forEach((d) => { r.push(d); if (d.children) walk(d.children) })
    walk(arr)
    return r
  }
  const flatDepts = useMemo(() => flattenDepts(deptData), [deptData])

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
      return matchSearch && matchDept && matchDesig && matchLoc
    })
  }, [allEmployees, search, filterDept, filterDesig, filterLoc])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Employee Directory"
        subtitle={`${filtered.length} employee${filtered.length !== 1 ? 's' : ''} found`}
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Employees', path: '/employees' }, { label: 'Directory' }]}
      />

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, padding: '16px 20px', background: 'var(--color-card-bg)', borderRadius: 14, border: 'var(--border-glass)', boxShadow: 'var(--shadow-subtle)' }}>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
          placeholder="Search name, code, email, department, designation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, borderRadius: 10, height: 42 }}
        />
        <Select
          allowClear placeholder="Department" value={filterDept} onChange={setFilterDept}
          options={flatDepts.map((d) => ({ value: d.deptId, label: d.deptName }))}
          style={{ minWidth: 180, borderRadius: 10 }} showSearch optionFilterProp="label"
        />
        <Select
          allowClear placeholder="Designation" value={filterDesig} onChange={setFilterDesig}
          options={(desigData || []).map((d) => ({ value: d.designationId, label: d.title }))}
          style={{ minWidth: 180, borderRadius: 10 }} showSearch optionFilterProp="label"
        />
        <Select
          allowClear placeholder="Location" value={filterLoc} onChange={setFilterLoc}
          options={(locData || []).map((l) => ({ value: l.locationId, label: l.locationName }))}
          style={{ minWidth: 160, borderRadius: 10 }} showSearch optionFilterProp="label"
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
                  onClick={() => navigate(`/employees/${emp.employeeId}`)}
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
                      <Avatar size={52} src={emp.profilePhoto}
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
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
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
    </motion.div>
  )
}
