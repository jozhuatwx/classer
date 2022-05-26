using System;
using System.Text.Json.Serialization;
using Microsoft.Azure.CognitiveServices.Vision.Face.Models;

namespace ClassER.Models
{
    public class Snapshot
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; } = Guid.NewGuid();

        [JsonPropertyName("sessionId")]
        public Guid SessionId { get; set; }

        [JsonPropertyName("dateTime")]
        public DateTime DateTime { get; set; } = DateTime.Now;

        [JsonPropertyName("perceivedEmotion")]
        public Emotion PerceivedEmotion { get; set; } = new Emotion();
    }
}
