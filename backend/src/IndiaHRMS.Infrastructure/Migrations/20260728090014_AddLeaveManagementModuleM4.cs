using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLeaveManagementModuleM4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LeaveApplications_Users_ApproverId",
                table: "LeaveApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveTypes_Companies_CompanyId",
                table: "LeaveTypes");

            migrationBuilder.DropIndex(
                name: "IX_LeaveTypes_CompanyId",
                table: "LeaveTypes");

            migrationBuilder.AlterColumn<string>(
                name: "LeaveTypeName",
                table: "LeaveTypes",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "LeaveCode",
                table: "LeaveTypes",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "AccrualFrequency",
                table: "LeaveTypes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "AccrualRate",
                table: "LeaveTypes",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ClubbingRestrictedWith",
                table: "LeaveTypes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EncashmentRule",
                table: "LeaveTypes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MinNoticeDays",
                table: "LeaveTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "ProRataForMidYear",
                table: "LeaveTypes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SandwichRuleApplicable",
                table: "LeaveTypes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "BackupEmployeeId",
                table: "LeaveApplications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "LeaveApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HalfDayType",
                table: "LeaveApplications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Level2ApprovedAt",
                table: "LeaveApplications",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "Level2ApproverId",
                table: "LeaveApplications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LeaveEncashments",
                columns: table => new
                {
                    EncashmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LeaveTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DaysEncashed = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    DailyRate = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    TaxExemptAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    TaxableAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    ProcessedMonth = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaveEncashments", x => x.EncashmentId);
                    table.ForeignKey(
                        name: "FK_LeaveEncashments_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeaveEncashments_LeaveTypes_LeaveTypeId",
                        column: x => x.LeaveTypeId,
                        principalTable: "LeaveTypes",
                        principalColumn: "LeaveTypeId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LeaveLedgers",
                columns: table => new
                {
                    LedgerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LeaveTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TxnType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TxnDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Days = table.Column<decimal>(type: "decimal(6,2)", nullable: false),
                    RunningBalance = table.Column<decimal>(type: "decimal(6,2)", nullable: false),
                    ReferenceId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaveLedgers", x => x.LedgerId);
                    table.ForeignKey(
                        name: "FK_LeaveLedgers_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeaveLedgers_LeaveTypes_LeaveTypeId",
                        column: x => x.LeaveTypeId,
                        principalTable: "LeaveTypes",
                        principalColumn: "LeaveTypeId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LeavePolicyRules",
                columns: table => new
                {
                    PolicyRuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LeaveTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GradeCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DepartmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    QuotaOverride = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    MinNoticeDays = table.Column<int>(type: "int", nullable: true),
                    MaxConsecutiveDays = table.Column<int>(type: "int", nullable: true),
                    SandwichRule = table.Column<bool>(type: "bit", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeavePolicyRules", x => x.PolicyRuleId);
                    table.ForeignKey(
                        name: "FK_LeavePolicyRules_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "DeptId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LeavePolicyRules_LeaveTypes_LeaveTypeId",
                        column: x => x.LeaveTypeId,
                        principalTable: "LeaveTypes",
                        principalColumn: "LeaveTypeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeavePolicyRules_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "SectorLeaveConfigs",
                columns: table => new
                {
                    SectorConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IndustryType = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RuleKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RuleValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SectorLeaveConfigs", x => x.SectorConfigId);
                    table.ForeignKey(
                        name: "FK_SectorLeaveConfigs_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "CompanyId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StatutoryLeaveEvents",
                columns: table => new
                {
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    EventDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ExpectedDeliveryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ChildOrder = table.Column<int>(type: "int", nullable: false),
                    EntitlementDays = table.Column<int>(type: "int", nullable: false),
                    MedicalCertPath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatutoryLeaveEvents", x => x.EventId);
                    table.ForeignKey(
                        name: "FK_StatutoryLeaveEvents_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeaveTypes_CompanyId_LeaveCode",
                table: "LeaveTypes",
                columns: new[] { "CompanyId", "LeaveCode" });

            migrationBuilder.CreateIndex(
                name: "IX_LeaveApplications_BackupEmployeeId",
                table: "LeaveApplications",
                column: "BackupEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveApplications_Level2ApproverId",
                table: "LeaveApplications",
                column: "Level2ApproverId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveEncashments_EmployeeId_ProcessedMonth",
                table: "LeaveEncashments",
                columns: new[] { "EmployeeId", "ProcessedMonth" });

            migrationBuilder.CreateIndex(
                name: "IX_LeaveEncashments_LeaveTypeId",
                table: "LeaveEncashments",
                column: "LeaveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveLedgers_EmployeeId_LeaveTypeId_TxnDate",
                table: "LeaveLedgers",
                columns: new[] { "EmployeeId", "LeaveTypeId", "TxnDate" });

            migrationBuilder.CreateIndex(
                name: "IX_LeaveLedgers_LeaveTypeId",
                table: "LeaveLedgers",
                column: "LeaveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LeavePolicyRules_DepartmentId",
                table: "LeavePolicyRules",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_LeavePolicyRules_LeaveTypeId",
                table: "LeavePolicyRules",
                column: "LeaveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LeavePolicyRules_LocationId",
                table: "LeavePolicyRules",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_SectorLeaveConfigs_CompanyId_IndustryType_RuleKey",
                table: "SectorLeaveConfigs",
                columns: new[] { "CompanyId", "IndustryType", "RuleKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StatutoryLeaveEvents_EmployeeId_EventType",
                table: "StatutoryLeaveEvents",
                columns: new[] { "EmployeeId", "EventType" });

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveApplications_Employees_BackupEmployeeId",
                table: "LeaveApplications",
                column: "BackupEmployeeId",
                principalTable: "Employees",
                principalColumn: "EmployeeId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveApplications_Users_ApproverId",
                table: "LeaveApplications",
                column: "ApproverId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveApplications_Users_Level2ApproverId",
                table: "LeaveApplications",
                column: "Level2ApproverId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveTypes_Companies_CompanyId",
                table: "LeaveTypes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "CompanyId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LeaveApplications_Employees_BackupEmployeeId",
                table: "LeaveApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveApplications_Users_ApproverId",
                table: "LeaveApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveApplications_Users_Level2ApproverId",
                table: "LeaveApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveTypes_Companies_CompanyId",
                table: "LeaveTypes");

            migrationBuilder.DropTable(
                name: "LeaveEncashments");

            migrationBuilder.DropTable(
                name: "LeaveLedgers");

            migrationBuilder.DropTable(
                name: "LeavePolicyRules");

            migrationBuilder.DropTable(
                name: "SectorLeaveConfigs");

            migrationBuilder.DropTable(
                name: "StatutoryLeaveEvents");

            migrationBuilder.DropIndex(
                name: "IX_LeaveTypes_CompanyId_LeaveCode",
                table: "LeaveTypes");

            migrationBuilder.DropIndex(
                name: "IX_LeaveApplications_BackupEmployeeId",
                table: "LeaveApplications");

            migrationBuilder.DropIndex(
                name: "IX_LeaveApplications_Level2ApproverId",
                table: "LeaveApplications");

            migrationBuilder.DropColumn(
                name: "AccrualFrequency",
                table: "LeaveTypes");

            migrationBuilder.DropColumn(
                name: "AccrualRate",
                table: "LeaveTypes");

            migrationBuilder.DropColumn(
                name: "ClubbingRestrictedWith",
                table: "LeaveTypes");

            migrationBuilder.DropColumn(
                name: "EncashmentRule",
                table: "LeaveTypes");

            migrationBuilder.DropColumn(
                name: "MinNoticeDays",
                table: "LeaveTypes");

            migrationBuilder.DropColumn(
                name: "ProRataForMidYear",
                table: "LeaveTypes");

            migrationBuilder.DropColumn(
                name: "SandwichRuleApplicable",
                table: "LeaveTypes");

            migrationBuilder.DropColumn(
                name: "BackupEmployeeId",
                table: "LeaveApplications");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "LeaveApplications");

            migrationBuilder.DropColumn(
                name: "HalfDayType",
                table: "LeaveApplications");

            migrationBuilder.DropColumn(
                name: "Level2ApprovedAt",
                table: "LeaveApplications");

            migrationBuilder.DropColumn(
                name: "Level2ApproverId",
                table: "LeaveApplications");

            migrationBuilder.AlterColumn<string>(
                name: "LeaveTypeName",
                table: "LeaveTypes",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "LeaveCode",
                table: "LeaveTypes",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.CreateIndex(
                name: "IX_LeaveTypes_CompanyId",
                table: "LeaveTypes",
                column: "CompanyId");

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveApplications_Users_ApproverId",
                table: "LeaveApplications",
                column: "ApproverId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveTypes_Companies_CompanyId",
                table: "LeaveTypes",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "CompanyId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
