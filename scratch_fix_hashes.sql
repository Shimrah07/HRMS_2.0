SET QUOTED_IDENTIFIER ON;
UPDATE Users
SET PasswordHash = '$2a$12$K.r4VRPCHiHJ7EzVVXF3AugL5t7wfFSoQFb0M4FrSz1aJSFWxwfOO',
    IsLocked = 0,
    FailedLoginCount = 0,
    LockedUntil = NULL;
GO
