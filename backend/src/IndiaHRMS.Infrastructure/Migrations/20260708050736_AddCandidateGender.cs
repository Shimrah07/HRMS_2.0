using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCandidateGender : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Candidates",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobRequisitions_GradeId",
                table: "JobRequisitions",
                column: "GradeId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobRequisitions_GradeMasters_GradeId",
                table: "JobRequisitions",
                column: "GradeId",
                principalTable: "GradeMasters",
                principalColumn: "GradeId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobRequisitions_GradeMasters_GradeId",
                table: "JobRequisitions");

            migrationBuilder.DropIndex(
                name: "IX_JobRequisitions_GradeId",
                table: "JobRequisitions");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Candidates");
        }
    }
}
