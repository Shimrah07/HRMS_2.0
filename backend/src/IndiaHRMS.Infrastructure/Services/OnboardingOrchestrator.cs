using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using IndiaHRMS.Application.DTOs.Recruitment;
using IndiaHRMS.Domain.Entities;
using IndiaHRMS.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IndiaHRMS.Infrastructure.Services;

public class OnboardingOrchestrator
{
    public async Task GenerateDefaultTasksAsync(Guid onboardingId, AppDbContext db, CancellationToken ct)
    {
        var onboarding = await db.OnboardingProcesses
            .Include(o => o.Candidate)
            .FirstOrDefaultAsync(o => o.OnboardingId == onboardingId, ct);

        if (onboarding == null) return;

        var tasks = new List<OnboardingTask>
        {
            // HR Tasks
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Welcome Email & Joining Instructions",
                Description = "Send a comprehensive welcome email containing joining date, location details, and instructions.",
                Department = "HR",
                Priority = "High",
                SLADays = 2,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)),
                Status = "Pending"
            },
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Coordinate Background Verification (BGV)",
                Description = "Initiate and coordinate standard academic and previous employment checks with the BGV agency.",
                Department = "HR",
                Priority = "Medium",
                SLADays = 1,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
                Status = "Pending"
            },
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Collect and Verify Core Documents",
                Description = "Verify physical or uploaded copies of academic certificates, PAN, Aadhaar, and experience letters.",
                Department = "HR",
                Priority = "Critical",
                SLADays = 5,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
                Status = "Pending"
            },
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Orientation Session & Welcome Kit Handover",
                Description = "Conduct company policy orientation, hand over the physical welcome kit, and facilitate ID card issuance.",
                Department = "HR",
                Priority = "Low",
                SLADays = 7,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
                Status = "Pending"
            },

            // IT Tasks
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "LAN ID & Active Directory Account Creation",
                Description = "Create LAN network credentials and provision Active Directory account for resource access.",
                Department = "IT",
                Priority = "High",
                SLADays = 3,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
                Status = "Pending"
            },
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Laptop Provisioning & Hardware Setup",
                Description = "Allocate and configure laptop hardware with the default developer/business security environment.",
                Department = "IT",
                Priority = "High",
                SLADays = 5,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
                Status = "Pending"
            },
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Corporate Email Account Generation",
                Description = "Set up corporate email (firstname.lastname@company.com) and register user under distribution groups.",
                Department = "IT",
                Priority = "High",
                SLADays = 2,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2)),
                Status = "Pending"
            },

            // Admin Tasks
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Workspace & Seat Allocation",
                Description = "Allocate seating coordinates, phone extensions, and desk workspace resources.",
                Department = "Admin",
                Priority = "Medium",
                SLADays = 5,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5)),
                Status = "Pending"
            },
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Access Card and Physical ID Creation",
                Description = "Generate access keycard and print physical company photo identification badge.",
                Department = "Admin",
                Priority = "Medium",
                SLADays = 6,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(6)),
                Status = "Pending"
            },

            // Manager Tasks
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Buddy Assignment",
                Description = "Select and assign a peer buddy employee to guide the candidate's social and workspace integration.",
                Department = "Manager",
                Priority = "Medium",
                SLADays = 3,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
                Status = "Pending"
            },
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "30-60-90 Development Plan Setup",
                Description = "Draft goals, milestones, and training plans for the candidate's initial 90 days in the team.",
                Department = "Manager",
                Priority = "Medium",
                SLADays = 7,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
                Status = "Pending"
            },

            // Candidate/New Joiner Tasks
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Submit Personal Details Form",
                Description = "Fill in emergency contacts, current address details, and personal contact metrics.",
                Department = "Employee",
                Priority = "Critical",
                SLADays = 3,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
                Status = "Pending"
            },
            new OnboardingTask
            {
                TaskId = Guid.NewGuid(),
                OnboardingId = onboardingId,
                TaskName = "Upload Academic and Experience Credentials",
                Description = "Upload scanned copies of highest education degrees, experience letters, and identity proof.",
                Department = "Employee",
                Priority = "Critical",
                SLADays = 3,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
                Status = "Pending"
            }
        };

        db.OnboardingTasks.AddRange(tasks);
        await db.SaveChangesAsync(ct);
    }

    public async Task<OnboardingProgressDto> CalculateProgressAsync(Guid onboardingId, AppDbContext db, CancellationToken ct)
    {
        var tasks = await db.OnboardingTasks
            .Where(t => t.OnboardingId == onboardingId)
            .ToListAsync(ct);

        if (!tasks.Any())
        {
            return new OnboardingProgressDto();
        }

        decimal GetDeptProgress(string dept)
        {
            var deptTasks = tasks.Where(t => string.Equals(t.Department, dept, StringComparison.OrdinalIgnoreCase)).ToList();
            if (!deptTasks.Any()) return 100;
            var completedCount = deptTasks.Count(t => string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase));
            return Math.Round(((decimal)completedCount / deptTasks.Count) * 100, 2);
        }

        var overallCompleted = tasks.Count(t => string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase));
        var overallProgress = Math.Round(((decimal)overallCompleted / tasks.Count) * 100, 2);

        return new OnboardingProgressDto
        {
            OverallProgress = overallProgress,
            HrProgress = GetDeptProgress("HR"),
            ItProgress = GetDeptProgress("IT"),
            AdminProgress = GetDeptProgress("Admin"),
            EmployeeProgress = GetDeptProgress("Employee"),
            ManagerProgress = GetDeptProgress("Manager")
        };
    }

    public async Task<SlaSummaryDto> GetSlaSummaryAsync(Guid onboardingId, AppDbContext db, CancellationToken ct)
    {
        var tasks = await db.OnboardingTasks
            .Where(t => t.OnboardingId == onboardingId)
            .ToListAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var completed = tasks.Count(t => string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase));
        var overdue = tasks.Count(t => !string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) && t.DueDate.HasValue && t.DueDate.Value < today);
        var dueToday = tasks.Count(t => !string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) && t.DueDate.HasValue && t.DueDate.Value == today);
        var upcoming = tasks.Count(t => !string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) && t.DueDate.HasValue && t.DueDate.Value > today);
        var escalated = tasks.Count(t => string.Equals(t.Status, "Blocked", StringComparison.OrdinalIgnoreCase) || (!string.Equals(t.Status, "Completed", StringComparison.OrdinalIgnoreCase) && t.DueDate.HasValue && t.DueDate.Value < today.AddDays(-3)));

        return new SlaSummaryDto
        {
            Completed = completed,
            Overdue = overdue,
            DueToday = dueToday,
            Upcoming = upcoming,
            Escalated = escalated
        };
    }
}
