using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Sprint3DecisionGatedBuilds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BlacklistReason",
                table: "Candidates",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BlacklistedAt",
                table: "Candidates",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BlacklistedBy",
                table: "Candidates",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBlacklisted",
                table: "Candidates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "OfferCtcBreakups",
                columns: table => new
                {
                    BreakupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OfferId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Basic = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    HRA = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    SpecialAllowance = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    PFEmployer = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    Gratuity = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    Insurance = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    GrossMonthly = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    AnnualCTC = table.Column<decimal>(type: "decimal(14,2)", nullable: false),
                    OfferLetterOfferId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OfferCtcBreakups", x => x.BreakupId);
                    table.ForeignKey(
                        name: "FK_OfferCtcBreakups_OfferLetters_OfferLetterOfferId",
                        column: x => x.OfferLetterOfferId,
                        principalTable: "OfferLetters",
                        principalColumn: "OfferId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PendingEmployeeChanges",
                columns: table => new
                {
                    ChangeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FieldCategory = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FieldName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OldValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewValue = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReviewedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingEmployeeChanges", x => x.ChangeId);
                    table.ForeignKey(
                        name: "FK_PendingEmployeeChanges_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OfferCtcBreakups_OfferLetterOfferId",
                table: "OfferCtcBreakups",
                column: "OfferLetterOfferId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingEmployeeChanges_EmployeeId",
                table: "PendingEmployeeChanges",
                column: "EmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OfferCtcBreakups");

            migrationBuilder.DropTable(
                name: "PendingEmployeeChanges");

            migrationBuilder.DropColumn(
                name: "BlacklistReason",
                table: "Candidates");

            migrationBuilder.DropColumn(
                name: "BlacklistedAt",
                table: "Candidates");

            migrationBuilder.DropColumn(
                name: "BlacklistedBy",
                table: "Candidates");

            migrationBuilder.DropColumn(
                name: "IsBlacklisted",
                table: "Candidates");
        }
    }
}
