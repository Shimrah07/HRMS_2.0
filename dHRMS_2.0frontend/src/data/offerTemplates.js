export const OFFER_TEMPLATES = [
  {
    id: 'tpl_corporate',
    name: 'Standard Corporate Offer',
    category: 'Corporate',
    description: 'Clean, structured, and formal offer layout for corporate standard positions.',
    themeColor: '#7C3AED',
    badgeColor: 'purple',
    isDefault: true,
    isActive: true,
    headerTitle: 'EMPLOYMENT OFFER LETTER',
    introText: 'We are pleased to extend an offer of employment for the position of {jobTitle} at {companyName}.',
    clauses: ['Standard NDA & Confidentiality', 'Background Verification Clause', 'Standard Notice Period']
  },
  {
    id: 'tpl_modern',
    name: 'Modern Professional',
    category: 'Professional',
    description: 'Sleek, contemporary design with vibrant accents for tech and product teams.',
    themeColor: '#06B6D4',
    badgeColor: 'cyan',
    isDefault: false,
    isActive: true,
    headerTitle: 'JOIN OUR TEAM — OFFER LETTER',
    introText: 'Welcome aboard! We are thrilled to invite you to join {companyName} as a {jobTitle}.',
    clauses: ['Intellectual Property Agreement', 'Flexible Work Guidelines', 'Equipment Provision']
  },
  {
    id: 'tpl_executive',
    name: 'Executive Offer',
    category: 'Leadership',
    description: 'Premium executive layout featuring ESOP schedule, relocation, and leadership perks.',
    themeColor: '#D97706',
    badgeColor: 'gold',
    isDefault: false,
    isActive: true,
    headerTitle: 'EXECUTIVE APPOINTMENT LETTER',
    introText: 'It is our privilege to offer you the executive role of {jobTitle} at {companyName}.',
    clauses: ['Executive Confidentiality', 'Non-Compete Agreement', 'ESOP Grant Schedule', 'Relocation Support']
  },
  {
    id: 'tpl_campus',
    name: 'Campus Hiring',
    category: 'Entry Level',
    description: 'Tailored for fresh graduates with training roadmap and probation milestones.',
    themeColor: '#22C55E',
    badgeColor: 'green',
    isDefault: false,
    isActive: true,
    headerTitle: 'GRADUATE OFFER OF EMPLOYMENT',
    introText: 'Congratulations! Following your successful campus placement evaluation, we are happy to offer you the role of {jobTitle}.',
    clauses: ['6-Month Graduate Training Program', 'Probationary Assessment', 'Service Agreement']
  },
  {
    id: 'tpl_internship',
    name: 'Internship Offer',
    category: 'Trainee',
    description: 'Lightweight stipend & project milestone offer for interns and trainees.',
    themeColor: '#3B82F6',
    badgeColor: 'blue',
    isDefault: false,
    isActive: true,
    headerTitle: 'INTERNSHIP ENGAGEMENT LETTER',
    introText: 'We are excited to offer you an internship opportunity as {jobTitle} at {companyName}.',
    clauses: ['Project Milestone Completion', 'Stipend Schedule', 'Certificate of Completion']
  }
]

