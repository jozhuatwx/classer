using System.Text.Json.Serialization;

namespace ClassER.Models
{
    public class UpdateSessionDto
    {
        [JsonPropertyName("sessionName")]
        public string SessionName { get; set; } = string.Empty;

        [JsonPropertyName("note")]
        public string Note { get; set; } = string.Empty;
    }
}
