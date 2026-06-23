import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Spin, Avatar, Card, Select, Button, Drawer, Space, Tag } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  SearchOutlined, CloseOutlined, ApartmentOutlined,
  PlusOutlined, MinusOutlined, AimOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { employeeService } from '../../services/employeeService'
import PageHeader from '../../components/common/PageHeader'
import useUIStore from '../../store/uiStore'

function OrgNode({ node, level = 0, collapsedNodes, selectedEmployeeId, onToggleCollapse, onSelectNode }) {
  if (!node) return null
  const { isDarkMode } = useUIStore()
  const isCollapsed = collapsedNodes.has(node.employeeId)
  const isSelected = selectedEmployeeId === node.employeeId
  const hasReports = node.directReports && node.directReports.length > 0
  const isVirtualNode = node.employeeId === 'virtual-org-root'

  const displayName = node.fullName || 'Unknown'
  const initials = isVirtualNode ? 'ORG' : (node.fullName 
    ? node.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
    : 'E')

  return (
    <div 
      id={`org-node-${node.employeeId}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
    >
      {/* Node Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={() => onSelectNode(node.employeeId)}
        style={{ zIndex: 10, cursor: 'pointer' }}
      >
        <Card
          size="small"
          style={{
            borderRadius: 14,
            border: isSelected ? '2px solid #FAA71A' : 'var(--border-glass)',
            minWidth: 190,
            maxWidth: 220,
            textAlign: 'center',
            background: isSelected ? (isDarkMode ? '#FAA71A' : '#10113F') : 'var(--color-card-bg)',
            color: isSelected ? (isDarkMode ? '#10113F' : '#fff') : 'var(--color-text-primary)',
            boxShadow: isSelected ? 'var(--shadow-premium)' : 'var(--shadow-subtle)',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          styles={{ body: { padding: '12px 14px' } }}
        >
          <Avatar
            size={40}
            src={node.profilePhoto}
            style={{ 
              background: isSelected 
                ? (isDarkMode ? '#10113F' : '#FAA71A') 
                : 'linear-gradient(135deg, #10113F 0%, #2d2f82 100%)', 
              color: isSelected ? (isDarkMode ? '#fff' : '#10113F') : '#fff',
              fontWeight: 700, 
              marginBottom: 6 
            }}
          >
            {isVirtualNode ? <ApartmentOutlined /> : initials}
          </Avatar>
          
          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? (isDarkMode ? '#10113F' : '#fff') : 'var(--color-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2, color: isSelected ? (isDarkMode ? '#10113F' : '#fff') : (isDarkMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(16, 17, 63, 0.65)'), textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {node.designationTitle || 'No Designation'}
          </div>

          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2, color: isSelected ? (isDarkMode ? '#10113F' : '#fff') : (isDarkMode ? 'rgba(255, 255, 255, 0.75)' : 'rgba(16, 17, 63, 0.65)'), textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {node.departmentName || 'No Department'}
          </div>

          {!isVirtualNode && (
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2, color: isSelected ? (isDarkMode ? '#10113F' : '#fff') : (isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(16, 17, 63, 0.45)') }}>
              ID: {node.employeeCode || 'N/A'}
            </div>
          )}

          {/* Expand / Collapse Action Badge */}
          {hasReports && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onToggleCollapse(node.employeeId)
              }}
              style={{
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: isSelected ? (isDarkMode ? '#10113F' : '#FAA71A') : (isDarkMode ? '#FAA71A' : '#10113F'),
                border: '1px solid rgba(255,255,255,0.15)',
                color: isSelected ? (isDarkMode ? '#fff' : '#10113F') : (isDarkMode ? '#10113F' : '#fff'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: 12
              }}
            >
              {isCollapsed ? <PlusOutlined /> : <MinusOutlined />}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Children Nodes */}
      {hasReports && !isCollapsed && (
        <div style={{ position: 'relative', paddingTop: 24 }}>
          {/* Vertical connecting line */}
          <div style={{ position: 'absolute', top: 0, left: '50%', width: 2, height: 24, background: isDarkMode ? 'rgba(250, 167, 26, 0.45)' : 'rgba(16, 17, 63, 0.18)', transform: 'translateX(-50%)', borderRadius: 2 }} />
          
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', position: 'relative' }}>
            {node.directReports.map((child, idx) => {
              const L = node.directReports.length
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
                        background: isDarkMode ? 'rgba(250, 167, 26, 0.45)' : 'rgba(16, 17, 63, 0.18)',
                        borderRadius: 1,
                      }} 
                    />
                  )}
                  {/* Child vertical line */}
                  <div style={{ position: 'absolute', top: 0, left: '50%', width: 2, height: 24, background: isDarkMode ? 'rgba(250, 167, 26, 0.45)' : 'rgba(16, 17, 63, 0.18)', transform: 'translateX(-50%)', borderRadius: 2 }} />
                  
                  <OrgNode 
                    node={child} 
                    level={level + 1} 
                    collapsedNodes={collapsedNodes}
                    selectedEmployeeId={selectedEmployeeId}
                    onToggleCollapse={onToggleCollapse}
                    onSelectNode={onSelectNode}
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
  const [collapsedNodes, setCollapsedNodes] = useState(new Set())
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  
  const containerRef = useRef(null)
  const dragStart = useRef({ scrollLeft: 0, scrollTop: 0, clientX: 0, clientY: 0 })

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
        fullName: 'Organization',
        designationTitle: 'Company Directory',
        departmentName: 'All Departments',
        profilePhoto: null,
        employeeCode: 'ORG',
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

  // Generate Search Options
  const searchOptions = useMemo(() => {
    return flatNodes.map(node => ({
      value: node.employeeId,
      label: `${node.fullName} - ${node.employeeCode || 'N/A'} (${node.designationTitle || 'No Designation'})`,
      node
    }))
  }, [flatNodes])

  // Expand & Center functions
  const findAncestors = (employeeId, map) => {
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

  // Drag to Pan Mouse Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.ant-card') || e.target.closest('button') || e.target.closest('.ant-select') || e.target.closest('.ant-drawer')) {
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
        fullName: 'Organization',
        designationTitle: 'Company Directory',
        departmentName: 'All Departments',
        employeeCode: 'ORG',
        profilePhoto: null,
        directReports: finalRoots[0]?.employeeId === 'virtual-org-root' ? finalRoots[0].directReports : [],
        reportingManagerId: null
      }
    }
    return nodeMap.get(selectedEmployeeId)
  }, [selectedEmployeeId, nodeMap, finalRoots])

  // Graceful empty state checks
  const renderCanvasContent = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: 400 }}>
          <Spin size="large" />
        </div>
      )
    }

    if (flatNodes.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '60px 20px', textAlign: 'center' }}>
          <ApartmentOutlined style={{ fontSize: 48, color: 'var(--color-text-muted)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            No employees found.
          </h3>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 400 }}>
            There are no active employees in the directory.
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
            Reporting hierarchy has not been configured yet.
          </h3>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 400 }}>
            To view the organization chart, please assign reporting managers to employees in the directory.
          </p>
        </div>
      )
    }

    return (
      <div 
        style={{ 
          transform: `scale(${zoomScale})`, 
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease',
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
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <PageHeader
        title="Org Explorer"
        subtitle="Explore reporting lines, department hierarchies, and employee chains"
        breadcrumbs={[{ label: 'Home', path: '/dashboard' }, { label: 'Org Chart' }]}
        actions={
          <Space>
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
            <Button icon={<AimOutlined />} onClick={handleCenterRoot} disabled={finalRoots.length === 0}>
              Center Root
            </Button>
          </Space>
        }
      />

      {/* Explorer Canvas Container */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          background: isDarkMode ? '#0A0D24' : '#f5f7ff',
          borderRadius: 16,
          border: 'var(--border-glass)',
          padding: 40,
          overflow: 'auto',
          minHeight: 500,
          maxHeight: '70vh',
          position: 'relative',
          textAlign: 'center',
          boxShadow: 'var(--shadow-subtle)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        {renderCanvasContent()}

        {/* Zoom Controls */}
        {!isLoading && flatNodes.length > 0 && (
          <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 30, display: 'flex', gap: 6 }}>
            <Button size="small" onClick={() => setZoomScale(s => Math.max(s - 0.1, 0.5))}>-</Button>
            <Tag style={{ margin: 0, padding: '0 8px', alignSelf: 'center', height: 24, display: 'flex', alignItems: 'center', borderRadius: 6 }}>{Math.round(zoomScale * 100)}%</Tag>
            <Button size="small" onClick={() => setZoomScale(s => Math.min(s + 0.1, 1.5))}>+</Button>
          </div>
        )}
      </div>

      {/* Selected Employee Quick Drawer Info */}
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
            <div style={{ height: 90, background: 'linear-gradient(135deg, #10113F 0%, #4D1B3B 100%)', position: 'relative' }}>
              <Button
                icon={<CloseOutlined />}
                onClick={() => setSelectedEmployeeId(null)}
                style={{ position: 'absolute', top: 12, right: 12, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%' }}
              />
            </div>

            <div style={{ textAlign: 'center', marginTop: -40, padding: '0 20px', zIndex: 2 }}>
              <Avatar
                size={80}
                src={selectedNodeDetails.profilePhoto}
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
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{selectedNodeDetails.designationTitle || 'No Designation'}</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <Card style={{ borderRadius: 12, border: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 12, color: '#FAA71A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Details</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div>
                     <span style={{ color: 'var(--color-text-muted)' }}>Employee ID: </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedNodeDetails.employeeCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Department: </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedNodeDetails.departmentName || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Reporting Manager: </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {(() => {
                        const mgrId = selectedNodeDetails.reportingManagerId
                        if (!mgrId) return 'None (Root Node)'
                        if (mgrId === 'virtual-org-root') return 'Organization'
                        const mgrNode = nodeMap.get(mgrId)
                        if (!mgrNode) return 'Unknown Manager'
                        return mgrNode.fullName
                      })()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Direct Reports: </span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{selectedNodeDetails.directReports?.length || 0} employees</span>
                  </div>
                </div>
              </Card>
            </div>

            {selectedNodeDetails.employeeId !== 'virtual-org-root' && (
              <div style={{ padding: 16, borderTop: 'var(--border-glass)', background: 'var(--color-card-bg)' }}>
                <Button 
                  type="primary" 
                  block 
                  style={{ borderRadius: 8, background: isDarkMode ? '#FAA71A' : '#10113F', borderColor: isDarkMode ? '#FAA71A' : '#10113F', color: isDarkMode ? '#10113F' : '#fff', fontWeight: 600 }}
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
