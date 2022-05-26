using System;
using System.Linq;
using System.Security.Cryptography;
using Microsoft.Azure.Functions.Worker.Http;

namespace ClassER.Controllers
{
    public static class Utils
    {
        public static Guid GetUserId(HttpHeadersCollection headers)
        {
            var userId = headers.GetValues("user-id").FirstOrDefault();
            if (userId != null)
            {
                return Guid.Parse(userId);
            }
            return default(Guid);
        }

        public static string GenerateSalt()
        {
            var bytes = new byte[50];

            using (var provider = new RNGCryptoServiceProvider())
            {
                provider.GetNonZeroBytes(bytes);
            }

            return Convert.ToBase64String(bytes);
        }

        public static string HashPassword(string password, string salt)
        {
            var bytes = Convert.FromBase64String(salt);
            using (var deriveBytes = new Rfc2898DeriveBytes(password, bytes, 10000))
            {
                return Convert.ToBase64String(deriveBytes.GetBytes(50));
            }
        }

        public static bool VerifyPassword(string password, string salt, string hashedPassword)
        {
            return HashPassword(password, salt) == hashedPassword;
        }
    }
}
