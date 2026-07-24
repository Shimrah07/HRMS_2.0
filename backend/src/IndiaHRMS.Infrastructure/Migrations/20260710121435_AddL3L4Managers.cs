using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddL3L4Managers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "L3ReportingManagerId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "L4ReportingManagerId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_L3ReportingManagerId",
                table: "Employees",
                column: "L3ReportingManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_L4ReportingManagerId",
                table: "Employees",
                column: "L4ReportingManagerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Employees_L3ReportingManagerId",
                table: "Employees",
                column: "L3ReportingManagerId",
                principalTable: "Employees",
                principalColumn: "EmployeeId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Employees_L4ReportingManagerId",
                table: "Employees",
                column: "L4ReportingManagerId",
                principalTable: "Employees",
                principalColumn: "EmployeeId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Employees_L3ReportingManagerId",
                table: "Employees");

            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Employees_L4ReportingManagerId",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_L3ReportingManagerId",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_L4ReportingManagerId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "L3ReportingManagerId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "L4ReportingManagerId",
                table: "Employees");
        }
    }
}
