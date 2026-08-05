import React, { useState } from 'react'
import { Button } from 'antd'
import { BankOutlined } from '@ant-design/icons'
import PageHeader from '../../components/common/PageHeader'
import TravelApprovalsContent from './TravelApprovalsContent'

export default function TravelApprovalsPage() {
  const [batchModalOpen, setBatchModalOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Travel & Expense Approvals & Payouts"
        breadcrumbs={[
          { label: 'Travel & Expense', path: '/travel-expense/approvals' },
          { label: 'Approvals & Reimbursements' }
        ]}
        subtitle="Manage dual L1 Manager and L2 Finance approval queues, compute Net Payable amounts, and run reimbursement payout batches."
        actions={
          <Button type="primary" icon={<BankOutlined />} onClick={() => setBatchModalOpen(true)}>
            Run Reimbursement Payout Batch
          </Button>
        }
      />
      <TravelApprovalsContent
        batchModalOpen={batchModalOpen}
        setBatchModalOpen={setBatchModalOpen}
      />
    </div>
  )
}
