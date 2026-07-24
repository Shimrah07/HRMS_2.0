using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PendingApplications",
                columns: table => new
                {
                    PendingAppId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    JobId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CurrentCompany = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CurrentDesignation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CurrentCTC = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                    ExpectedCTC = table.Column<decimal>(type: "decimal(12,2)", nullable: true),
                    NoticePeriodDays = table.Column<int>(type: "int", nullable: true),
                    TotalExperience = table.Column<decimal>(type: "decimal(4,1)", nullable: true),
                    Source = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResumeFilePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferralEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AppliedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingApplications", x => x.PendingAppId);
                    table.ForeignKey(
                        name: "FK_PendingApplications_Employees_ReferralEmployeeId",
                        column: x => x.ReferralEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PendingApplications_JobPostings_JobId",
                        column: x => x.JobId,
                        principalTable: "JobPostings",
                        principalColumn: "JobId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PendingApplications_JobId",
                table: "PendingApplications",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingApplications_ReferralEmployeeId",
                table: "PendingApplications",
                column: "ReferralEmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PendingApplications");
        }
    }
}
