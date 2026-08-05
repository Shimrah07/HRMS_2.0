using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignedRecruiterToJobApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedRecruiterId",
                table: "JobApplications",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_AssignedRecruiterId",
                table: "JobApplications",
                column: "AssignedRecruiterId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobApplications_Users_AssignedRecruiterId",
                table: "JobApplications",
                column: "AssignedRecruiterId",
                principalTable: "Users",
                principalColumn: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobApplications_Users_AssignedRecruiterId",
                table: "JobApplications");

            migrationBuilder.DropIndex(
                name: "IX_JobApplications_AssignedRecruiterId",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "AssignedRecruiterId",
                table: "JobApplications");
        }
    }
}
