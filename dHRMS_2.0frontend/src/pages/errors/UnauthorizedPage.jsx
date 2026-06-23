import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px 0' }}>
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button
            type="primary"
            onClick={() => navigate('/dashboard')}
            style={{ background: '#10113F', borderColor: '#10113F', borderRadius: 8, fontWeight: 600 }}
          >
            Back to Dashboard
          </Button>
        }
      />
    </div>
  )
}
