using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAadharAndPanHashes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AadharHash",
                table: "Employees",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PANHash",
                table: "Employees",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_AadharHash",
                table: "Employees",
                column: "AadharHash",
                unique: true,
                filter: "[AadharHash] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_PANHash",
                table: "Employees",
                column: "PANHash",
                unique: true,
                filter: "[PANHash] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Employees_AadharHash",
                table: "Employees");

            migrationBuilder.DropIndex(
                name: "IX_Employees_PANHash",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "AadharHash",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PANHash",
                table: "Employees");
        }
    }
}
