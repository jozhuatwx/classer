using System.Text.Json.Serialization;

namespace ClassER.Models
{
    public class GetUserDto
    {
        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("password")]
        public string Password { get; set; } = string.Empty;
    }
}
