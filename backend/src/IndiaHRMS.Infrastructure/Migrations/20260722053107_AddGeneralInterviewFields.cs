using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGeneralInterviewFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InterviewRounds_JobApplications_JobApplicationAppId",
                table: "InterviewRounds");

            migrationBuilder.AlterColumn<Guid>(
                name: "JobApplicationAppId",
                table: "InterviewRounds",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AlterColumn<Guid>(
                name: "AppId",
                table: "InterviewRounds",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<string>(
                name: "AttachmentsJson",
                table: "InterviewRounds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CandidateEmail",
                table: "InterviewRounds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CandidateName",
                table: "InterviewRounds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CandidatePhone",
                table: "InterviewRounds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "InterviewRounds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Company",
                table: "InterviewRounds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "InterviewRounds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "InterviewRounds",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsGeneralInterview",
                table: "InterviewRounds",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "InterviewRounds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_InterviewRounds_JobApplications_JobApplicationAppId",
                table: "InterviewRounds",
                column: "JobApplicationAppId",
                principalTable: "JobApplications",
                principalColumn: "AppId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InterviewRounds_JobApplications_JobApplicationAppId",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "AttachmentsJson",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "CandidateEmail",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "CandidateName",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "CandidatePhone",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "Company",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "Department",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "IsGeneralInterview",
                table: "InterviewRounds");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "InterviewRounds");

            migrationBuilder.AlterColumn<Guid>(
                name: "JobApplicationAppId",
                table: "InterviewRounds",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "AppId",
                table: "InterviewRounds",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_InterviewRounds_JobApplications_JobApplicationAppId",
                table: "InterviewRounds",
                column: "JobApplicationAppId",
                principalTable: "JobApplications",
                principalColumn: "AppId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
