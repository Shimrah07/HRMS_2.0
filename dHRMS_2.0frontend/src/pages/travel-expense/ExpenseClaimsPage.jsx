import React, { useState } from 'react'
import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import ExpenseClaimsContent from './ExpenseClaimsContent'

export default function ExpenseClaimsPage() {
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Expense Claims & OCR Bill Capture"
        breadcrumbs={[
          { label: 'Travel & Expense', path: '/travel-expense/expense-claims' },
          { label: 'Expense Claims' }
        ]}
        subtitle="Compile multi-category travel expense claims, auto-extract receipt details with OCR, and track GST Input Tax Credit (ITC)."
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setSubmitModalOpen(true)}>
            Compile Expense Claim
          </Button>
        }
      />
      <ExpenseClaimsContent
        submitModalOpen={submitModalOpen}
        setSubmitModalOpen={setSubmitModalOpen}
      />
    </div>
  )
}
