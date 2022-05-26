using System;
using System.Net;
using System.Threading.Tasks;
using Azure.Cosmos;
using ClassER.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ClassER.Controllers
{
    public static class GetAllSnapshots
    {
        [Function("GetAllSnapshots")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "sessions/{sessionIdString}/snapshots")] HttpRequestData req,
            string sessionIdString
        )
        {
            // Create response
            var response = req.CreateResponse();

            // Validate params
            Guid sessionId;
            var valid = ValidateAndTryParse(sessionIdString, out sessionId);

            if (valid.Item1)
            {
                try
                {
                    // Get container
                    var snapshotContainer = await CosmosDb.GetContainerAsync(CosmosDb.SNAPSHOT_CONTAINER_ID);

                    // Get items
                    var query = new QueryDefinition(@$"SELECT * FROM c WHERE c.sessionId = @sessionId")
                        .WithParameter("@sessionId", sessionId);
                    var snapshots = await CosmosDb.GetItemsByQueryAsync<Snapshot>(snapshotContainer, query);

                    if (snapshots != null)
                    {
                        // Write items to response
                        await response.WriteAsJsonAsync(snapshots);
                    }
                    else
                    {
                        // Response not found message
                        await response.WriteAsJsonAsync("Snapshots not found");
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

        private static (bool, string) ValidateAndTryParse(string sessionIdString, out Guid sessionId)
        {
            var valid = true;
            var message = string.Empty;

            // Validate and try parse session id
            if (!Guid.TryParse(sessionIdString, out sessionId))
            {
                valid = false;
                message = "Session ID is invalid.";
            }

            return (valid, message);
        }
    }
}
