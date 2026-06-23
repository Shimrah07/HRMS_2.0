import { Card, Typography, List, Space, Tag } from 'antd'
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'

const { Title, Paragraph, Text } = Typography

export default function ComingSoonPage({ title, description, icon, features = [], color = '#10113F', illustration }) {
  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
        staggerChildren: 0.08
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ padding: '8px 4px' }}
    >
      <Card
        style={{
          borderRadius: 16,
          border: 'var(--border-glass)',
          boxShadow: 'var(--shadow-subtle)',
          background: 'var(--color-card-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          overflow: 'hidden',
          position: 'relative'
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        {/* Top decorative gradient bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${color} 0%, var(--color-primary) 100%)`
          }}
        />

        <div style={{ display: 'flex', gap: 36, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Icon Badge */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  background: `${color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  color: color,
                  flexShrink: 0,
                  border: `1px solid ${color}30`
                }}
              >
                {icon}
              </div>

              {/* Heading and Description */}
              <div style={{ flex: 1, minWidth: 260 }}>
                <Space align="center" style={{ marginBottom: 8 }} wrap>
                  <Title level={2} style={{ margin: 0, color: 'var(--color-text-primary)', fontWeight: 800 }}>
                    {title}
                  </Title>
                  <Tag color="warning" style={{ borderRadius: 6, fontWeight: 600, padding: '2px 8px', margin: 0 }}>
                    Coming Soon
                  </Tag>
                </Space>
                <Paragraph style={{ color: 'var(--color-text-secondary)', fontSize: 15, lineHeight: 1.6, margin: 0, maxWidth: 680 }}>
                  {description}
                </Paragraph>
              </div>
            </div>
          </div>

          {illustration && (
            <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: 240, padding: 12 }}>
              {illustration}
            </div>
          )}
        </div>

        {/* Planned Features Section */}
        {features && features.length > 0 && (
          <div style={{ marginTop: 40, borderTop: 'var(--border-glass)', paddingTop: 32 }}>
            <Title level={4} style={{ color: 'var(--color-text-primary)', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <InfoCircleOutlined style={{ fontSize: 16, color: 'var(--color-text-primary)' }} />
              Planned Features
            </Title>

            <List
              grid={{ gutter: 20, xs: 1, sm: 2, md: 2, lg: 3 }}
              dataSource={features}
              renderItem={(feature) => (
                <List.Item style={{ marginBottom: 16 }}>
                  <motion.div variants={itemVariants}>
                    <Card
                      bordered={false}
                      style={{
                        background: 'var(--color-overlay)',
                        borderRadius: 10,
                        border: 'var(--border-glass)'
                      }}
                      bodyStyle={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}
                    >
                      <CheckCircleOutlined style={{ color: color, fontSize: 15, marginTop: 2, flexShrink: 0 }} />
                      <Text style={{ color: 'var(--color-text-primary)', fontSize: 13.5, fontWeight: 500, lineHeight: 1.4 }}>
                        {feature}
                      </Text>
                    </Card>
                  </motion.div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>
    </motion.div>
  )
}

