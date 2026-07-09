import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Spin, Avatar, Card, Select, Button, Drawer, Space, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  SearchOutlined, CloseOutlined, ApartmentOutlined,
  PlusOutlined, MinusOutlined, AimOutlined, TeamOutlined, UserOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { employeeService } from '../../services/employeeService'
import PageHeader from '../../components/common/PageHeader'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'
import { getAvatarUrl } from '../../constants/api'
function OrgNode({ 
  node, 
  level = 0, 
  collapsedNodes, 
  selectedEmployeeId, 
  onToggleCollapse, 
  onSelectNode, 
  activePathSet,
  selectedDepartment,
  departmentMatchSet,
  finalRoots
}) {
  if (!node) return null
  const { isDarkMode } = useUIStore()
  const isCollapsed = collapsedNodes.has(node.employeeId)
  const isSelected = selectedEmployeeId === node.employeeId
  const hasReports = node.directReports && node.directReports.length > 0
  const isVirtualNode = node.employeeId === 'virtual-org-root'

  // Determine if this node is dimmed by the department filter
  const isDimmed = selectedDepartment && !departmentMatchSet.has(node.employeeId)
  
  const displayName = node.fullName || 'Unknown'
  const initials = isVirtualNode ? 'ORG' : (node.fullName 
    ? node.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
    : 'E')

  // Calculate effective level (correcting for the presence of a virtual corporate root)
  const isVirtualRootPresent = finalRoots && finalRoots[0]?.employeeId === 'virtual-org-root'
  const effectiveLevel = isVirtualRootPresent ? level - 1 : level

  // Determine level-based branding colors and badges
  let levelColor = '#10B981' // Team member (Teal/Green)
  let levelTitle = 'Team Member'
  let levelShadow = 'rgba(16, 185, 129, 0.08)'

  if (isVirtualNode) {
    levelColor = '#8c8c8c'
    levelTitle = 'Company'
    levelShadow = 'rgba(140, 140, 140, 0.12)'
  } else if (effectiveLevel === 0) {
    levelColor = '#FAA71A' // CEO/Executive (Gold)
    levelTitle = 'Executive'
    levelShadow = 'rgba(250, 167, 26, 0.2)'
  } else if (effectiveLevel === 1) {
    levelColor = '#8B5CF6' // Directors/Heads (Purple)
    levelTitle = 'Director'
    levelShadow = 'rgba(139, 92, 246, 0.15)'
  } else if (effectiveLevel === 2) {
    levelColor = '#3B82F6' // Managers/Leads (Blue)
    levelTitle = 'Manager'
    levelShadow = 'rgba(59, 130, 246, 0.15)'
  }

  // Active path highlight status
  const isChildActiveInPath = activePathSet && activePathSet.has(node.employeeId) && selectedEmployeeId !== node.employeeId

  // Find which of the direct reports is in the active path (if any)
  const activeReportsIdx = useMemo(() => {
    if (!node.directReports || !activePathSet) return -1
    return node.directReports.findIndex(child => activePathSet.has(child.employeeId))
  }, [node.directReports, activePathSet])

  return (
    <div 
      id={`org-node-${node.employeeId}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
    >
      {/* Node Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        onClick={() => onSelectNode(node.employeeId)}
        style={{ zIndex: 10, cursor: 'pointer' }}
      >
        <Card
          size="small"
          className="org-card"
          style={{
            borderRadius: 16,
            borderTop: `4px solid ${levelColor}`,
            borderLeft: isSelected ? '2px solid #FAA71A' : (isDarkMode ? '1px solid rgba(160, 90, 255, 0.2)' : '1px solid rgba(16, 17, 63, 0.08)'),
            borderRight: isSelected ? '2px solid #FAA71A' : (isDarkMode ? '1px solid rgba(160, 90, 255, 0.2)' : '1px solid rgba(16, 17, 63, 0.08)'),
            borderBottom: isSelected ? '2px solid #FAA71A' : (isDarkMode ? '1px solid rgba(160, 90, 255, 0.2)' : '1px solid rgba(16, 17, 63, 0.08)'),
            minWidth: 200,
            maxWidth: 230,
            textAlign: 'center',
            background: isSelected 
              ? (isDarkMode ? 'rgba(250, 167, 26, 0.12)' : '#FFF4E3') 
              : 'var(--color-card-bg)',
            color: 'var(--color-text-primary)',
            boxShadow: isSelected 
              ? '0 0 15px rgba(250, 167, 26, 0.35)' 
              : `0 4px 14px ${levelShadow}`,
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            position: 'relative',
            opacity: isDimmed ? 0.3 : 1,
            filter: isDimmed ? 'grayscale(35%) opacity(0.3)' : 'none',
            transform: isSelected ? 'scale(1.03)' : 'none',
          }}
          styles={{ body: { padding: '16px 14px' } }}
        >
          {/* Level Capsule Badge */}
          <span style={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            fontSize: 9, 
            fontWeight: 800, 
            color: levelColor, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            background: isDarkMode ? 'rgba(140, 70, 255, 0.1)' : 'rgba(0,0,0,0.03)',
            padding: '2px 6px',
            borderRadius: 6
          }}>
            {levelTitle}
          </span>

          {/* User Avatar with Ring and Status Indicator */}
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <Avatar
              size={46}
              src={getAvatarUrl(node.profilePhoto)}
              style={{ 
                background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)', 
                color: '#fff',
                fontWeight: 700, 
                marginBottom: 8,
                border: `2px solid ${isSelected ? '#FAA71A' : levelColor}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              {isVirtualNode ? <ApartmentOutlined /> : initials}
            </Avatar>
            {!isVirtualNode && (
              <span style={{
                position: 'absolute',
                bottom: 8,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#10B981',
                border: isDarkMode ? '2px solid #0E0726' : '2px solid #fff',
                boxShadow: '0 0 4px #10B981'
              }} />
            )}
          </div>
          
          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, marginTop: 4, color: isDarkMode ? 'rgba(240, 244, 255, 0.7)' : 'rgba(16, 17, 63, 0.65)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {node.designationTitle || 'No Designation'}
          </div>

          <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.75, marginTop: 2, color: isDarkMode ? 'rgba(240, 244, 255, 0.55)' : 'rgba(16, 17, 63, 0.5)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {node.departmentName || 'No Department'}
          </div>

          {!isVirtualNode && (
            <div style={{ fontSize: 9.5, opacity: 0.5, marginTop: 4, color: isDarkMode ? 'rgba(240, 244, 255, 0.45)' : 'rgba(16, 17, 63, 0.4)' }}>
              ID: {node.employeeCode || 'N/A'}
            </div>
          )}

          {hasReports && (
            <div style={{ fontSize: 10, fontWeight: 700, color: levelColor, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <TeamOutlined style={{ fontSize: 11 }} />
              <span>Manages {node.directReports.length}</span>
            </div>
          )}

          {/* Expand / Collapse Floating Action Button */}
          {hasReports && (
            <div
              className="org-expand-btn"
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse(node.employeeId)
              }}
              style={{
                position: 'absolute',
                bottom: -11,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: isDarkMode ? '#150A35' : '#ffffff',
                border: `1.5px solid ${isChildActiveInPath ? '#FAA71A' : levelColor}`,
                color: isChildActiveInPath ? '#FAA71A' : (isDarkMode ? '#F0F4FF' : '#10113F'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                zIndex: 12,
                transition: 'all 0.25s ease'
              }}
            >
              {isCollapsed ? <PlusOutlined /> : <MinusOutlined />}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Children Nodes rendering */}
      {hasReports && !isCollapsed && (
        <div style={{ position: 'relative', paddingTop: 24 }}>
          {/* Vertical connecting line below parent card */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: '50%', 
            width: 2, 
            height: 24, 
            background: isChildActiveInPath ? '#FAA71A' : (isDarkMode ? 'rgba(160, 90, 255, 0.25)' : 'rgba(16, 17, 63, 0.12)'), 
            transform: 'translateX(-50%)', 
            borderRadius: 2,
            boxShadow: isChildActiveInPath ? '0 0 8px rgba(250, 167, 26, 0.6)' : 'none',
            transition: 'background 0.25s, box-shadow 0.25s'
          }} />
          
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', position: 'relative' }}>
            {node.directReports.map((child, idx) => {
              const L = node.directReports.length
              
              // Highlight horizontal connection segments leading to the active branch
              let isHorizontalGlow = false
              if (activeReportsIdx !== -1) {
                const mid = (L - 1) / 2
                if (activeReportsIdx < mid) {
                  isHorizontalGlow = idx >= activeReportsIdx && idx <= Math.floor(mid)
                } else if (activeReportsIdx > mid) {
                  isHorizontalGlow = idx >= Math.ceil(mid) && idx <= activeReportsIdx
                } else {
                  isHorizontalGlow = false
                }
              }

              const isChildActive = activePathSet && activePathSet.has(child.employeeId)

              return (
                <div key={child.employeeId} style={{ position: 'relative', paddingTop: 24, flex: '1 0 0%' }}>
                  {/* Horizontal connection line */}
                  {L > 1 && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: idx === 0 ? '50%' : 0, 
                        right: idx === L - 1 ? '50%' : 0, 
                        height: 2, 
                        background: isHorizontalGlow ? '#FAA71A' : (isDarkMode ? 'rgba(160, 90, 255, 0.25)' : 'rgba(16, 17, 63, 0.12)'),
                        boxShadow: isHorizontalGlow ? '0 0 8px rgba(250, 167, 26, 0.6)' : 'none',
                        borderRadius: 1,
                        transition: 'background 0.25s, box-shadow 0.25s'
                      }} 
                    />
                  )}
                  {/* Child vertical line */}
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: '50%', 
                    width: 2, 
                    height: 24, 
                    background: isChildActive ? '#FAA71A' : (isDarkMode ? 'rgba(160, 90, 255, 0.25)' : 'rgba(16, 17, 63, 0.12)'), 
                    boxShadow: isChildActive ? '0 0 8px rgba(250, 167, 26, 0.6)' : 'none',
                    transform: 'translateX(-50%)', 
                    borderRadius: 2,
                    transition: 'background 0.25s, box-shadow 0.25s'
                  }} />
                  
                  <OrgNode 
                    node={child} 
                    level={level + 1} 
                    collapsedNodes={collapsedNodes}
                    selectedEmployeeId={selectedEmployeeId}
                    onToggleCollapse={onToggleCollapse}
                    onSelectNode={onSelectNode}
                    activePathSet={activePathSet}
                    selectedDepartment={selectedDepartment}
                    departmentMatchSet={departmentMatchSet}
                    finalRoots={finalRoots}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrgChartPage() {
  const navigate = useNavigate()
  const { isDarkMode } = useUIStore()
  const { user } = useAuthStore()
  const [collapsedNodes, setCollapsedNodes] = useState(new Set())
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  
  const containerRef = useRef(null)
  const dragStart = useRef({ scrollLeft: 0, scrollTop: 0, clientX: 0, clientY: 0 })

  const loggedInEmployeeId = user?.employeeId

  // Fetch all employees to construct the hierarchy tree fully on the frontend
  const { data: allEmployees, isLoading } = useQuery({
    queryKey: ['all-employees-list-for-chart'],
    queryFn: async () => {
      let page = 1
      let all = []
      let hasMore = true
      while (hasMore) {
        const res = await employeeService.getEmployees({ page, pageSize: 100 })
        if (res?.data && Array.isArray(res.data)) {
          all.push(...res.data)
          if (all.length >= (res.pagination?.totalRecords || 0) || res.data.length < 100) {
            hasMore = false
          } else {
            page++
          }
        } else {
          hasMore = false
        }
      }
      return all
    },
  })

  // Build hierarchy tree from reportingManagerId
  const { flatNodes, nodeMap, finalRoots } = useMemo(() => {
    const uniqueNodes = []
    if (allEmployees) {
      allEmployees.forEach(emp => {
        uniqueNodes.push({
          employeeId: emp.employeeId,
          fullName: `${emp.firstName} ${emp.lastName}`,
          profilePhoto: emp.profilePhoto,
          designationTitle: emp.designationTitle,
          departmentName: emp.departmentName,
          reportingManagerId: emp.reportingManagerId,
          employeeCode: emp.employeeCode || 'N/A'
        })
      })
    }

    const buildHierarchy = (nodes) => {
      const internalMap = new Map()
      nodes.forEach(node => {
        internalMap.set(node.employeeId, { ...node, directReports: [] })
      })

      const rootsList = []
      
      const hasCycle = (startId, managerId) => {
        let currentId = managerId
        const visited = new Set([startId])
        while (currentId) {
          if (visited.has(currentId)) return true
          visited.add(currentId)
          const parentNode = internalMap.get(currentId)
          currentId = parentNode?.reportingManagerId
        }
        return false
      }

      internalMap.forEach(node => {
        const mId = node.reportingManagerId
        if (mId && internalMap.has(mId) && !hasCycle(node.employeeId, mId)) {
          internalMap.get(mId).directReports.push(node)
        } else {
          rootsList.push(node)
        }
      })

      return { rootsList, internalMap }
    }

    const { rootsList, internalMap } = buildHierarchy(uniqueNodes)

    // Handle virtual root grouping if multiple roots exist
    let finalRootsList = rootsList
    if (uniqueNodes.length > 1 && rootsList.length > 1) {
      const virtualRoot = {
        employeeId: 'virtual-org-root',
        fullName: 'Acme Technologies',
        designationTitle: 'Corporate Directory',
        departmentName: 'All Departments',
        profilePhoto: null,
        employeeCode: 'CORP',
        reportingManagerId: null,
        directReports: rootsList,
        isVirtual: true
      }
      finalRootsList = [virtualRoot]
    }

    return { 
      flatNodes: uniqueNodes, 
      nodeMap: internalMap, 
      finalRoots: finalRootsList 
    }
  }, [allEmployees])

  // Get unique departments list for filtering
  const departmentsList = useMemo(() => {
    const depts = new Set()
    flatNodes.forEach(node => {
      if (node.departmentName) {
        depts.add(node.departmentName)
      }
    })
    return Array.from(depts).sort()
  }, [flatNodes])

  // Map of active matching nodes and their ancestors for department highlights
  const departmentMatchSet = useMemo(() => {
    const matches = new Set()
    if (!selectedDepartment) return matches

    // 1. Find matching nodes
    const matchingIds = flatNodes
      .filter(n => n.departmentName === selectedDepartment)
      .map(n => n.employeeId)

    // 2. Resolve structural ancestors to keep lines intact
    matchingIds.forEach(id => {
      matches.add(id)
      const ancestors = findAncestors(id, nodeMap)
      ancestors.forEach(ancId => matches.add(ancId))
    })

    return matches
  }, [selectedDepartment, flatNodes, nodeMap])

  // Generate Search Options
  const searchOptions = useMemo(() => {
    return flatNodes.map(node => ({
      value: node.employeeId,
      label: `${node.fullName} - ${node.employeeCode || 'N/A'} (${node.designationTitle || 'No Designation'})`,
      node
    }))
  }, [flatNodes])

  // Ancestor path search helper
  function findAncestors(employeeId, map) {
    const path = []
    let currentId = employeeId
    const visited = new Set()
    
    while (currentId) {
      if (visited.has(currentId)) break
      visited.add(currentId)
      
      const node = map.get(currentId)
      if (!node) break
      
      const parentId = node.reportingManagerId
      if (parentId) {
        path.push(parentId)
      } else if (finalRoots[0]?.employeeId === 'virtual-org-root' && node.employeeId !== 'virtual-org-root') {
        path.push('virtual-org-root')
      }
      currentId = parentId
    }
    return path
  }

  // Active path highlight tracing list
  const activePathSet = useMemo(() => {
    const path = new Set()
    if (selectedEmployeeId) {
      path.add(selectedEmployeeId)
      const ancestors = findAncestors(selectedEmployeeId, nodeMap)
      ancestors.forEach(id => path.add(id))
    }
    return path
  }, [selectedEmployeeId, nodeMap])

  const centerNode = (employeeId) => {
    setTimeout(() => {
      const container = containerRef.current
      const element = document.getElementById(`org-node-${employeeId}`)
      if (container && element) {
        const containerRect = container.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()

        const scrollLeftOffset = elementRect.left - containerRect.left - (containerRect.width / 2) + (elementRect.width / 2)
        const scrollTopOffset = elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2)

        container.scrollTo({
          left: container.scrollLeft + scrollLeftOffset,
          top: container.scrollTop + scrollTopOffset,
          behavior: 'smooth'
        })
      }
    }, 200)
  }

  const handleSearchSelect = (value) => {
    setSelectedEmployeeId(value)

    const ancestors = findAncestors(value, nodeMap)
    if (ancestors && ancestors.length > 0) {
      setCollapsedNodes(prev => {
        const next = new Set(prev)
        ancestors.forEach(id => next.delete(id))
        return next
      })
    }

    centerNode(value)
  }

  const handleCenterRoot = () => {
    if (finalRoots && finalRoots.length > 0) {
      const rootId = finalRoots[0].employeeId
      setSelectedEmployeeId(rootId)
      centerNode(rootId)
    }
  }

  const handleLocateMe = () => {
    if (loggedInEmployeeId) {
      handleSearchSelect(loggedInEmployeeId)
    }
  }

  const handleToggleCollapse = (id) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Helper for quick centering inside details panels
  const handleSelectAndCenter = (employeeId) => {
    setSelectedEmployeeId(employeeId)
    const ancestors = findAncestors(employeeId, nodeMap)
    if (ancestors && ancestors.length > 0) {
      setCollapsedNodes(prev => {
        const next = new Set(prev)
        ancestors.forEach(id => next.delete(id))
        return next
      })
    }
    centerNode(employeeId)
  }

  // Drag to Pan Mouse Handlers
  const handleMouseDown = (e) => {
    if (
      e.target.closest('.ant-card') || 
      e.target.closest('button') || 
      e.target.closest('.ant-select') || 
      e.target.closest('.ant-drawer') ||
      e.target.closest('.org-controls')
    ) {
      return
    }
    setIsDragging(true)
    dragStart.current = {
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
      clientX: e.clientX,
      clientY: e.clientY
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.current.clientX
    const dy = e.clientY - dragStart.current.clientY
    containerRef.current.scrollLeft = dragStart.current.scrollLeft - dx
    containerRef.current.scrollTop = dragStart.current.scrollTop - dy
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Selected Node details for drawer
  const selectedNodeDetails = useMemo(() => {
    if (!selectedEmployeeId) return null
    if (selectedEmployeeId === 'virtual-org-root') {
      return {
        employeeId: 'virtual-org-root',
        fullName: 'Acme Technologies',
        designationTitle: 'Corporate Directory',
        departmentName: 'All Departments',
        employeeCode: 'CORP',
        profilePhoto: null,
        directReports: finalRoots[0]?.employeeId === 'virtual-org-root' ? finalRoots[0].directReports : [],
        reportingManagerId: null
      }
    }
    return nodeMap.get(selectedEmployeeId)
  }, [selectedEmployeeId, nodeMap, finalRoots])

  // Get manager chain in descending order (CEO -> managers -> employee)
  const managerChain = useMemo(() => {
    if (!selectedEmployeeId || selectedEmployeeId === 'virtual-org-root') return []
    const ancestors = findAncestors(selectedEmployeeId, nodeMap)
    return ancestors.reverse().map(id => nodeMap.get(id)).filter(Boolean)
  }, [selectedEmployeeId, nodeMap])

  // Render Canvas Hierarchy Tree
  const renderCanvasContent = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: 400 }}>
          <Spin size="large" tip="Constructing org structure..." />
        </div>
      )
    }

    if (flatNodes.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '60px 20px', textAlign: 'center' }}>
          <ApartmentOutlined style={{ fontSize: 48, color: 'var(--color-text-muted)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            No employees found
          </h3>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 400 }}>
            There are no active employees in the corporate directory.
          </p>
        </div>
      )
    }

    const isMultipleWithNoRelationships = flatNodes.length > 1 && finalRoots.length === flatNodes.length

    if (isMultipleWithNoRelationships) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '60px 20px', textAlign: 'center' }}>
          <ApartmentOutlined style={{ fontSize: 48, color: '#FAA71A', marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            Reporting hierarchy is unconfigured
          </h3>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 400 }}>
            To explore the interactive chart, please configure reporting managers for employees in the directory.
          </p>
        </div>
      )
    }

    return (
      <div 
        style={{ 
          transform: `scale(${zoomScale})`, 
          transformOrigin: 'top center',
          transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 auto',
          gap: 40,
          padding: '0 150px 40px 150px'
        }}
      >
        {finalRoots.map((root) => (
          <OrgNode 
            key={root.employeeId}
            node={root} 
            collapsedNodes={collapsedNodes}
            selectedEmployeeId={selectedEmployeeId}
            onToggleCollapse={handleToggleCollapse}
            onSelectNode={setSelectedEmployeeId}
            activePathSet={activePathSet}
            selectedDepartment={selectedDepartment}
            departmentMatchSet={departmentMatchSet}
            finalRoots={finalRoots}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Premium CSS Stylesheet Overrides */}
      <style>{`
        /* Canvas Scrollbar refinement */
        .org-chart-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .org-chart-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .org-chart-container::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(160, 90, 255, 0.18)' : 'rgba(16, 17, 63, 0.08)'};
          border-radius: 99px;
        }
        .org-chart-container::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(160, 90, 255, 0.35)' : 'rgba(16, 17, 63, 0.16)'};
        }
        
        /* Blueprint dotted grid canvas background */
        .org-chart-canvas {
          background-image: radial-gradient(${isDarkMode ? 'rgba(160, 90, 255, 0.06)' : 'rgba(16, 17, 63, 0.04)'} 1.5px, transparent 1.5px) !important;
          background-size: 24px 24px !important;
        }

        /* Hover animations and shadows on cards */
        .org-card {
          border-radius: 16px !important;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        .org-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: ${isDarkMode ? '0 12px 28px rgba(5,2,20,0.6)' : '0 12px 28px rgba(16, 17, 63, 0.08)'} !important;
        }
        
        /* Expand button scale hover effect */
        .org-expand-btn:hover {
          transform: translateX(-50%) scale(1.15) !important;
        }

        /* Ambient floating lights inside canvas for extra style */
        .ambient-light-top-left {
          position: absolute;
          top: 0;
          left: 0;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, ${isDarkMode ? 'rgba(250, 167, 26, 0.03)' : 'rgba(250, 167, 26, 0.04)'} 0%, transparent 70%);
          pointer-events: none;
        }
        .ambient-light-bottom-right {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, ${isDarkMode ? 'rgba(139, 92, 246, 0.03)' : 'rgba(139, 92, 246, 0.04)'} 0%, transparent 70%);
          pointer-events: none;
        }
      `}</style>

      <PageHeader
        title="Org Explorer"
        subtitle="Explore reporting lines, department hierarchies, and employee chains"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Org Chart' }]}
        actions={
          <Space wrap>
            {/* Department Filter */}
            <Select
              placeholder="Filter by Department"
              style={{ width: 190 }}
              allowClear
              onChange={setSelectedDepartment}
              value={selectedDepartment}
              options={departmentsList.map(dept => ({ value: dept, label: dept }))}
            />

            {/* Employee Search Bar */}
            <Select
              showSearch
              placeholder="Search employee hierarchy..."
              style={{ width: 280 }}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={handleSearchSelect}
              options={searchOptions}
              value={selectedEmployeeId || undefined}
              suffixIcon={<SearchOutlined />}
              allowClear
              onClear={() => setSelectedEmployeeId(null)}
            />

            {/* Locate Me */}
            <Button 
              icon={<AimOutlined />} 
              onClick={handleLocateMe}
              disabled={!loggedInEmployeeId}
            >
              Locate Me
            </Button>

            {/* Center Root */}
            <Button 
              icon={<ApartmentOutlined />} 
              onClick={handleCenterRoot} 
              disabled={finalRoots.length === 0}
            >
              Center Root
            </Button>
          </Space>
        }
      />

      {/* Explorer Canvas Container Wrapper */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="org-chart-container org-chart-canvas"
          style={{
            background: isDarkMode ? '#0A0420' : '#f8f9ff',
            borderRadius: 20,
            border: 'var(--border-glass)',
            padding: '48px 40px',
            overflow: 'auto',
            minHeight: 520,
            maxHeight: '72vh',
            position: 'relative',
            boxShadow: 'var(--shadow-subtle)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transition: 'background-color 0.3s ease, border 0.3s ease'
          }}
        >
          {/* Glow Effects */}
          <div className="ambient-light-top-left" />
          <div className="ambient-light-bottom-right" />

          {renderCanvasContent()}
        </div>

        {/* Floating Zoom & Controls Console (Fixed outside the scrollable content) */}
        {!isLoading && flatNodes.length > 0 && (
          <div 
            className="org-controls"
            style={{ 
              position: 'absolute', 
              bottom: 24, 
              right: 24, 
              zIndex: 30, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              background: isDarkMode ? 'rgba(14, 7, 38, 0.85)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isDarkMode ? '1px solid rgba(160, 90, 255, 0.2)' : '1px solid rgba(16,17,63,0.08)',
              padding: '8px 12px',
              borderRadius: 14,
              boxShadow: isDarkMode ? '0 8px 32px rgba(5,2,20,0.5)' : '0 8px 32px rgba(16,17,63,0.06)'
            }}
          >
            <Button 
              shape="circle"
              size="middle"
              icon={<MinusOutlined />} 
              onClick={() => setZoomScale(s => Math.max(s - 0.1, 0.5))} 
              style={{
                background: isDarkMode ? 'rgba(160, 90, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                border: 'none',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32
              }}
            />
            
            <Tag 
              onClick={() => setZoomScale(1)}
              style={{ 
                margin: 0, 
                padding: '0 8px', 
                alignSelf: 'center', 
                height: 32, 
                display: 'flex', 
                alignItems: 'center', 
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 700,
                background: isDarkMode ? 'rgba(160, 90, 255, 0.08)' : 'rgba(0,0,0,0.04)',
                color: 'var(--color-text-primary)',
                border: 'none'
              }}
              title="Reset Zoom to 100%"
            >
              {Math.round(zoomScale * 100)}%
            </Tag>
            
            <Button 
              shape="circle"
              size="middle"
              icon={<PlusOutlined />} 
              onClick={() => setZoomScale(s => Math.min(s + 0.1, 1.5))} 
              style={{
                background: isDarkMode ? 'rgba(160, 90, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                border: 'none',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32
              }}
            />

            <div style={{ width: 1, height: 16, background: isDarkMode ? 'rgba(160, 90, 255, 0.25)' : 'rgba(16,17,63,0.12)' }} />

            <Button 
              shape="circle"
              size="middle"
              icon={<AimOutlined />} 
              onClick={handleCenterRoot}
              title="Center Root Node"
              style={{
                background: isDarkMode ? 'rgba(160, 90, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                border: 'none',
                color: 'var(--color-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32
              }}
            />
          </div>
        )}
      </div>

      {/* Selected Employee Info Quick Drawer */}
      <Drawer
        title={null}
        placement="right"
        width={350}
        onClose={() => setSelectedEmployeeId(null)}
        open={!!selectedNodeDetails}
        styles={{ body: { padding: 0, background: isDarkMode ? 'var(--color-card-bg)' : '#ffffff' } }}
        closable={false}
      >
        {selectedNodeDetails && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Top Banner */}
            <div style={{ height: 100, background: 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)', position: 'relative' }}>
              <Button
                icon={<CloseOutlined />}
                onClick={() => setSelectedEmployeeId(null)}
                style={{ position: 'absolute', top: 12, right: 12, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%' }}
              />
            </div>

            {/* Profile Avatar & Header */}
            <div style={{ textAlign: 'center', marginTop: -40, padding: '0 20px', zIndex: 2 }}>
              <Avatar
                size={80}
                src={getAvatarUrl(selectedNodeDetails.profilePhoto)}
                style={{
                  border: '3px solid var(--color-card-bg)',
                  background: 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)',
                  boxShadow: 'var(--shadow-medium)'
                }}
              >
                {selectedNodeDetails.employeeId === 'virtual-org-root' ? (
                  <ApartmentOutlined />
                ) : (
                  selectedNodeDetails.fullName 
                    ? selectedNodeDetails.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                    : 'E'
                )}
              </Avatar>
              <h3 style={{ margin: '10px 0 2px', fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {selectedNodeDetails.fullName}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{selectedNodeDetails.designationTitle || 'No Designation'}</div>
            </div>

            {/* Details and Reporting Nav Panel */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile Meta Cards */}
              <Card size="small" style={{ borderRadius: 14, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 11, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Profile Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Employee ID: </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedNodeDetails.employeeCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Department: </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedNodeDetails.departmentName || 'N/A'}</span>
                  </div>
                </div>
              </Card>

              {/* Management Supervisors Chain */}
              {selectedNodeDetails.employeeId !== 'virtual-org-root' && (
                <Card size="small" style={{ borderRadius: 14, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: 11, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>Manager Chain</h4>
                  {managerChain.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {managerChain.map((mgr, idx) => (
                        <div key={mgr.employeeId} style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: 14 }}>
                          {/* Connection line inside chain list */}
                          {idx < managerChain.length && (
                            <div style={{ position: 'absolute', left: 4, top: 8, bottom: -12, width: 1.5, background: 'rgba(139, 92, 246, 0.25)' }} />
                          )}
                          <div style={{ position: 'absolute', left: 1, top: 5, width: 7, height: 7, borderRadius: '50%', background: '#8B5CF6' }} />
                          
                          <span 
                            onClick={() => handleSelectAndCenter(mgr.employeeId)}
                            style={{ 
                              color: '#8B5CF6', 
                              cursor: 'pointer', 
                              fontWeight: 700,
                              textDecoration: 'underline',
                              fontSize: 12.5,
                              lineHeight: 1.3
                            }}
                          >
                            {mgr.fullName}
                          </span>
                          <span style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginBottom: 12 }}>{mgr.designationTitle}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 12.5 }}>None (Organization Root Node)</span>
                  )}
                </Card>
              )}

              {/* Subordinates / Direct Reports List */}
              <Card size="small" style={{ borderRadius: 14, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 11, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                  Direct Reports ({selectedNodeDetails.directReports?.length || 0})
                </h4>
                {selectedNodeDetails.directReports?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                    {selectedNodeDetails.directReports.map(report => (
                      <div 
                        key={report.employeeId}
                        onClick={() => handleSelectAndCenter(report.employeeId)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 10, 
                          cursor: 'pointer',
                          padding: '6px 10px',
                          borderRadius: 10,
                          background: isDarkMode ? 'rgba(140, 70, 255, 0.05)' : 'rgba(0,0,0,0.02)',
                          border: '1.5px solid transparent',
                          transition: 'all 0.25s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
                          e.currentTarget.style.background = isDarkMode ? 'rgba(140, 70, 255, 0.1)' : 'rgba(0,0,0,0.04)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent'
                          e.currentTarget.style.background = isDarkMode ? 'rgba(140, 70, 255, 0.05)' : 'rgba(0,0,0,0.02)'
                        }}
                      >
                        <Avatar size={28} src={getAvatarUrl(report.profilePhoto)} style={{ background: '#10113F', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                          {report.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-primary)' }}>
                            {report.fullName}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {report.designationTitle}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 12.5 }}>0 employees report directly</span>
                )}
              </Card>
            </div>

            {/* Bottom Actions */}
            {selectedNodeDetails.employeeId !== 'virtual-org-root' && (
              <div style={{ padding: 16, borderTop: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <Button 
                  type="primary" 
                  block 
                  style={{ borderRadius: 10, background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', fontWeight: 700, height: 40 }}
                  onClick={() => {
                    setSelectedEmployeeId(null)
                    navigate(`/employees/${selectedNodeDetails.employeeId}`)
                  }}
                >
                  View Full Profile
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
