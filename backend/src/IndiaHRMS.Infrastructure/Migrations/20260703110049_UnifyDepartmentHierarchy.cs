using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UnifyDepartmentHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_SubDepartments_SubDeptId",
                table: "Employees");

            migrationBuilder.DropForeignKey(
                name: "FK_Teams_SubDepartments_SubDeptId",
                table: "Teams");

            migrationBuilder.DropTable(
                name: "SubDepartments");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Departments_SubDeptId",
                table: "Employees",
                column: "SubDeptId",
                principalTable: "Departments",
                principalColumn: "DeptId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_Departments_SubDeptId",
                table: "Teams",
                column: "SubDeptId",
                principalTable: "Departments",
                principalColumn: "DeptId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Departments_SubDeptId",
                table: "Employees");

            migrationBuilder.DropForeignKey(
                name: "FK_Teams_Departments_SubDeptId",
                table: "Teams");

            migrationBuilder.CreateTable(
                name: "SubDepartments",
                columns: table => new
                {
                    SubDeptId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeptId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubDepartments", x => x.SubDeptId);
                    table.ForeignKey(
                        name: "FK_SubDepartments_Departments_DeptId",
                        column: x => x.DeptId,
                        principalTable: "Departments",
                        principalColumn: "DeptId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SubDepartments_DeptId",
                table: "SubDepartments",
                column: "DeptId");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_SubDepartments_SubDeptId",
                table: "Employees",
                column: "SubDeptId",
                principalTable: "SubDepartments",
                principalColumn: "SubDeptId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_SubDepartments_SubDeptId",
                table: "Teams",
                column: "SubDeptId",
                principalTable: "SubDepartments",
                principalColumn: "SubDeptId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
