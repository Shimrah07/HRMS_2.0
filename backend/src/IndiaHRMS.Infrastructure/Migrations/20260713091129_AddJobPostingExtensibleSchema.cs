using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJobPostingExtensibleSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalLink",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LocationName",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MetadataJson",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PublishedById",
                table: "JobPostings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WorkMode",
                table: "JobPostings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobPostings_PublishedById",
                table: "JobPostings",
                column: "PublishedById");

            migrationBuilder.AddForeignKey(
                name: "FK_JobPostings_Users_PublishedById",
                table: "JobPostings",
                column: "PublishedById",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);

            // Data Migration for Status enum changes
            migrationBuilder.Sql("UPDATE JobPostings SET Status = 'Published' WHERE Status = 'Active';");
            migrationBuilder.Sql("UPDATE JobPostings SET Status = 'Closed' WHERE Status = 'Expired';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobPostings_Users_PublishedById",
                table: "JobPostings");

            migrationBuilder.DropIndex(
                name: "IX_JobPostings_PublishedById",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "ExternalLink",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "LocationName",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "MetadataJson",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "PublishedById",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "WorkMode",
                table: "JobPostings");
        }
    }
}