// Auto Salary Breakdown Calculator Engine (13 Components)
export function calculateSalaryBreakdown(ctcAnnual, manualOverride = false, customComponents = {}) {
  const ctc = Number(ctcAnnual) || 0

  if (manualOverride && customComponents && Object.keys(customComponents).length > 0) {
    const basic = Number(customComponents.basic) || 0
    const hra = Number(customComponents.hra) || 0
    const specialAllowance = Number(customComponents.specialAllowance) || 0
    const employerPf = Number(customComponents.employerPf) || 0
    const employeePf = Number(customComponents.employeePf) || Math.min(Math.round(basic * 0.12), 21600)
    const gratuity = Number(customComponents.gratuity) || 0
    const performanceBonus = Number(customComponents.performanceBonus) || 0
    const variablePay = Number(customComponents.variablePay) || 0
    const retentionBonus = Number(customComponents.retentionBonus) || 0
    const joiningBonus = Number(customComponents.joiningBonus) || 0
    const relocationAllowance = Number(customComponents.relocationAllowance) || 0
    const esops = Number(customComponents.esops) || 0
    const otherAllowances = Number(customComponents.otherAllowances) || 0

    const monthlyGross = Math.round((basic + hra + specialAllowance + performanceBonus / 12 + variablePay / 12 + otherAllowances / 12) / 12)
    const monthlyEmployeePf = Math.round(employeePf / 12)
    const monthlyInHand = Math.max(0, monthlyGross - monthlyEmployeePf)
    const totalEmployerCost = basic + hra + specialAllowance + employerPf + gratuity + performanceBonus + variablePay + retentionBonus + esops + otherAllowances

    // Percentages
    const basicPct = ctc > 0 ? Math.round((basic / ctc) * 100) : 0
    const hraPct = ctc > 0 ? Math.round((hra / ctc) * 100) : 0
    const specialPct = ctc > 0 ? Math.round((specialAllowance / ctc) * 100) : 0
    const statutoryPct = ctc > 0 ? Math.round(((employerPf + gratuity) / ctc) * 100) : 0
    const bonusPct = ctc > 0 ? Math.round(((performanceBonus + variablePay) / ctc) * 100) : 0

    return {
      ctcAnnual: ctc,
      basicAnnual: basic,
      hraAnnual: hra,
      specialAllowanceAnnual: specialAllowance,
      employerPfAnnual: employerPf,
      employeePfAnnual: employeePf,
      gratuityAnnual: gratuity,
      performanceBonusAnnual: performanceBonus,
      variablePayAnnual: variablePay,
      retentionBonusAnnual: retentionBonus,
      joiningBonusOneTime: joiningBonus,
      relocationAllowanceOneTime: relocationAllowance,
      esopsAnnual: esops,
      otherAllowancesAnnual: otherAllowances,
      monthlyGross,
      monthlyInHand,
      totalEmployerCost,
      basicPct,
      hraPct,
      specialPct,
      statutoryPct,
      bonusPct,
      isManual: true
    }
  }

  // Standard Auto-calculation:
  // Basic = 50% CTC
  // HRA = 40% Basic (20% CTC)
  // Employer PF = 12% Basic (capped at 1,800/mo -> 21,600/yr)
  // Employee PF = 12% Basic (capped at 1,800/mo -> 21,600/yr)
  // Gratuity = 4.81% Basic
  // Special Allowance = Remainder
  const basicAnnual = Math.round(ctc * 0.5)
  const hraAnnual = Math.round(basicAnnual * 0.4)
  const employerPfAnnual = Math.min(Math.round(basicAnnual * 0.12), 21600)
  const employeePfAnnual = Math.min(Math.round(basicAnnual * 0.12), 21600)
  const gratuityAnnual = Math.round(basicAnnual * 0.0481)
  const remainder = ctc - (basicAnnual + hraAnnual + employerPfAnnual + gratuityAnnual)
  const specialAllowanceAnnual = Math.max(0, Math.round(remainder))

  const monthlyGross = Math.round((basicAnnual + hraAnnual + specialAllowanceAnnual) / 12)
  const monthlyInHand = Math.max(0, monthlyGross - Math.round(employeePfAnnual / 12))

  const basicPct = ctc > 0 ? Math.round((basicAnnual / ctc) * 100) : 50
  const hraPct = ctc > 0 ? Math.round((hraAnnual / ctc) * 100) : 20
  const specialPct = ctc > 0 ? Math.round((specialAllowanceAnnual / ctc) * 100) : 24
  const statutoryPct = ctc > 0 ? Math.round(((employerPfAnnual + gratuityAnnual) / ctc) * 100) : 6
  const bonusPct = 0

  return {
    ctcAnnual: ctc,
    basicAnnual,
    hraAnnual,
    specialAllowanceAnnual,
    employerPfAnnual,
    employeePfAnnual,
    gratuityAnnual,
    performanceBonusAnnual: 0,
    variablePayAnnual: 0,
    retentionBonusAnnual: 0,
    joiningBonusOneTime: 0,
    relocationAllowanceOneTime: 0,
    esopsAnnual: 0,
    otherAllowancesAnnual: 0,
    monthlyGross,
    monthlyInHand,
    totalEmployerCost: ctc,
    basicPct,
    hraPct,
    specialPct,
    statutoryPct,
    bonusPct,
    isManual: false
  }
}

// Offer Readiness Validation Engine
export function calculateOfferReadiness(offer) {
  const checklist = [
    { key: 'candidate', label: 'Candidate Selected', ok: Boolean(offer?.appId) },
    { key: 'salary', label: 'Salary Configured', ok: Boolean(offer?.offeredCTC && offer.offeredCTC > 0) },
    { key: 'doj', label: 'DOJ Selected', ok: Boolean(offer?.joiningDate) },
    { key: 'manager', label: 'Reporting Manager Assigned', ok: Boolean(offer?.reportingManager || offer?.managerName || true) },
    { key: 'template', label: 'Template Selected', ok: Boolean(offer?.templateId) },
    { key: 'clauses', label: 'Clauses Configured', ok: Boolean(offer?.ndaRequired !== undefined) },
    { key: 'validity', label: 'Validity Period Set', ok: Boolean(offer?.expiryDays && offer.expiryDays > 0) },
    { key: 'compensationValid', label: 'Compensation Validated', ok: Boolean(offer?.offeredCTC >= 100000) },
    { key: 'approval', label: 'Multi-Level Approval Completed', ok: offer?.status === 'Approved' || offer?.status === 'Sent' || offer?.status === 'Accepted' }
  ]

  const passedCount = checklist.filter(item => item.ok).length
  const scorePercent = Math.round((passedCount / checklist.length) * 100)
  const isReadyToSend = scorePercent >= 88

  return { checklist, passedCount, totalCount: checklist.length, scorePercent, isReadyToSend }
}

// Dynamic Expiry Countdown Calculator & Color Badge
export function getExpiryCountdown(expiryDateStr) {
  if (!expiryDateStr) return { text: 'No Expiry', color: 'default', badgeColor: 'gray', days: 999 }
  
  const now = new Date()
  const exp = new Date(expiryDateStr)
  const diffTime = exp - now
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (daysLeft <= 0) {
    return { text: 'Expired', color: '#EF4444', badgeColor: 'error', days: 0 }
  } else if (daysLeft <= 3) {
    return { text: `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`, color: '#EF4444', badgeColor: 'error', days: daysLeft }
  } else if (daysLeft <= 7) {
    return { text: `Expires in ${daysLeft} days`, color: '#F97316', badgeColor: 'warning', days: daysLeft }
  } else if (daysLeft <= 15) {
    return { text: `Expires in ${daysLeft} days`, color: '#EAB308', badgeColor: 'gold', days: daysLeft }
  } else {
    return { text: `Expires in ${daysLeft} days`, color: '#10B981', badgeColor: 'success', days: daysLeft }
  }
}
