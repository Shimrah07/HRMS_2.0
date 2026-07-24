using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AttendanceCoreEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "HalfDayThresholdHrs",
                table: "ShiftMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsFrozen",
                table: "AttendanceRecords",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "CompOffLedgers",
                columns: table => new
                {
                    LedgerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EarnedDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ExpiryDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompOffLedgers", x => x.LedgerId);
                    table.ForeignKey(
                        name: "FK_CompOffLedgers_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompOffLedgers_EmployeeId",
                table: "CompOffLedgers",
                column: "EmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompOffLedgers");

            migrationBuilder.DropColumn(
                name: "HalfDayThresholdHrs",
                table: "ShiftMasters");

            migrationBuilder.DropColumn(
                name: "IsFrozen",
                table: "AttendanceRecords");
        }
    }
}
