using System;
using System.Text.Json.Serialization;

namespace ClassER.Models
{
    public class Session
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }

        [JsonPropertyName("sessionName")]
        public string SessionName { get; set; } = string.Empty;

        [JsonPropertyName("note")]
        public string Note { get; set; } = string.Empty;

        [JsonPropertyName("startDateTime")]
        public DateTime StartDateTime { get; set; } = DateTime.Now;

        [JsonPropertyName("lastUpdatedDateTime")]
        public DateTime LastUpdatedDateTime { get; set; } = DateTime.Now;
    }
}
