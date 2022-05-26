using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Azure.Cosmos;
using ClassER.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ClassER.Controllers
{
    public static class CreateSnapshot
    {
        [Function("CreateSnapshot")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "sessions/{sessionIdString}/snapshots")] HttpRequestData req,
            string sessionIdString,
            CreateSnapshotDto data
        )
        {
            // Create response
            var response = req.CreateResponse();

            // Get user id
            var userId = Utils.GetUserId(req.Headers);

            // Validate params
            Guid sessionId;
            var valid = ValidateAndTryParse(userId, sessionIdString, out sessionId, data);

            if (valid.Item1)
            {
                try
                {
                    // Start tasks
                    var getPerceivedEmotionTask = CognitiveServices.GetPerceivedEmotionAsync(data.ImageBase64);
                    var getSnapshotContainerTask = CosmosDb.GetContainerAsync(CosmosDb.SNAPSHOT_CONTAINER_ID);
                    var getSessionContainerTask = CosmosDb.GetContainerAsync(CosmosDb.SESSION_CONTAINER_ID);

                    // Wait all tasks to complete
                    Task.WaitAll(
                        getPerceivedEmotionTask,
                        getSnapshotContainerTask,
                        getSessionContainerTask
                    );

                    // Get task results
                    var perceivedEmotion = getPerceivedEmotionTask.Result;
                    var snapshotContainer = getSnapshotContainerTask.Result;
                    var sessionContainer = getSessionContainerTask.Result;

                    // Check if not null
                    if (perceivedEmotion != null)
                    {
                        // Get item
                        var query = new QueryDefinition(@$"SELECT * FROM c WHERE c.userId = @userId AND c.id = @sessionId")
                            .WithParameter("@userId", userId)
                            .WithParameter("@sessionId", sessionId);
                        var session = await CosmosDb.GetItemByQueryAsync<Session>(sessionContainer, query);

                        if (session != null)
                        {
                            // Update item
                            session.LastUpdatedDateTime = DateTime.Now;

                            // Create new instance
                            var snapshot = new Models.Snapshot()
                            {
                                SessionId = sessionId,
                                PerceivedEmotion = perceivedEmotion
                            };

                            Task.WaitAll(
                                // Save to database
                                CosmosDb.CreateItemAsync<Snapshot>(snapshotContainer, snapshot, snapshot.SessionId.ToString()),
                                CosmosDb.UpdateItemAsync<Session>(sessionContainer, session, session.Id.ToString(), session.UserId.ToString()),
                                // Response save successful
                                response.WriteAsJsonAsync(snapshot).AsTask()
                            );
                        }
                        else
                        {
                            // Response not found message
                            await response.WriteAsJsonAsync("Session not found");
                        }
                    }
                    else
                    {
                        // Response no result message
                        await response.WriteAsJsonAsync("No faces detected");
                    }
                }
                catch (CosmosException ex)
                {
                    // Response error message
                    await response.WriteAsJsonAsync(ex.Message);

                    // Set http status code
                    response.StatusCode = (HttpStatusCode)ex.Status;
                }
            }
            else
            {
                // Response invalid
                await response.WriteAsJsonAsync(valid.Item2);

                // Set http status code
                response.StatusCode = HttpStatusCode.BadRequest;
            }

            return response;
        }

        private static (bool, string) ValidateAndTryParse(Guid userId, string sessionIdString, out Guid sessionId, CreateSnapshotDto data)
        {
            var valid = true;
            var message = new List<string>();

            // Validate user id
            if (userId == Guid.Empty)
            {
                valid = false;
                message.Add("User ID is invalid.");
            }

            // Validate and try parse session id
            if (!Guid.TryParse(sessionIdString, out sessionId))
            {
                valid = false;
                message.Add("Session ID is invalid.");
            }

            // Validate data
            if (string.IsNullOrWhiteSpace(data.ImageBase64))
            {
                valid = false;
                message.Add("Image is missing.");
            }

            return (valid, string.Join("\n", message));
        }
    }
}
