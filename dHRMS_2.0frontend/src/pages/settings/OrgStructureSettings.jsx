import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tabs, Table, Button, Tag, Modal, Form, Input, Select, Switch, Space, Card, notification, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ApartmentOutlined, ClusterOutlined, IdcardOutlined, DollarOutlined } from '@ant-design/icons'
import { organizationService } from '../../services/organizationService'
import { usePermission } from '../../hooks/usePermission'
import { PERMISSIONS } from '../../constants/permissions'
import { motion } from 'framer-motion'

export default function OrgStructureSettings() {
  const queryClient = useQueryClient()
  const { can } = usePermission()
  const [activeTab, setActiveTab] = useState('placement')
  const [activeSubTab, setActiveSubTab] = useState('bu')
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  const isEditable = can(PERMISSIONS.COMPANY_SETUP.EDIT) || can(PERMISSIONS.COMPANY_SETUP.CREATE)
  const isDeletable = can(PERMISSIONS.COMPANY_SETUP.DELETE)

  // ─── Placement Queries ───────────────────────────────────────────
  const { data: businessUnitsRes, isLoading: loadingBU } = useQuery({
    queryKey: ['business-units'],
    queryFn: organizationService.getBusinessUnits,
  })
  const businessUnits = businessUnitsRes?.data || []

  const { data: divisionsRes, isLoading: loadingDivs } = useQuery({
    queryKey: ['divisions'],
    queryFn: () => organizationService.getDivisions(),
  })
  const divisions = divisionsRes?.data || []

  const { data: departmentsRes } = useQuery({
    queryKey: ['departments'],
    queryFn: organizationService.getDepartments,
  })
  // Flat list of departments for dropdowns
  const flattenDepartments = (depts) => {
    let flat = []
    depts.forEach(d => {
      flat.push(d)
      if (d.children && d.children.length > 0) {
        flat = flat.concat(flattenDepartments(d.children))
      }
    })
    return flat
  }
  const departments = flattenDepartments(departmentsRes?.data || [])

  const { data: subDeptsRes, isLoading: loadingSubDepts } = useQuery({
    queryKey: ['sub-departments'],
    queryFn: () => organizationService.getSubDepartments(),
  })
  const subDepartments = subDeptsRes?.data || []

  const { data: teamsRes, isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => organizationService.getTeams(),
  })
  const teams = teamsRes?.data || []

  // ─── Classifications Queries ─────────────────────────────────────
  const { data: gradesRes, isLoading: loadingGrades } = useQuery({
    queryKey: ['grades'],
    queryFn: organizationService.getGrades,
  })
  const grades = gradesRes?.data || []

  const { data: bandsRes, isLoading: loadingBands } = useQuery({
    queryKey: ['bands'],
    queryFn: organizationService.getBands,
  })
  const bands = bandsRes?.data || []

  const { data: jobFamiliesRes, isLoading: loadingJobFamilies } = useQuery({
    queryKey: ['job-families'],
    queryFn: organizationService.getJobFamilies,
  })
  const jobFamilies = jobFamiliesRes?.data || []

  const { data: jobFunctionsRes, isLoading: loadingJobFunctions } = useQuery({
    queryKey: ['job-functions'],
    queryFn: () => organizationService.getJobFunctions(),
  })
  const jobFunctions = jobFunctionsRes?.data || []

  // ─── Cost Accounting Queries ─────────────────────────────────────
  const { data: costCentersRes, isLoading: loadingCostCenters } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: organizationService.getCostCenters,
  })
  const costCenters = costCentersRes?.data || []

  const { data: profitCentersRes, isLoading: loadingProfitCenters } = useQuery({
    queryKey: ['profit-centers'],
    queryFn: organizationService.getProfitCenters,
  })
  const profitCenters = profitCentersRes?.data || []

  // ─── Mutations ──────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: ({ type, payload }) => {
      switch (type) {
        case 'bu': return organizationService.createBusinessUnit(payload)
        case 'div': return organizationService.createDivision(payload)
        case 'sub': return organizationService.createSubDepartment(payload)
        case 'team': return organizationService.createTeam(payload)
        case 'grade': return organizationService.createGrade(payload)
        case 'band': return organizationService.createBand(payload)
        case 'jf': return organizationService.createJobFamily(payload)
        case 'jfn': return organizationService.createJobFunction(payload)
        case 'cc': return organizationService.createCostCenter(payload)
        case 'pc': return organizationService.createProfitCenter(payload)
        default: throw new Error('Invalid type')
      }
    },
    onSuccess: (res, variables) => {
      if (res.success) {
        notification.success({ message: 'Success', description: 'Item created successfully.' })
        invalidateTypeQuery(variables.type)
        setIsModalOpen(false)
        form.resetFields()
      } else {
        notification.error({ message: 'Error', description: res.message || 'Failed to create.' })
      }
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ type, id, payload }) => {
      switch (type) {
        case 'bu': return organizationService.updateBusinessUnit(id, payload)
        case 'div': return organizationService.updateDivision(id, payload)
        case 'sub': return organizationService.updateSubDepartment(id, payload)
        case 'team': return organizationService.updateTeam(id, payload)
        case 'grade': return organizationService.updateGrade(id, payload)
        case 'band': return organizationService.updateBand(id, payload)
        case 'jf': return organizationService.updateJobFamily(id, payload)
        case 'jfn': return organizationService.updateJobFunction(id, payload)
        case 'pc': return organizationService.updateProfitCenter(id, payload)
        default: throw new Error('Invalid update type')
      }
    },
    onSuccess: (res, variables) => {
      if (res.success) {
        notification.success({ message: 'Success', description: 'Item updated successfully.' })
        invalidateTypeQuery(variables.type)
        setIsModalOpen(false)
        setEditingItem(null)
        form.resetFields()
      } else {
        notification.error({ message: 'Error', description: res.message || 'Failed to update.' })
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }) => {
      switch (type) {
        case 'bu': return organizationService.deleteBusinessUnit(id)
        case 'div': return organizationService.deleteDivision(id)
        case 'sub': return organizationService.deleteSubDepartment(id)
        case 'team': return organizationService.deleteTeam(id)
        case 'grade': return organizationService.deleteGrade(id)
        case 'band': return organizationService.deleteBand(id)
        case 'jf': return organizationService.deleteJobFamily(id)
        case 'jfn': return organizationService.deleteJobFunction(id)
        case 'pc': return organizationService.deleteProfitCenter(id)
        default: throw new Error('Invalid delete type')
      }
    },
    onSuccess: (res, variables) => {
      if (res.success) {
        notification.success({ message: 'Deactivated', description: 'Item deactivated successfully.' })
        invalidateTypeQuery(variables.type)
      } else {
        notification.error({ message: 'Error', description: res.message || 'Failed to deactivate.' })
      }
    }
  })

  const invalidateTypeQuery = (type) => {
    switch (type) {
      case 'bu': queryClient.invalidateQueries({ queryKey: ['business-units'] }); break
      case 'div': queryClient.invalidateQueries({ queryKey: ['divisions'] }); break
      case 'sub': queryClient.invalidateQueries({ queryKey: ['sub-departments'] }); break
      case 'team': queryClient.invalidateQueries({ queryKey: ['teams'] }); break
      case 'grade': queryClient.invalidateQueries({ queryKey: ['grades'] }); break
      case 'band': queryClient.invalidateQueries({ queryKey: ['bands'] }); break
      case 'jf': queryClient.invalidateQueries({ queryKey: ['job-families'] }); break
      case 'jfn': queryClient.invalidateQueries({ queryKey: ['job-functions'] }); break
      case 'cc': queryClient.invalidateQueries({ queryKey: ['cost-centers'] }); break
      case 'pc': queryClient.invalidateQueries({ queryKey: ['profit-centers'] }); break
    }
  }

  // Handle Dialog Save
  const handleSave = (values) => {
    const payload = { ...values }
    if (editingItem) {
      updateMutation.mutate({ type: activeSubTab, id: editingItem.id, payload })
    } else {
      createMutation.mutate({ type: activeSubTab, payload })
    }
  }

  const openAddModal = () => {
    setEditingItem(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const openEditModal = (record, idField) => {
    setEditingItem({ id: record[idField], ...record })
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  const handleDelete = (id, type) => {
    Modal.confirm({
      title: 'Are you sure you want to deactivate this item?',
      content: 'This item will no longer be available for new employee assignments.',
      okText: 'Deactivate',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteMutation.mutateAsync({ type, id })
    })
  }

  // ─── Table Columns and Configuration ────────────────────────────────
  const getTableColumns = (type) => {
    const baseColumns = [
      { title: 'Code', dataIndex: 'code', key: 'code', width: '20%' },
      { title: 'Name', dataIndex: 'name', key: 'name', width: '40%' },
      { 
        title: 'Status', 
        dataIndex: 'isActive', 
        key: 'isActive',
        width: '15%',
        render: (active) => active ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>
      }
    ]

    // Extend columns depending on type
    if (type === 'div') {
      baseColumns.splice(2, 0, {
        title: 'Business Unit',
        dataIndex: ['businessUnit', 'name'],
        key: 'buName',
        render: (v, record) => record.businessUnit?.name || '—'
      })
    } else if (type === 'sub') {
      baseColumns.splice(2, 0, {
        title: 'Department',
        dataIndex: 'departmentName',
        key: 'deptName',
        render: (v, record) => record.departmentName || '—'
      })
    } else if (type === 'team') {
      baseColumns.splice(2, 0, {
        title: 'Sub-Department',
        dataIndex: 'subDepartmentName',
        key: 'subDeptName',
        render: (v, record) => record.subDepartmentName || '—'
      })
    } else if (type === 'grade') {
      baseColumns.splice(2, 0, {
        title: 'Notice Period',
        dataIndex: 'noticePeriodDays',
        key: 'noticePeriodDays',
        render: (days) => `${days} days`
      })
    } else if (type === 'jfn') {
      baseColumns.splice(2, 0, {
        title: 'Job Family',
        dataIndex: ['jobFamily', 'name'],
        key: 'jobFamilyName',
        render: (v, record) => record.jobFamily?.name || '—'
      })
    } else if (type === 'cc') {
      return [
        { title: 'Code', dataIndex: 'costCenterCode', key: 'code' },
        { title: 'Name', dataIndex: 'costCenterName', key: 'name' },
        { 
          title: 'Status', 
          dataIndex: 'isActive', 
          key: 'isActive',
          render: (active) => active ? <Tag color="success">Active</Tag> : <Tag color="error">Inactive</Tag>
        },
        {
          title: 'Actions',
          key: 'actions',
          render: (_, record) => isEditable ? (
            <Tooltip title="Management through Cost Center module">
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>System Managed</span>
            </Tooltip>
          ) : '—'
        }
      ]
    }

    // Append actions for editable ones
    const idField = getIdField(type)
    baseColumns.push({
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <Space size="middle">
          {isEditable && (
            <Button 
              type="text" 
              icon={<EditOutlined style={{ color: 'var(--color-primary)' }} />} 
              onClick={() => openEditModal(record, idField)}
            />
          )}
          {isDeletable && record.isActive && (
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record[idField], type)}
            />
          )}
        </Space>
      )
    })

    return baseColumns
  }

  const getIdField = (type) => {
    switch (type) {
      case 'bu': return 'businessUnitId'
      case 'div': return 'divisionId'
      case 'sub': return 'subDeptId'
      case 'team': return 'teamId'
      case 'grade': return 'gradeId'
      case 'band': return 'bandId'
      case 'jf': return 'jobFamilyId'
      case 'jfn': return 'jobFunctionId'
      case 'cc': return 'costCenterId'
      case 'pc': return 'profitCenterId'
      default: return 'id'
    }
  }

  const getTableData = (type) => {
    switch (type) {
      case 'bu': return businessUnits
      case 'div': return divisions
      case 'sub': return subDepartments
      case 'team': return teams
      case 'grade': return grades
      case 'band': return bands
      case 'jf': return jobFamilies
      case 'jfn': return jobFunctions
      case 'cc': return costCenters
      case 'pc': return profitCenters
      default: return []
    }
  }

  const getLoadingState = (type) => {
    switch (type) {
      case 'bu': return loadingBU
      case 'div': return loadingDivs
      case 'sub': return loadingSubDepts
      case 'team': return loadingTeams
      case 'grade': return loadingGrades
      case 'band': return loadingBands
      case 'jf': return loadingJobFamilies
      case 'jfn': return loadingJobFunctions
      case 'cc': return loadingCostCenters
      case 'pc': return loadingProfitCenters
      default: return false
    }
  }

  const getModalTitle = () => {
    const prefix = editingItem ? 'Edit' : 'Add'
    switch (activeSubTab) {
      case 'bu': return `${prefix} Business Unit`
      case 'div': return `${prefix} Division`
      case 'sub': return `${prefix} Sub-Department`
      case 'team': return `${prefix} Team`
      case 'grade': return `${prefix} Grade`
      case 'band': return `${prefix} Band`
      case 'jf': return `${prefix} Job Family`
      case 'jfn': return `${prefix} Job Function`
      case 'pc': return `${prefix} Profit Center`
      default: return ''
    }
  }

  const renderFormFields = () => {
    return (
      <>
        <Form.Item 
          name="code" 
          label="Code" 
          rules={[{ required: true, message: 'Code is required' }, { max: 20, message: 'Max 20 chars' }]}
        >
          <Input style={{ borderRadius: 8 }} placeholder="e.g. BU-TECH, G-M1" />
        </Form.Item>
        <Form.Item 
          name="name" 
          label="Name" 
          rules={[{ required: true, message: 'Name is required' }, { max: 100, message: 'Max 100 chars' }]}
        >
          <Input style={{ borderRadius: 8 }} placeholder="e.g. Technology, Grade A" />
        </Form.Item>

        {activeSubTab === 'div' && (
          <Form.Item 
            name="businessUnitId" 
            label="Parent Business Unit" 
            rules={[{ required: true, message: 'Please select Business Unit' }]}
          >
            <Select style={{ borderRadius: 8 }} placeholder="Select Business Unit">
              {businessUnits.map(b => (
                <Select.Option key={b.businessUnitId} value={b.businessUnitId}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {activeSubTab === 'sub' && (
          <Form.Item 
            name="deptId" 
            label="Parent Department" 
            rules={[{ required: true, message: 'Please select Department' }]}
          >
            <Select style={{ borderRadius: 8 }} placeholder="Select Department" showSearch optionFilterProp="children">
              {departments.map(d => (
                <Select.Option key={d.deptId} value={d.deptId}>{d.deptName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {activeSubTab === 'team' && (
          <Form.Item 
            name="subDeptId" 
            label="Parent Sub-Department" 
            rules={[{ required: true, message: 'Please select Sub-Department' }]}
          >
            <Select style={{ borderRadius: 8 }} placeholder="Select Sub-Department" showSearch optionFilterProp="children">
              {subDepartments.map(s => (
                <Select.Option key={s.subDeptId} value={s.subDeptId}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {activeSubTab === 'jfn' && (
          <Form.Item 
            name="jobFamilyId" 
            label="Job Family" 
            rules={[{ required: true, message: 'Please select Job Family' }]}
          >
            <Select style={{ borderRadius: 8 }} placeholder="Select Job Family">
              {jobFamilies.map(j => (
                <Select.Option key={j.jobFamilyId} value={j.jobFamilyId}>{j.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {activeSubTab === 'grade' && (
          <Form.Item 
            name="noticePeriodDays" 
            label="Default Notice Period (Days)" 
            rules={[
              { required: true, message: 'Notice period is required' },
              {
                validator: (_, value) => {
                  const num = parseInt(value, 10)
                  if (isNaN(num) || num < 0 || num > 365) {
                    return Promise.reject('Must be between 0 and 365 days')
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input type="number" min={0} max={365} style={{ borderRadius: 8 }} placeholder="e.g. 60" />
          </Form.Item>
        )}
      </>
    )
  }

  const subTabsConfig = {
    placement: [
      { key: 'bu', label: 'Business Unit', icon: <ApartmentOutlined /> },
      { key: 'div', label: 'Division', icon: <ClusterOutlined /> },
      { key: 'sub', label: 'Sub-Department', icon: <ClusterOutlined /> },
      { key: 'team', label: 'Team / Section', icon: <ClusterOutlined /> },
    ],
    classifications: [
      { key: 'grade', label: 'Grade', icon: <IdcardOutlined /> },
      { key: 'band', label: 'Band / Level', icon: <IdcardOutlined /> },
      { key: 'jf', label: 'Job Family', icon: <IdcardOutlined /> },
      { key: 'jfn', label: 'Job Function', icon: <IdcardOutlined /> },
    ],
    accounting: [
      { key: 'cc', label: 'Cost Center', icon: <DollarOutlined /> },
      { key: 'pc', label: 'Profit Center', icon: <DollarOutlined /> },
    ]
  }

  // When changing outer tabs, reset inner tab
  const handleTabChange = (key) => {
    setActiveTab(key)
    setActiveSubTab(subTabsConfig[key][0].key)
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        
        {/* Outer sidebar structure settings tab navigation */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <Card 
            bordered={false} 
            style={{ 
              borderRadius: 12, 
              border: 'var(--border-glass)', 
              background: 'var(--color-card-bg)',
              boxShadow: 'var(--shadow-glass)'
            }}
            bodyStyle={{ padding: 12 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Button 
                type={activeTab === 'placement' ? 'primary' : 'text'}
                onClick={() => handleTabChange('placement')}
                style={{ textAlign: 'left', borderRadius: 8, height: 40 }}
                icon={<ApartmentOutlined />}
              >
                Placement Hierarchy
              </Button>
              <Button 
                type={activeTab === 'classifications' ? 'primary' : 'text'}
                onClick={() => handleTabChange('classifications')}
                style={{ textAlign: 'left', borderRadius: 8, height: 40 }}
                icon={<IdcardOutlined />}
              >
                Grades & Job Arch
              </Button>
              <Button 
                type={activeTab === 'accounting' ? 'primary' : 'text'}
                onClick={() => handleTabChange('accounting')}
                style={{ textAlign: 'left', borderRadius: 8, height: 40 }}
                icon={<DollarOutlined />}
              >
                Cost Accounting
              </Button>
            </div>
          </Card>
        </div>

        {/* Inner Content Area */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <motion.div 
            key={activeTab} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.2 }}
          >
            <Card 
              bordered={false} 
              style={{ 
                borderRadius: 12, 
                border: 'var(--border-glass)', 
                background: 'var(--color-card-bg)',
                boxShadow: 'var(--shadow-glass)'
              }}
            >
              {/* Inner sub-tabs switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <Tabs 
                  activeKey={activeSubTab} 
                  onChange={setActiveSubTab} 
                  type="card"
                  items={subTabsConfig[activeTab].map(st => ({
                    key: st.key,
                    label: <span>{st.icon} {st.label}</span>
                  }))}
                  style={{ marginBottom: 0 }}
                />

                {isEditable && activeSubTab !== 'cc' && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    style={{ borderRadius: 8 }}
                    onClick={openAddModal}
                  >
                    Add {subTabsConfig[activeTab].find(t => t.key === activeSubTab)?.label}
                  </Button>
                )}
              </div>

              {/* Data Table */}
              <div className="glass-table-wrapper" style={{ overflowX: 'auto' }}>
                <Table 
                  columns={getTableColumns(activeSubTab)} 
                  dataSource={getTableData(activeSubTab)} 
                  rowKey={getIdField(activeSubTab)}
                  loading={getLoadingState(activeSubTab)}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                />
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Shared Create/Edit Modal */}
      <Modal
        title={getModalTitle()}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" style={{ borderRadius: 8 }} onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            style={{ borderRadius: 8 }} 
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={() => form.submit()}
          >
            Save
          </Button>
        ]}
        destroyOnClose
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSave} 
          style={{ marginTop: 16 }}
        >
          {renderFormFields()}
        </Form>
      </Modal>
    </div>
  )
}
