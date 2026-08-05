import React, { useState, useEffect } from 'react'
import { Card, Button, Form, Input, Switch, Select, Tag, Space, Row, Col, Typography, Alert, Table, message } from 'antd'
import { ApartmentOutlined, SettingOutlined, CheckCircleOutlined, AuditOutlined } from '@ant-design/icons'
import { travelExpenseService } from '../../services/travelExpenseService'

const { Title, Text, Paragraph } = Typography

export const SectorConfigTab = () => {
  const [sectors, setSectors] = useState([])
  const [activeSector, setActiveSector] = useState('IT')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSectorConfigs()
  }, [])

  const fetchSectorConfigs = async () => {
    setLoading(true)
    try {
      const data = await travelExpenseService.getSectorConfigs()
      setSectors(data)
      const currentActive = data.find(s => s.isDefaultActive)
      if (currentActive) setActiveSector(currentActive.sectorName)
    } catch (err) {
      console.error(err)
      // Fallback demo data
      setSectors([
        { sectorConfigId: '1', sectorName: 'IT', isDefaultActive: true, configJson: '{"requireProjectCode":true,"maxAdvancePct":80,"claimTatDays":7,"mileageRate":10}' },
        { sectorConfigId: '2', sectorName: 'Sales', isDefaultActive: false, configJson: '{"simplifiedMobileClaim":true,"frequentTravelerAllowance":true,"claimTatDays":5,"mileageRate":12}' },
        { sectorConfigId: '3', sectorName: 'Consulting', isDefaultActive: false, configJson: '{"enableBillableTagging":true,"clientMarkupPercent":10,"requireGuestDetails":true,"claimTatDays":7}' },
        { sectorConfigId: '4', sectorName: 'Government', isDefaultActive: false, configJson: '{"cpc7thPayLevelLinked":true,"auditTrailMandatory":true,"ltcIntegration":true,"claimTatDays":15}' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchSector = async (sectorName) => {
    try {
      await travelExpenseService.updateSectorConfig(sectorName, true, {})
      setActiveSector(sectorName)
      message.success(`Active Industry T&E Template switched to: ${sectorName}`)
      fetchSectorConfigs()
    } catch (err) {
      console.error(err)
      message.error('Failed to switch sector template')
    }
  }

  const cpcData = [
    { level: 'Pay Level 14+', flight: 'Business Class', train: 'AC 1st Class', hotel: '₹ 7,500/day', da: '₹ 1,200/day' },
    { level: 'Pay Level 12-13', flight: 'Economy', train: 'AC 1st Class', hotel: '₹ 4,500/day', da: '₹ 1,000/day' },
    { level: 'Pay Level 9-11', flight: 'Economy', train: 'AC 2-Tier', hotel: '₹ 2,250/day', da: '₹ 800/day' },
    { level: 'Pay Level 6-8', flight: 'N/A (Train only)', train: 'AC 2-Tier', hotel: '₹ 750/day', da: '₹ 500/day' }
  ]

  const cpcColumns = [
    { title: '7th CPC Pay Level', dataIndex: 'level', key: 'level', render: (t) => <strong>{t}</strong> },
    { title: 'Flight Entitlement', dataIndex: 'flight', key: 'flight' },
    { title: 'Train Entitlement', dataIndex: 'train', key: 'train' },
    { title: 'Halting/Hotel Cap', dataIndex: 'hotel', key: 'hotel' },
    { title: 'Daily Allowance', dataIndex: 'da', key: 'da' }
  ]

  return (
    <div style={{ padding: '16px 0' }}>
      <Alert
        message="Active Sector T&E Engine"
        description={`Current Active Sector Ruleset: ${activeSector}. Policy validations, billable tagging, and TA/DA rates automatically adapt to the active industry template.`}
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title={<Space><ApartmentOutlined style={{ color: '#722ed1' }} /><span>Industry T&E Policy Templates</span></Space>}>
            <Row gutter={[16, 16]}>
              {['IT', 'Sales', 'Consulting', 'Government', 'Healthcare', 'Construction'].map((sec) => (
                <Col span={8} key={sec}>
                  <Card
                    type="inner"
                    title={sec}
                    extra={
                      activeSector === sec ? (
                        <Tag color="green"><CheckCircleOutlined /> Active</Tag>
                      ) : (
                        <Button size="small" type="link" onClick={() => handleSwitchSector(sec)}>
                          Activate
                        </Button>
                      )
                    }
                  >
                    {sec === 'IT' && <Paragraph>Short-trip DA, project-linked cost center code required, 80% advance cap.</Paragraph>}
                    {sec === 'Sales' && <Paragraph>Mobile-first simplified claims, daily mileage @ ₹12/km, 5-day TAT limit.</Paragraph>}
                    {sec === 'Consulting' && <Paragraph>Client Billable vs Non-Billable expense tagging, 10% client markup, guest details mandatory.</Paragraph>}
                    {sec === 'Government' && <Paragraph>7th CPC Pay Level TA/DA rules, LTC Leave module integration, CAG audit readiness.</Paragraph>}
                    {sec === 'Healthcare' && <Paragraph>CME/Conference travel tracking, sponsor disclosure compliance, doctor per-diem rules.</Paragraph>}
                    {sec === 'Construction' && <Paragraph>Remote site travel, offline claim capture with sync, vehicle log verification.</Paragraph>}
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {activeSector === 'Government' && (
          <Col span={24}>
            <Card title={<Space><AuditOutlined style={{ color: '#1890ff' }} /><span>7th CPC Pay Level TA/DA Rate Schedule (Govt/PSU Rules)</span></Space>}>
              <Table columns={cpcColumns} dataSource={cpcData} pagination={false} rowKey="level" />
            </Card>
          </Col>
        )}

        {activeSector === 'Consulting' && (
          <Col span={24}>
            <Card title="Consulting Client Engagement Billable Tagging Rules">
              <Paragraph>
                Every expense line item submitted by consulting staff is tagged as <strong>Billable to Client</strong> or <strong>Non-Billable</strong>.
                Billable expenses automatically calculate client markup percentage (e.g. 10%) and export directly to client invoicing schedules.
              </Paragraph>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}
