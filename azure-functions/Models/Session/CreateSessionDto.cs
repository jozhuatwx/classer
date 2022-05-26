using System.Text.Json.Serialization;

namespace ClassER.Models
{
    public class CreateSessionDto
    {
        [JsonPropertyName("sessionName")]
        public string SessionName { get;set; } = string.Empty;
    }
}
