using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRequisitionEnterpriseFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentApprovalLevel",
                table: "JobRequisitions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentApproverId",
                table: "JobRequisitions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HiringManagerId",
                table: "JobRequisitions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InternalHiringJustification",
                table: "JobRequisitions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InternalHiringRemarks",
                table: "JobRequisitions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Justification",
                table: "JobRequisitions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MrfNumber",
                table: "JobRequisitions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "JobRequisitions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ReplacingEmployeeId",
                table: "JobRequisitions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourcingPreference",
                table: "JobRequisitions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "SubDeptId",
                table: "JobRequisitions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VacancyType",
                table: "JobRequisitions",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ApprovalWorkflowConfigs",
                columns: table => new
                {
                    ConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeptId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EmploymentType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BudgetThreshold = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ApproverRolesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalWorkflowConfigs", x => x.ConfigId);
                });

            migrationBuilder.CreateTable(
                name: "RequisitionAuditTrails",
                columns: table => new
                {
                    AuditId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReqId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RequisitionAuditTrails", x => x.AuditId);
                    table.ForeignKey(
                        name: "FK_RequisitionAuditTrails_JobRequisitions_ReqId",
                        column: x => x.ReqId,
                        principalTable: "JobRequisitions",
                        principalColumn: "ReqId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RequisitionAuditTrails_ReqId",
                table: "RequisitionAuditTrails",
                column: "ReqId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApprovalWorkflowConfigs");

            migrationBuilder.DropTable(
                name: "RequisitionAuditTrails");

            migrationBuilder.DropColumn(
                name: "CurrentApprovalLevel",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "CurrentApproverId",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "HiringManagerId",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "InternalHiringJustification",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "InternalHiringRemarks",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "Justification",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "MrfNumber",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "ReplacingEmployeeId",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "SourcingPreference",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "SubDeptId",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "VacancyType",
                table: "JobRequisitions");
        }
    }
}
