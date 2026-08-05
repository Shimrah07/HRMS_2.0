using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExitManagementModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExitRecords",
                columns: table => new
                {
                    ExitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ResignationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProposedLwd = table.Column<DateOnly>(type: "date", nullable: false),
                    ConfirmedLwd = table.Column<DateOnly>(type: "date", nullable: true),
                    ExitType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PrimaryReason = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AdditionalComments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsRegretted = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    NoticePeriodDays = table.Column<int>(type: "int", nullable: false),
                    EarlyReleaseRequested = table.Column<bool>(type: "bit", nullable: false),
                    RequestedLwd = table.Column<DateOnly>(type: "date", nullable: true),
                    EarlyReleaseApproved = table.Column<bool>(type: "bit", nullable: false),
                    BuyoutAllowed = table.Column<bool>(type: "bit", nullable: false),
                    BuyoutAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    WithdrawalStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    WithdrawalReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WithdrawalRequestedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ConfirmedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReportingManagerId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExitRecords", x => x.ExitId);
                    table.ForeignKey(
                        name: "FK_ExitRecords_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExitRecords_Employees_ReportingManagerId",
                        column: x => x.ReportingManagerId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExitRecords_Users_ConfirmedBy",
                        column: x => x.ConfirmedBy,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "SectorExitConfigs",
                columns: table => new
                {
                    ConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SectorName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Priority = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ConfigJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SectorExitConfigs", x => x.ConfigId);
                    table.ForeignKey(
                        name: "FK_SectorExitConfigs_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "CompanyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CounterOffers",
                columns: table => new
                {
                    OfferId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CurrentCtc = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    ProposedCtc = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    OtherConsiderations = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApprovedById = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EmployeeResponse = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ResponseDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CounterOffers", x => x.OfferId);
                    table.ForeignKey(
                        name: "FK_CounterOffers_ExitRecords_ExitId",
                        column: x => x.ExitId,
                        principalTable: "ExitRecords",
                        principalColumn: "ExitId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CounterOffers_Users_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ExitClearances",
                columns: table => new
                {
                    ClearanceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Department = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DuesAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    DuesDetails = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClearedById = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ClearedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExitClearances", x => x.ClearanceId);
                    table.ForeignKey(
                        name: "FK_ExitClearances_ExitRecords_ExitId",
                        column: x => x.ExitId,
                        principalTable: "ExitRecords",
                        principalColumn: "ExitId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExitClearances_Users_ClearedById",
                        column: x => x.ClearedById,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ExitDocuments",
                columns: table => new
                {
                    DocumentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConductRemark = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExitDocuments", x => x.DocumentId);
                    table.ForeignKey(
                        name: "FK_ExitDocuments_ExitRecords_ExitId",
                        column: x => x.ExitId,
                        principalTable: "ExitRecords",
                        principalColumn: "ExitId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExitInterviews",
                columns: table => new
                {
                    InterviewId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InterviewMode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    OverallRating = table.Column<int>(type: "int", nullable: false),
                    ManagerRating = table.Column<int>(type: "int", nullable: false),
                    GrowthRating = table.Column<int>(type: "int", nullable: false),
                    CompRating = table.Column<int>(type: "int", nullable: false),
                    WorkLifeBalanceRating = table.Column<int>(type: "int", nullable: false),
                    WouldRecommend = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    OpenFeedback = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExitInterviews", x => x.InterviewId);
                    table.ForeignKey(
                        name: "FK_ExitInterviews_ExitRecords_ExitId",
                        column: x => x.ExitId,
                        principalTable: "ExitRecords",
                        principalColumn: "ExitId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FFSCalculations",
                columns: table => new
                {
                    FFSId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ExitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PendingSalary = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    LeaveEncashment = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    Gratuity = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    ProRataBonus = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    AssetDeduction = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    LoanDeduction = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    NoticeShortfallDeduction = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    TdsDeduction = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    GrossPayable = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    NetPayable = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ApprovedById = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DisbursedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PaymentReference = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FFSCalculations", x => x.FFSId);
                    table.ForeignKey(
                        name: "FK_FFSCalculations_ExitRecords_ExitId",
                        column: x => x.ExitId,
                        principalTable: "ExitRecords",
                        principalColumn: "ExitId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FFSCalculations_Users_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CounterOffers_ApprovedById",
                table: "CounterOffers",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_CounterOffers_ExitId",
                table: "CounterOffers",
                column: "ExitId");

            migrationBuilder.CreateIndex(
                name: "IX_ExitClearances_ClearedById",
                table: "ExitClearances",
                column: "ClearedById");

            migrationBuilder.CreateIndex(
                name: "IX_ExitClearances_ExitId",
                table: "ExitClearances",
                column: "ExitId");

            migrationBuilder.CreateIndex(
                name: "IX_ExitDocuments_ExitId",
                table: "ExitDocuments",
                column: "ExitId");

            migrationBuilder.CreateIndex(
                name: "IX_ExitInterviews_ExitId",
                table: "ExitInterviews",
                column: "ExitId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExitRecords_ConfirmedBy",
                table: "ExitRecords",
                column: "ConfirmedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ExitRecords_EmployeeId_Status",
                table: "ExitRecords",
                columns: new[] { "EmployeeId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ExitRecords_ReportingManagerId",
                table: "ExitRecords",
                column: "ReportingManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_FFSCalculations_ApprovedById",
                table: "FFSCalculations",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_FFSCalculations_ExitId",
                table: "FFSCalculations",
                column: "ExitId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SectorExitConfigs_CompanyId_SectorName",
                table: "SectorExitConfigs",
                columns: new[] { "CompanyId", "SectorName" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CounterOffers");

            migrationBuilder.DropTable(
                name: "ExitClearances");

            migrationBuilder.DropTable(
                name: "ExitDocuments");

            migrationBuilder.DropTable(
                name: "ExitInterviews");

            migrationBuilder.DropTable(
                name: "FFSCalculations");

            migrationBuilder.DropTable(
                name: "SectorExitConfigs");

            migrationBuilder.DropTable(
                name: "ExitRecords");
        }
    }
}
