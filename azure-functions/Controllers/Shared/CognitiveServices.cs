using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Azure.CognitiveServices.Vision.Face;
using Microsoft.Azure.CognitiveServices.Vision.Face.Models;

namespace ClassER.Controllers
{
    public static class CognitiveServices
    {
        public const string DETECTION_MODEL = DetectionModel.Detection01;
        public const string RECOGNITION_MODEL = RecognitionModel.Recognition04;

        public static FaceClient FaceClient { get; } = new FaceClient(new ApiKeyServiceClientCredentials(Environment.GetEnvironmentVariable("FaceKeyFromKeyVault", EnvironmentVariableTarget.Process))) { Endpoint = Environment.GetEnvironmentVariable("FaceEndpoint", EnvironmentVariableTarget.Process) };

        public static async Task<Emotion?> GetPerceivedEmotionAsync(string imageBase64)
        {
            // Read image stream
            var imageStream = new MemoryStream(Convert.FromBase64String(imageBase64));

            // Detect faces
            var faceAttributes = new List<FaceAttributeType> { FaceAttributeType.Emotion };
            var faces = await FaceClient.Face.DetectWithStreamAsync
            (
                image: imageStream,
                returnFaceAttributes: faceAttributes,
                recognitionModel: RECOGNITION_MODEL,
                detectionModel: DETECTION_MODEL
            );

            if (faces.Count > 0) {
                // Calculate average perceived emotion
                Emotion perceivedEmotion = new Emotion();

                foreach (var face in faces)
                {
                    perceivedEmotion.Anger += face.FaceAttributes.Emotion.Anger;
                    perceivedEmotion.Contempt += face.FaceAttributes.Emotion.Contempt;
                    perceivedEmotion.Disgust += face.FaceAttributes.Emotion.Disgust;
                    perceivedEmotion.Fear += face.FaceAttributes.Emotion.Fear;
                    perceivedEmotion.Happiness += face.FaceAttributes.Emotion.Happiness;
                    perceivedEmotion.Neutral += face.FaceAttributes.Emotion.Neutral;
                    perceivedEmotion.Sadness += face.FaceAttributes.Emotion.Sadness;
                    perceivedEmotion.Surprise += face.FaceAttributes.Emotion.Surprise;
                }

                perceivedEmotion.Anger /= faces.Count;
                perceivedEmotion.Contempt /= faces.Count;
                perceivedEmotion.Disgust /= faces.Count;
                perceivedEmotion.Fear /= faces.Count;
                perceivedEmotion.Happiness /= faces.Count;
                perceivedEmotion.Neutral /= faces.Count;
                perceivedEmotion.Sadness /= faces.Count;
                perceivedEmotion.Surprise /= faces.Count;

                return perceivedEmotion;
            }

            return null;
        }
    }
}
