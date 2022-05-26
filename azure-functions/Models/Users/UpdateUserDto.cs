using System.Text.Json.Serialization;

namespace ClassER.Models
{
    public class UpdateUserDto
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("password")]
        public string Password { get; set; } = string.Empty;

        [JsonPropertyName("updatePassword")]
        public bool UpdatePassword { get; set; } = false;

        [JsonPropertyName("newPassword")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
