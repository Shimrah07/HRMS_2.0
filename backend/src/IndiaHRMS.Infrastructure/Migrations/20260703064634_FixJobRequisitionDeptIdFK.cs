using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixJobRequisitionDeptIdFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobRequisitions_Companies_CompanyId",
                table: "JobRequisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_JobRequisitions_Departments_DepartmentDeptId",
                table: "JobRequisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_JobRequisitions_Designations_DesignationId",
                table: "JobRequisitions");

            migrationBuilder.DropIndex(
                name: "IX_JobRequisitions_DepartmentDeptId",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "DepartmentDeptId",
                table: "JobRequisitions");

            migrationBuilder.CreateIndex(
                name: "IX_JobRequisitions_DeptId",
                table: "JobRequisitions",
                column: "DeptId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobRequisitions_Companies_CompanyId",
                table: "JobRequisitions",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "CompanyId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_JobRequisitions_Departments_DeptId",
                table: "JobRequisitions",
                column: "DeptId",
                principalTable: "Departments",
                principalColumn: "DeptId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_JobRequisitions_Designations_DesignationId",
                table: "JobRequisitions",
                column: "DesignationId",
                principalTable: "Designations",
                principalColumn: "DesignationId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobRequisitions_Companies_CompanyId",
                table: "JobRequisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_JobRequisitions_Departments_DeptId",
                table: "JobRequisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_JobRequisitions_Designations_DesignationId",
                table: "JobRequisitions");

            migrationBuilder.DropIndex(
                name: "IX_JobRequisitions_DeptId",
                table: "JobRequisitions");

            migrationBuilder.AddColumn<Guid>(
                name: "DepartmentDeptId",
                table: "JobRequisitions",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_JobRequisitions_DepartmentDeptId",
                table: "JobRequisitions",
                column: "DepartmentDeptId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobRequisitions_Companies_CompanyId",
                table: "JobRequisitions",
                column: "CompanyId",
                principalTable: "Companies",
                principalColumn: "CompanyId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_JobRequisitions_Departments_DepartmentDeptId",
                table: "JobRequisitions",
                column: "DepartmentDeptId",
                principalTable: "Departments",
                principalColumn: "DeptId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_JobRequisitions_Designations_DesignationId",
                table: "JobRequisitions",
                column: "DesignationId",
                principalTable: "Designations",
                principalColumn: "DesignationId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
