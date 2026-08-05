import { useState, useEffect } from 'react'
import { Layout, Row, Col, Card, Form, Input, InputNumber, Button, Upload, Tag, Alert, message, Select } from 'antd'
import { UploadOutlined, GlobalOutlined, ClockCircleOutlined, BookOutlined, SearchOutlined } from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { recruitmentService } from '../../services/recruitmentService'

const { Header, Content, Footer } = Layout
const { Option } = Select

export default function CareersPortalPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState(undefined)
  const [selectedJob, setSelectedJob] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const res = await recruitmentService.getPostings()
      if (res.success) {
        setJobs(res.data || [])
      }
    } catch (err) {
      console.error(err)
      message.error('Failed to load active job openings.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (job) => {
    setSelectedJob(job)
    form.resetFields()
    setResumeFile(null)
    setFormOpen(true)
  }

  const onFinish = async (values) => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('JobId', selectedJob.jobId)
      formData.append('FirstName', values.firstName)
      if (values.lastName) formData.append('LastName', values.lastName)
      formData.append('Email', values.email)
      if (values.phone) formData.append('Phone', values.phone)
      if (values.currentCompany) formData.append('CurrentCompany', values.currentCompany)
      if (values.currentDesignation) formData.append('CurrentDesignation', values.currentDesignation)
      if (values.currentCTC) formData.append('CurrentCTC', values.currentCTC)
      if (values.expectedCTC) formData.append('ExpectedCTC', values.expectedCTC)
      if (values.noticePeriodDays) formData.append('NoticePeriodDays', values.noticePeriodDays)
      if (values.totalExperience) formData.append('TotalExperience', values.totalExperience)
      formData.append('Source', 'CareerPortal')
      if (resumeFile) {
        formData.append('resumeFile', resumeFile)
      }

      const res = await recruitmentService.publicApply(formData)
      if (res.success) {
        message.success('Your application was submitted successfully! We will review it shortly.')
        setFormOpen(false)
        form.resetFields()
      } else {
        message.error(res.errors?.[0] || 'Submission failed.')
      }
    } catch (err) {
      console.error(err)
      message.error(err.response?.data?.errors?.[0] || 'An error occurred during submission.')
    } finally {
      setSubmitting(false)
    }
  }

  const departments = [...new Set(jobs.map(j => j.departmentName).filter(Boolean))]

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      (j.skillsRequired && j.skillsRequired.toLowerCase().includes(search.toLowerCase()))
    const matchesDept = !deptFilter || j.departmentName === deptFilter
    return matchesSearch && matchesDept
  })

  return (
    <Layout style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #1a103c 0%, #0d0620 50%, #06030e 100%)', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* ── Navbar ── */}
      <Header style={{ background: 'rgba(13, 6, 32, 0.75)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(160, 90, 255, 0.15)', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #FAA71A 0%, #f5c842 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, color: '#10113F', boxShadow: '0 4px 12px rgba(250,167,26,0.35)' }}>
            MP
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #FFFFFF 0%, #d8c3ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MPOSethu Careers
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
          <a href="#" style={{ color: 'rgba(255,255,255,0.7)', transition: 'color 0.25s' }} onMouseEnter={e => e.currentTarget.style.color = '#FAA71A'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Open Positions</a>
          <a href="/login" style={{ color: '#FAA71A', fontWeight: 600 }}>Recruiter Login</a>
        </div>
      </Header>

      <Content style={{ padding: '60px 40px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* ── Banner ── */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700, padding: '4px 12px', fontSize: 11, textTransform: 'uppercase', marginBottom: 16 }}>We are hiring!</Tag>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.2 }}>
            Build the Future of Digital Governance
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
            Join our mission to craft premium enterprise solutions. Explore open engineering, design, and administrative opportunities.
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="premium-glass-card" style={{ padding: 24, borderRadius: 16, border: '1px solid rgba(160, 90, 255, 0.15)', background: 'rgba(13, 6, 32, 0.4)', backdropFilter: 'blur(12px)', marginBottom: 40 }}>
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Input
                placeholder="Search job titles or keywords..."
                prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', height: 44 }}
              />
            </Col>
            <Col xs={24} md={10}>
              <Select
                placeholder="All Departments"
                allowClear
                value={deptFilter}
                onChange={v => setDeptFilter(v)}
                style={{ width: '100%' }}
                dropdownStyle={{ background: '#120b24', border: '1px solid rgba(160, 90, 255, 0.2)' }}
              >
                {departments.map(d => <Option key={d} value={d}>{d}</Option>)}
              </Select>
            </Col>
          </Row>
        </div>

        {/* ── Jobs Grid ── */}
        <Row gutter={[24, 24]}>
          <AnimatePresence>
            {filteredJobs.length === 0 ? (
              <Col span={24}>
                <div style={{ padding: '60px 0', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <BookOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.2)', marginBottom: 12 }} />
                  <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>No job openings found matching your criteria.</div>
                </div>
              </Col>
            ) : (
              filteredJobs.map(job => (
                <Col xs={24} md={12} key={job.jobId}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    whileHover={{ y: -6, boxShadow: '0 12px 30px rgba(160,90,255,0.15)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Card
                      bordered={false}
                      style={{
                        background: 'linear-gradient(135deg, rgba(26,16,60,0.5) 0%, rgba(13,6,32,0.6) 100%)',
                        borderRadius: 16,
                        border: '1px solid rgba(160, 90, 255, 0.1)',
                        color: '#fff',
                        height: '100%',
                      }}
                      bodyStyle={{ padding: 28, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600, border: 'none', background: 'rgba(160,90,255,0.2)', color: '#d8c3ff' }}>
                            {job.departmentName || 'Engineering'}
                          </Tag>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ClockCircleOutlined /> {job.employmentType || 'Full-Time'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                          {job.jobTitle}
                        </h3>

                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
                          <span><GlobalOutlined /> {job.locationName || 'Remote'}</span>
                          <span><BookOutlined /> {job.workMode || 'Hybrid'}</span>
                        </div>

                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5, lineHeight: 1.5, marginBottom: 20, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebKitLineBreak: 'strict', WebKitLineCount: 3, WebKitBoxOrient: 'vertical', height: 60 }}>
                          {job.jobDescription || 'Detailed job description will be provided upon applying.'}
                        </p>

                        {job.skillsRequired && (
                          <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#FAA71A', marginBottom: 6 }}>Skills Required</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {job.skillsRequired.split(',').slice(0, 4).map(skill => (
                                <Tag key={skill} style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, fontSize: 11 }}>{skill.trim()}</Tag>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        type="primary"
                        onClick={() => handleApply(job)}
                        style={{
                          background: 'linear-gradient(90deg, #FAA71A 0%, #f5c842 100%)',
                          border: 'none',
                          color: '#10113F',
                          fontWeight: 700,
                          borderRadius: 8,
                          height: 38,
                          width: '100%',
                        }}
                      >
                        Apply Now
                      </Button>
                    </Card>
                  </motion.div>
                </Col>
              ))
            )}
          </AnimatePresence>
        </Row>
      </Content>

      {/* ── Footer ── */}
      <Footer style={{ background: 'rgba(6, 3, 14, 0.8)', borderTop: '1px solid rgba(160, 90, 255, 0.1)', textAlign: 'center', padding: '24px 0', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
        © {new Date().getFullYear()} MPOSethu ATS Portal. All rights reserved.
      </Footer>

      {/* ── Apply Drawer/Overlay ── */}
      <AnimatePresence>
        {formOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5, 2, 12, 0.75)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              style={{ width: '100%', maxWidth: 640, background: 'linear-gradient(135deg, #13082a 0%, #0d061c 100%)', borderRadius: 20, border: '1px solid rgba(160,90,255,0.2)', padding: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflowY: 'auto', maxHeight: '90vh' }}
            >
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Apply for Position</h2>
              <div style={{ color: '#FAA71A', fontSize: 14, fontWeight: 700, marginBottom: 24 }}>{selectedJob?.jobTitle}</div>

              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="firstName" label={<span style={{ color: '#fff' }}>First Name</span>} rules={[{ required: true, message: 'First name is required' }]}>
                      <Input placeholder="John" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="lastName" label={<span style={{ color: '#fff' }}>LastName</span>}>
                      <Input placeholder="Doe" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="email" label={<span style={{ color: '#fff' }}>Email Address</span>} rules={[{ required: true, type: 'email', message: 'Valid email is required' }]}>
                      <Input placeholder="john.doe@example.com" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="phone" label={<span style={{ color: '#fff' }}>Phone Number</span>}>
                      <Input placeholder="+91 9876543210" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="currentCompany" label={<span style={{ color: '#fff' }}>Current Company</span>}>
                      <Input placeholder="Acme Inc" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="currentDesignation" label={<span style={{ color: '#fff' }}>Current Designation</span>}>
                      <Input placeholder="Software Engineer" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item name="totalExperience" label={<span style={{ color: '#fff' }}>Experience (Yrs)</span>}>
                      <InputNumber min={0} step={0.5} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="currentCTC" label={<span style={{ color: '#fff' }}>Current CTC (LPA)</span>}>
                      <InputNumber min={0} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="expectedCTC" label={<span style={{ color: '#fff' }}>Expected CTC (LPA)</span>}>
                      <InputNumber min={0} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="noticePeriodDays" label={<span style={{ color: '#fff' }}>Notice Period (Days)</span>}>
                      <InputNumber min={0} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8 }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<span style={{ color: '#fff' }}>Resume</span>} required>
                      <Upload
                        beforeUpload={file => { setResumeFile(file); return false }}
                        onRemove={() => setResumeFile(null)}
                        maxCount={1}
                        accept=".pdf,.doc,.docx"
                        fileList={resumeFile ? [{ uid: '-1', name: resumeFile.name, status: 'done' }] : []}
                      >
                        <Button icon={<UploadOutlined />} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px dashed rgba(255,255,255,0.2)' }}>Choose File</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <Button onClick={() => setFormOpen(false)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={submitting} style={{ background: 'linear-gradient(90deg, #FAA71A 0%, #f5c842 100%)', border: 'none', color: '#10113F', fontWeight: 700 }}>
                    Submit Application
                  </Button>
                </div>
              </Form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
