export const BGV_PACKAGE_TEMPLATES = [
  {
    id: 'pkg_basic',
    name: 'Basic Package',
    badgeColor: 'blue',
    description: 'Essential verification for entry-level & support roles.',
    defaultScope: ['Identity', 'Address'],
    slaDays: 7
  },
  {
    id: 'pkg_standard',
    name: 'Standard Package',
    badgeColor: 'purple',
    description: 'Comprehensive check for core engineering & operational staff.',
    defaultScope: ['Identity', 'Employment', 'Education', 'Address'],
    slaDays: 14
  },
  {
    id: 'pkg_executive',
    name: 'Executive Package',
    badgeColor: 'gold',
    description: 'Deep background verification for leadership & managerial hires.',
    defaultScope: ['Identity', 'Employment', 'Education', 'Address', 'Criminal', 'Reference', 'Credit Check'],
    slaDays: 21
  },
  {
    id: 'pkg_international',
    name: 'International Package',
    badgeColor: 'cyan',
    description: 'Global database, passport & cross-border verification.',
    defaultScope: ['Identity', 'Employment', 'Education', 'Address', 'Criminal', 'Global Database'],
    slaDays: 21
  },
  {
    id: 'pkg_custom',
    name: 'Custom Package',
    badgeColor: 'default',
    description: 'Tailored verification scope based on custom compliance rules.',
    defaultScope: ['Identity', 'Employment'],
    slaDays: 14
  }
]

export const ALL_VERIFICATION_SCOPES = [
  { key: 'Identity', label: 'Identity Verification (Aadhaar/PAN)', icon: '🆔' },
  { key: 'Employment', label: 'Past Employment Check', icon: '💼' },
  { key: 'Education', label: 'Degree & University Verification', icon: '🎓' },
  { key: 'Address', label: 'Residential Address Check', icon: '🏠' },
  { key: 'Criminal', label: 'Police & Criminal Records', icon: '⚖️' },
  { key: 'Reference', label: 'Professional References', icon: '👥' },
  { key: 'Credit Check', label: 'Financial & Credit Check', icon: '💳' },
  { key: 'Global Database', label: 'Global Compliance Watchlist', icon: '🌐' },
  { key: 'Professional License', label: 'Professional Certifications', icon: '📜' }
]

export const BGV_AGENCIES = [
  { id: 'ag_authbridge', name: 'AuthBridge Solutions', contact: '+91 98200 11223', email: 'cases@authbridge.com', defaultSla: 14 },
  { id: 'ag_firstadv', name: 'First Advantage India', contact: '+91 98111 44556', email: 'ops@fadv.co.in', defaultSla: 14 },
  { id: 'ag_matrix', name: 'Matrix Verification Services', contact: '+91 98333 77889', email: 'bgv@matrix.in', defaultSla: 10 },
  { id: 'ag_internal', name: 'Internal HR Compliance Team', contact: 'Internal', email: 'hr-compliance@indiahrms.com', defaultSla: 7 }
]

export const BGV_OUTCOMES = {
  Cleared: { label: 'Cleared', color: 'success', icon: '✔' },
  ClearedWithObservations: { label: 'Cleared with Observations', color: 'warning', icon: '⚠' },
  Failed: { label: 'Failed', color: 'error', icon: '❌' },
  ManualReviewRequired: { label: 'Manual Review Required', color: 'purple', icon: '🟡' }
}

// Calculate Case Health (Healthy / Attention Needed / Critical)
export function getCaseHealth(bgv) {
  if (!bgv) return { label: 'Healthy', color: 'success', tagColor: 'green' }

  if (bgv.status === 'Discrepancy' || bgv.riskLevel === 'Critical' || bgv.outcome === 'Failed') {
    return { label: 'Critical Risk', color: '#EF4444', tagColor: 'red' }
  } else if (bgv.status === 'SLA Breached' || bgv.riskLevel === 'High' || bgv.outcome === 'ManualReviewRequired') {
    return { label: 'Attention Needed', color: '#F97316', tagColor: 'orange' }
  } else {
    return { label: 'Healthy Progress', color: '#10B981', tagColor: 'green' }
  }
}

// Calculate Verification Confidence Score (0 - 100%)
export function getVerificationConfidence(bgv) {
  if (!bgv) return { score: 100, color: '#10B981' }
  
  if (bgv.outcome === 'Cleared') return { score: 98, color: '#10B981' }
  if (bgv.outcome === 'ClearedWithObservations') return { score: 85, color: '#EAB308' }
  if (bgv.outcome === 'Failed') return { score: 25, color: '#EF4444' }
  if (bgv.status === 'Discrepancy') return { score: 45, color: '#F97316' }

  // Default running score calculation
  const scopeCount = bgv.scope ? bgv.scope.length : 4
  const verifiedCount = bgv.verifiedCategories ? bgv.verifiedCategories.length : 1
  const baseScore = Math.round((verifiedCount / scopeCount) * 100)
  
  return {
    score: Math.max(30, Math.min(95, baseScore)),
    color: baseScore > 75 ? '#10B981' : baseScore > 50 ? '#EAB308' : '#F97316'
  }
}
