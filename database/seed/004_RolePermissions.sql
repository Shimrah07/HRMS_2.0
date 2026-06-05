-- ============================================================
-- IndiaHRMS Seed Data: Role Permissions Mapping
-- ============================================================
DECLARE @SuperAdminRoleId UNIQUEIDENTIFIER = (SELECT RoleId FROM Roles WHERE RoleCode = 'SUPER_ADMIN');

-- Map all permissions to SUPER_ADMIN role
INSERT INTO RolePermissions (RolePermissionId, RoleId, PermissionId)
SELECT NEWID(), @SuperAdminRoleId, PermissionId
FROM Permissions
WHERE PermissionId NOT IN (
    SELECT PermissionId FROM RolePermissions WHERE RoleId = @SuperAdminRoleId
);

PRINT 'All permissions mapped to SUPER_ADMIN successfully.';
