using System;
using System.Data.SqlClient;

class Program {
    static void Main() {
        string connStr = "Server=localhost;Database=IndiaHRMS;Integrated Security=True;TrustServerCertificate=True;";
        using (var conn = new SqlConnection(connStr)) {
            conn.Open();
            // Get SuperAdmin password hash
            string superHash = "";
            using (var cmd = conn.CreateCommand()) {
                cmd.CommandText = "SELECT PasswordHash FROM Users WHERE Username = 'superadmin' OR Email = 'superadmin@company.com'";
                superHash = cmd.ExecuteScalar()?.ToString() ?? "";
            }
            Console.WriteLine("SuperAdmin Hash Length: " + superHash.Length);

            // Set all users PasswordHash to superHash and unlock all accounts
            using (var cmd = conn.CreateCommand()) {
                cmd.CommandText = "UPDATE Users SET PasswordHash = @hash, IsLocked = 0, FailedLoginCount = 0, LockedUntil = NULL";
                cmd.Parameters.AddWithValue("@hash", superHash);
                int count = cmd.ExecuteNonQuery();
                Console.WriteLine("Successfully reset password hash and unlocked " + count + " users!");
            }
        }
    }
}
