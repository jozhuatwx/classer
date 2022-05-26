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
    public static class GetSession
    {
        [Function("GetSession")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "sessions/{sessionIdString}")] HttpRequestData req,
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
                    // Get container
                    var sessionContainer = await CosmosDb.GetContainerAsync(CosmosDb.SESSION_CONTAINER_ID);

                    // Get item
                    var query = new QueryDefinition(@$"SELECT * FROM c WHERE c.userId = @userId AND c.id = @sessionId")
                        .WithParameter("@userId", userId)
                        .WithParameter("@sessionId", sessionId);
                    var session = await CosmosDb.GetItemByQueryAsync<Session>(sessionContainer, query);

                    if (session != null)
                    {
                        // Write item to response
                        await response.WriteAsJsonAsync(session);
                    }
                    else
                    {
                        // Response not found message
                        await response.WriteAsJsonAsync("Session not found");
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

            // Validate session id
            if (!Guid.TryParse(sessionIdString, out sessionId))
            {
                valid = false;
                message.Add("Session ID is invalid.");
            }

            return (valid, string.Join("\n", message));
        }
    }
}
