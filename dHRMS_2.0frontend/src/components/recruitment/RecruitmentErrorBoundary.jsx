import React from 'react'
import { Result, Button, Card } from 'antd'
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons'

export default class RecruitmentErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('Recruitment Module Error Boundary caught an exception:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Card
            style={{
              maxWidth: 600,
              width: '100%',
              borderRadius: 16,
              background: 'var(--color-bg-container)',
              border: 'var(--border-glass)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
            styles={{ body: { padding: 32 } }}
          >
            <Result
              status="warning"
              icon={<WarningOutlined style={{ color: '#F59E0B', fontSize: 48 }} />}
              title={<span style={{ fontWeight: 800, fontSize: 18 }}>Recruitment Module Exception Caught</span>}
              subTitle="An unhandled UI error occurred. User inputs have been isolated safely to prevent application crash."
              extra={[
                <Button
                  type="primary"
                  key="reload"
                  icon={<ReloadOutlined />}
                  style={{ background: '#7C3AED', borderColor: '#7C3AED', fontWeight: 700 }}
                  onClick={this.handleReset}
                  data-testid="error-boundary-retry-btn"
                >
                  Reload Recruitment Workspace
                </Button>
              ]}
            />
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
