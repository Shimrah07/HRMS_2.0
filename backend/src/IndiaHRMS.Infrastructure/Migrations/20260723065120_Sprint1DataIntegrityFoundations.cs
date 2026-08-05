using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Sprint1DataIntegrityFoundations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ShiftId",
                table: "AttendanceRecords",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EmployeeEmploymentHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeptId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DesignationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    GradeId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CostCenterId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReportingManagerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    L2ReportingManagerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EmploymentType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ShiftId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PayrollGroup = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    NoticePeriodDays = table.Column<int>(type: "int", nullable: true),
                    EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    EffectiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmployeeEmploymentHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmployeeEmploymentHistories_CostCenters_CostCenterId",
                        column: x => x.CostCenterId,
                        principalTable: "CostCenters",
                        principalColumn: "CostCenterId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EmployeeEmploymentHistories_Departments_DeptId",
                        column: x => x.DeptId,
                        principalTable: "Departments",
                        principalColumn: "DeptId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EmployeeEmploymentHistories_Designations_DesignationId",
                        column: x => x.DesignationId,
                        principalTable: "Designations",
                        principalColumn: "DesignationId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EmployeeEmploymentHistories_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmployeeEmploymentHistories_Employees_L2ReportingManagerId",
                        column: x => x.L2ReportingManagerId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EmployeeEmploymentHistories_Employees_ReportingManagerId",
                        column: x => x.ReportingManagerId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EmployeeEmploymentHistories_GradeMasters_GradeId",
                        column: x => x.GradeId,
                        principalTable: "GradeMasters",
                        principalColumn: "GradeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EmployeeEmploymentHistories_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EmployeeEmploymentHistories_ShiftMasters_ShiftId",
                        column: x => x.ShiftId,
                        principalTable: "ShiftMasters",
                        principalColumn: "ShiftId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PunchLogs",
                columns: table => new
                {
                    PunchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeviceId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Source = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PunchType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PunchTimestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Latitude = table.Column<decimal>(type: "decimal(9,6)", nullable: true),
                    Longitude = table.Column<decimal>(type: "decimal(9,6)", nullable: true),
                    IsFlagged = table.Column<bool>(type: "bit", nullable: false),
                    FlagReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PunchLogs", x => x.PunchId);
                    table.ForeignKey(
                        name: "FK_PunchLogs_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_ShiftId",
                table: "AttendanceRecords",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEmploymentHistories_CostCenterId",
                table: "EmployeeEmploymentHistories",
                column: "CostCenterId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEmploymentHistories_DeptId",
                table: "EmployeeEmploymentHistories",
                column: "DeptId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEmploymentHistories_DesignationId",
                table: "EmployeeEmploymentHistories",
                column: "DesignationId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEmploymentHistories_EmployeeId_EffectiveFrom",
                table: "EmployeeEmploymentHistories",
                columns: new[] { "EmployeeId", "EffectiveFrom" });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEmploymentHistories_GradeId",
                table: "EmployeeEmploymentHistories",
                column: "GradeId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEmploymentHistories_L2ReportingManagerId",
                table: "EmployeeEmploymentHistories",
                column: "L2ReportingManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEmploymentHistories_LocationId",
                table: "EmployeeEmploymentHistories",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEmploymentHistories_ReportingManagerId",
                table: "EmployeeEmploymentHistories",
                column: "ReportingManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeEmploymentHistories_ShiftId",
                table: "EmployeeEmploymentHistories",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_PunchLogs_EmployeeId_PunchTimestamp",
                table: "PunchLogs",
                columns: new[] { "EmployeeId", "PunchTimestamp" });

            migrationBuilder.AddForeignKey(
                name: "FK_AttendanceRecords_ShiftMasters_ShiftId",
                table: "AttendanceRecords",
                column: "ShiftId",
                principalTable: "ShiftMasters",
                principalColumn: "ShiftId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttendanceRecords_ShiftMasters_ShiftId",
                table: "AttendanceRecords");

            migrationBuilder.DropTable(
                name: "EmployeeEmploymentHistories");

            migrationBuilder.DropTable(
                name: "PunchLogs");

            migrationBuilder.DropIndex(
                name: "IX_AttendanceRecords_ShiftId",
                table: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "ShiftId",
                table: "AttendanceRecords");
        }
    }
}
