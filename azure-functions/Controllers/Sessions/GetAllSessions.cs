using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Azure.Cosmos;
using ClassER.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ClassER.Controllers
{
    public static class GetAllSessions
    {
        [Function("GetAllSessions")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "sessions")] HttpRequestData req
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
                    // Get container
                    var sessionContainer = await CosmosDb.GetContainerAsync(CosmosDb.SESSION_CONTAINER_ID);

                    // Get item
                    var query = new QueryDefinition(@$"SELECT * FROM c WHERE c.userId = @userId")
                        .WithParameter("@userId", userId);
                    var sessions = await CosmosDb.GetItemsByQueryAsync<Session>(sessionContainer, query);

                    if (sessions != null)
                    {
                        var sortedSessions = sessions.OrderByDescending(session => session.StartDateTime).ToList();

                        // Write items to response
                        await response.WriteAsJsonAsync(sortedSessions);
                    }
                    else
                    {
                        // Response not found message
                        await response.WriteAsJsonAsync("Sessions not found");
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

        private static (bool, string) Validate(Guid userId)
        {
            var valid = true;
            var message = string.Empty;

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
