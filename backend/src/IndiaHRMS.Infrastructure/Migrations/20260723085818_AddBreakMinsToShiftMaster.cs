using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBreakMinsToShiftMaster : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BreakMins",
                table: "ShiftMasters",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BreakMins",
                table: "ShiftMasters");
        }
    }
}
