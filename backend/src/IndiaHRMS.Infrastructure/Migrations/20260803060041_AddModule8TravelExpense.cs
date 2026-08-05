using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddModule8TravelExpense : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReimbursementBatches",
                columns: table => new
                {
                    BatchId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BatchCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    RunDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalClaims = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(14,2)", nullable: false),
                    DisbursementMode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProcessedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReimbursementBatches", x => x.BatchId);
                });

            migrationBuilder.CreateTable(
                name: "SectorPolicyConfigs",
                columns: table => new
                {
                    SectorConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CompanyId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SectorName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDefaultActive = table.Column<bool>(type: "bit", nullable: false),
                    ConfigJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SectorPolicyConfigs", x => x.SectorConfigId);
                    table.ForeignKey(
                        name: "FK_SectorPolicyConfigs_Companies_CompanyId",
                        column: x => x.CompanyId,
                        principalTable: "Companies",
                        principalColumn: "CompanyId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TravelEntitlements",
                columns: table => new
                {
                    EntitlementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GradeBand = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FlightClass = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrainClass = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HotelCategory = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DAMetro = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    DANonMetro = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TravelEntitlements", x => x.EntitlementId);
                });

            migrationBuilder.CreateTable(
                name: "TravelRequests",
                columns: table => new
                {
                    RequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TravelCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TravelType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProjectCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FromCity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ToCity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ModeOfTravel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HotelRequired = table.Column<bool>(type: "bit", nullable: false),
                    CoTravelers = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BusinessJustification = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PassportNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PassportExpiry = table.Column<DateOnly>(type: "date", nullable: true),
                    VisaStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ForexCurrency = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ForexAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    TravelInsuranceInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EstimatedCost = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AppliedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ApproverId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TravelRequests", x => x.RequestId);
                    table.ForeignKey(
                        name: "FK_TravelRequests_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TravelRequests_Users_ApproverId",
                        column: x => x.ApproverId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ExpenseClaims",
                columns: table => new
                {
                    ClaimId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClaimCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TravelRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    AdvanceAdjusted = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    NetPayable = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ManagerApproverId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ManagerApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FinanceApproverId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FinanceApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpenseClaims", x => x.ClaimId);
                    table.ForeignKey(
                        name: "FK_ExpenseClaims_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ExpenseClaims_TravelRequests_TravelRequestId",
                        column: x => x.TravelRequestId,
                        principalTable: "TravelRequests",
                        principalColumn: "RequestId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TravelAdvances",
                columns: table => new
                {
                    AdvanceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdvanceCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    EmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TravelRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EstimatedTripCost = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    AmountRequested = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    AmountDisbursed = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    DisbursementMode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DisbursedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExpectedSettlementDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AgingDays = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TravelAdvances", x => x.AdvanceId);
                    table.ForeignKey(
                        name: "FK_TravelAdvances_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "EmployeeId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TravelAdvances_TravelRequests_TravelRequestId",
                        column: x => x.TravelRequestId,
                        principalTable: "TravelRequests",
                        principalColumn: "RequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TravelBookings",
                columns: table => new
                {
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TravelRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingReference = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TicketDetails = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HotelDetails = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AttachmentPath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConfirmedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ConfirmedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TravelBookings", x => x.BookingId);
                    table.ForeignKey(
                        name: "FK_TravelBookings_TravelRequests_TravelRequestId",
                        column: x => x.TravelRequestId,
                        principalTable: "TravelRequests",
                        principalColumn: "RequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TravelPolicyExceptions",
                columns: table => new
                {
                    ExceptionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TravelRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntitledCategory = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequestedCategory = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AdditionalCostImpact = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApprovedByHOD = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ApprovedByFinance = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TravelPolicyExceptions", x => x.ExceptionId);
                    table.ForeignKey(
                        name: "FK_TravelPolicyExceptions_TravelRequests_TravelRequestId",
                        column: x => x.TravelRequestId,
                        principalTable: "TravelRequests",
                        principalColumn: "RequestId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExpenseLineItems",
                columns: table => new
                {
                    LineItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClaimId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpenseDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GstAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    VendorGstin = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BillPath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPolicyCompliant = table.Column<bool>(type: "bit", nullable: false),
                    IsBillable = table.Column<bool>(type: "bit", nullable: false),
                    ClientMarkupPercent = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    GuestDetails = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpenseLineItems", x => x.LineItemId);
                    table.ForeignKey(
                        name: "FK_ExpenseLineItems_ExpenseClaims_ClaimId",
                        column: x => x.ClaimId,
                        principalTable: "ExpenseClaims",
                        principalColumn: "ClaimId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OcrExtractionLogs",
                columns: table => new
                {
                    ExtractionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LineItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ExtractedAmount = table.Column<decimal>(type: "decimal(12,2)", nullable: false),
                    ExtractedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ExtractedVendor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ExtractedGstin = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConfidenceScore = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    RawOcrText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OcrExtractionLogs", x => x.ExtractionId);
                    table.ForeignKey(
                        name: "FK_OcrExtractionLogs_ExpenseLineItems_LineItemId",
                        column: x => x.LineItemId,
                        principalTable: "ExpenseLineItems",
                        principalColumn: "LineItemId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseClaims_ClaimCode",
                table: "ExpenseClaims",
                column: "ClaimCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseClaims_EmployeeId",
                table: "ExpenseClaims",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseClaims_TravelRequestId",
                table: "ExpenseClaims",
                column: "TravelRequestId",
                unique: true,
                filter: "[TravelRequestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseLineItems_ClaimId",
                table: "ExpenseLineItems",
                column: "ClaimId");

            migrationBuilder.CreateIndex(
                name: "IX_OcrExtractionLogs_LineItemId",
                table: "OcrExtractionLogs",
                column: "LineItemId",
                unique: true,
                filter: "[LineItemId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ReimbursementBatches_BatchCode",
                table: "ReimbursementBatches",
                column: "BatchCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SectorPolicyConfigs_CompanyId",
                table: "SectorPolicyConfigs",
                column: "CompanyId");

            migrationBuilder.CreateIndex(
                name: "IX_TravelAdvances_AdvanceCode",
                table: "TravelAdvances",
                column: "AdvanceCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TravelAdvances_EmployeeId",
                table: "TravelAdvances",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_TravelAdvances_TravelRequestId",
                table: "TravelAdvances",
                column: "TravelRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TravelBookings_TravelRequestId",
                table: "TravelBookings",
                column: "TravelRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TravelPolicyExceptions_TravelRequestId",
                table: "TravelPolicyExceptions",
                column: "TravelRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TravelRequests_ApproverId",
                table: "TravelRequests",
                column: "ApproverId");

            migrationBuilder.CreateIndex(
                name: "IX_TravelRequests_EmployeeId",
                table: "TravelRequests",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_TravelRequests_TravelCode",
                table: "TravelRequests",
                column: "TravelCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OcrExtractionLogs");

            migrationBuilder.DropTable(
                name: "ReimbursementBatches");

            migrationBuilder.DropTable(
                name: "SectorPolicyConfigs");

            migrationBuilder.DropTable(
                name: "TravelAdvances");

            migrationBuilder.DropTable(
                name: "TravelBookings");

            migrationBuilder.DropTable(
                name: "TravelEntitlements");

            migrationBuilder.DropTable(
                name: "TravelPolicyExceptions");

            migrationBuilder.DropTable(
                name: "ExpenseLineItems");

            migrationBuilder.DropTable(
                name: "ExpenseClaims");

            migrationBuilder.DropTable(
                name: "TravelRequests");
        }
    }
}
