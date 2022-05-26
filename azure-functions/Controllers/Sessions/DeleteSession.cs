using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Azure.Cosmos;
using ClassER.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ClassER.Controllers
{
    public static class DeleteSession
    {
        [Function("DeleteSession")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "sessions/{sessionIdString}")] HttpRequestData req,
            string sessionIdString
        )
        {
            // Create response
            var response = req.CreateResponse();

            // Get user id
            var userId = Utils.GetUserId(req.Headers);

            // Validate params
            Guid sessionId;
            var valid = ValidateAndTryParse(userId, sessionIdString, out sessionId);

            if (valid.Item1)
            {
                try
                {
                    // Start tasks
                    var getSessionContainerTask = CosmosDb.GetContainerAsync(CosmosDb.SESSION_CONTAINER_ID);
                    var getSnapshotContainerTask = CosmosDb.GetContainerAsync(CosmosDb.SNAPSHOT_CONTAINER_ID);

                    // Wait all tasks to complete
                    Task.WaitAll(
                        getSessionContainerTask,
                        getSnapshotContainerTask
                    );

                    // Get task results
                    var sessionContainer = getSessionContainerTask.Result;
                    var snapshotContainer = getSnapshotContainerTask.Result;

                    var query = new QueryDefinition(@$"SELECT * FROM c WHERE c.sessionId = @sessionId")
                        .WithParameter("@sessionId", sessionId);
                    var snapshots = await CosmosDb.GetItemsByQueryAsync<Snapshot>(snapshotContainer, query);
                    var snapshotIds = snapshots.Select(snapshot => snapshot.Id.ToString()).ToList();

                    Task.WaitAll(
                        // Delete item
                        CosmosDb.DeleteItemsByIdsAsync<Snapshot>(snapshotContainer, snapshotIds, sessionId.ToString()),
                        CosmosDb.DeleteItemByIdAsync<Session>(sessionContainer, sessionId.ToString(), userId.ToString()),
                        // Response delete successful
                        response.WriteAsJsonAsync("Deleted session").AsTask()
                    );
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

        private static (bool, string) ValidateAndTryParse(Guid userId, string sessionIdString, out Guid sessionId)
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

            return (valid, string.Join("\n", message));
        }
    }
}
