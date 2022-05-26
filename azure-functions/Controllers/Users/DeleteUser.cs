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
    public static class DeleteUser
    {
        [Function("DeleteUser")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "users")] HttpRequestData req
        )
        {
            // Create response
            var response = req.CreateResponse();

            // Get user id
            var userId = Utils.GetUserId(req.Headers);

            // Validate params
            var valid = Validate(userId);

            if (valid.Item1)
            {
                try
                {
                    // Start tasks
                    var getUserContainerTask = CosmosDb.GetContainerAsync(CosmosDb.USER_CONTAINER_ID);
                    var getSessionContainerTask = CosmosDb.GetContainerAsync(CosmosDb.SESSION_CONTAINER_ID);
                    var getSnapshotContainerTask = CosmosDb.GetContainerAsync(CosmosDb.SNAPSHOT_CONTAINER_ID);

                    // Wait all tasks to complete
                    Task.WaitAll(
                        getUserContainerTask,
                        getSessionContainerTask,
                        getSnapshotContainerTask
                    );

                    // Get task results
                    var userContainer = getUserContainerTask.Result;
                    var sessionContainer = getSessionContainerTask.Result;
                    var snapshotContainer = getSnapshotContainerTask.Result;

                    QueryDefinition getAllSessionsQuery = new QueryDefinition(@$"SELECT * FROM c WHERE c.userId = @userId")
                        .WithParameter("@userId", userId);
                    var sessions = await CosmosDb.GetItemsByQueryAsync<Snapshot>(sessionContainer, getAllSessionsQuery);
                    var sessionIds = sessions.Select(session => session.Id.ToString()).ToList();

                    var snapshotIds = new List<(string, string)>();
                    foreach (var sessionId in sessionIds)
                    {
                        QueryDefinition getAllSnapshotsQuery = new QueryDefinition(@$"SELECT * FROM c WHERE c.sessionId = @sessionId")
                            .WithParameter("@sessionId", sessionId);
                        var snapshots = (await CosmosDb.GetItemsByQueryAsync<Snapshot>(snapshotContainer, getAllSnapshotsQuery));
                        snapshotIds.AddRange(snapshots.Select(snapshot => (snapshot.Id.ToString(), sessionId)));
                    }

                    Task.WaitAll(
                        // Delete item
                        CosmosDb.DeleteItemsByIdWithPartitionKeysAsync<Snapshot>(snapshotContainer, snapshotIds),
                        CosmosDb.DeleteItemsByIdsAsync<Session>(sessionContainer, sessionIds, userId.ToString()),
                        CosmosDb.DeleteItemByIdAsync<User>(userContainer, userId.ToString(), userId.ToString()),
                        // Response delete successful
                        response.WriteAsJsonAsync("Deleted user").AsTask()
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

        private static (bool, string) Validate(Guid userId)
        {
            var valid = true;
            var message = "";

            // Validate user id
            if (userId == Guid.Empty)
            {
                valid = false;
                message = "User ID is invalid.";
            }

            return (valid, message);
        }
    }
}
