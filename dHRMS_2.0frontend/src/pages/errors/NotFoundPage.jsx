import { Result, Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px 0' }}>
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist (Coming Soon)."
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
