using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IndiaHRMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeePersonalAndAddressFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AlternateEmergencyContactPhone",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AlternateMobile",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentAddressLine1",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentAddressLine2",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CurrentDistrict",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DomicileState",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExtensionNumber",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FatherName",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FullNameAadhaar",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "MarriageDate",
                table: "Employees",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MotherTongue",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NPSPRANNumber",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NumberOfDependents",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OfficialMobile",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermanentAddressLine1",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermanentAddressLine2",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermanentDistrict",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermanentTaluka",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreviousEmployerPFNumber",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PwdCertificateNo",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PwdStatus",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SameAddressFlag",
                table: "Employees",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SpouseName",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Title",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WhatsAppNumber",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentNumber",
                table: "EmployeeDocuments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "ExpiryDate",
                table: "EmployeeDocuments",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Remarks",
                table: "EmployeeDocuments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VerificationStatus",
                table: "EmployeeBankDetails",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerifiedAt",
                table: "EmployeeBankDetails",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VerifiedBy",
                table: "EmployeeBankDetails",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AlternateEmergencyContactPhone",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "AlternateMobile",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CurrentAddressLine1",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CurrentAddressLine2",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "CurrentDistrict",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "DomicileState",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ExtensionNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "FatherName",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "FullNameAadhaar",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "MarriageDate",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "MotherTongue",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "NPSPRANNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "NumberOfDependents",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "OfficialMobile",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PermanentAddressLine1",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PermanentAddressLine2",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PermanentDistrict",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PermanentTaluka",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PreviousEmployerPFNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PwdCertificateNo",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PwdStatus",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "SameAddressFlag",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "SpouseName",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "WhatsAppNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "DocumentNumber",
                table: "EmployeeDocuments");

            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "EmployeeDocuments");

            migrationBuilder.DropColumn(
                name: "Remarks",
                table: "EmployeeDocuments");

            migrationBuilder.DropColumn(
                name: "VerificationStatus",
                table: "EmployeeBankDetails");

            migrationBuilder.DropColumn(
                name: "VerifiedAt",
                table: "EmployeeBankDetails");

            migrationBuilder.DropColumn(
                name: "VerifiedBy",
                table: "EmployeeBankDetails");
        }
    }
}
