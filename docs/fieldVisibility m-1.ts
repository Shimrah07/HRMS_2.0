// Re-exporting from canonical shared RBAC module
export {
  RoleCode,
  Access,
  PII_FIELDS,
  GENERAL_FIELDS,
  FIELD_MATRIX,
  getFieldAccess,
  applyFieldVisibility,
  SELF_SERVICE_EDITABLE_FIELDS,
  SENSITIVE_FIELDS_REQUIRING_APPROVAL
} from "./rbac/fieldVisibility";
