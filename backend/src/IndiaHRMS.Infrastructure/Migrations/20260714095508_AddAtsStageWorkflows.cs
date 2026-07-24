using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAtsStageWorkflows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HrApproved",
                table: "JobApplications",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ManagerApproved",
                table: "JobApplications",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StageDataJson",
                table: "JobApplications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "TechnicalApproved",
                table: "JobApplications",
                type: "bit",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HrApproved",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "ManagerApproved",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "StageDataJson",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "TechnicalApproved",
                table: "JobApplications");
        }
    }
}
