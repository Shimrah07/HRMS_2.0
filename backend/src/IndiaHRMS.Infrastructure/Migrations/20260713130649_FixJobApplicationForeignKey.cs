using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixJobApplicationForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobApplications_JobRequisitions_RequisitionReqId",
                table: "JobApplications");

            migrationBuilder.DropIndex(
                name: "IX_JobApplications_RequisitionReqId",
                table: "JobApplications");

            migrationBuilder.DropColumn(
                name: "RequisitionReqId",
                table: "JobApplications");

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_ReqId",
                table: "JobApplications",
                column: "ReqId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobApplications_JobRequisitions_ReqId",
                table: "JobApplications",
                column: "ReqId",
                principalTable: "JobRequisitions",
                principalColumn: "ReqId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobApplications_JobRequisitions_ReqId",
                table: "JobApplications");

            migrationBuilder.DropIndex(
                name: "IX_JobApplications_ReqId",
                table: "JobApplications");

            migrationBuilder.AddColumn<Guid>(
                name: "RequisitionReqId",
                table: "JobApplications",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_RequisitionReqId",
                table: "JobApplications",
                column: "RequisitionReqId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobApplications_JobRequisitions_RequisitionReqId",
                table: "JobApplications",
                column: "RequisitionReqId",
                principalTable: "JobRequisitions",
                principalColumn: "ReqId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
