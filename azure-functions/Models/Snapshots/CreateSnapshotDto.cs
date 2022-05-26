using System.Text.Json.Serialization;

namespace ClassER.Models
{
    public class CreateSnapshotDto
    {
        [JsonPropertyName("imageBase64")]
        public string ImageBase64 { get; set; } = string.Empty;
    }
}
