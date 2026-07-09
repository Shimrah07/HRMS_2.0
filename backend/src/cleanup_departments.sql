-- Delete Teams referencing seeded sub-departments
DELETE FROM Teams WHERE SubDeptId IN ('B5164B24-A32D-4E21-90F2-DCAE34A5B3E9', 'F382290F-EBAC-42E8-80B2-7872F632ABF1');

-- Delete Seeded SubDepartments
DELETE FROM SubDepartments WHERE SubDeptId IN ('B5164B24-A32D-4E21-90F2-DCAE34A5B3E9', 'F382290F-EBAC-42E8-80B2-7872F632ABF1');

-- Note: Seeded parent departments (HR, IT, etc.) are referenced by seeded employees/users.
-- Thus, to preserve database integrity, they are NOT deleted.
