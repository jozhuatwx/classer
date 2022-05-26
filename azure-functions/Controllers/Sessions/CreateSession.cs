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
    public static class CreateSession
    {
        [Function("CreateSession")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "sessions")] HttpRequestData req,
            CreateSessionDto data
        )
        {
            // Create response
            var response = req.CreateResponse();

            // Get user id
            var userId = Utils.GetUserId(req.Headers);

            // Validate params
            var valid = Validate(userId, data);

            if (valid.Item1)
            {
                try
                {
                    // Get container
                    var sessionContainer = await CosmosDb.GetContainerAsync(CosmosDb.SESSION_CONTAINER_ID);

                    // Create new instance
                    var session = new Session()
                    {
                        UserId = userId,
                        SessionName = data.SessionName
                    };

                    Task.WaitAll(
                        // Save to database
                        CosmosDb.CreateItemAsync<Session>(sessionContainer, session, session.UserId.ToString()),
                        // Write id to response
                        response.WriteAsJsonAsync(session.Id).AsTask()
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

        private static (bool, string) Validate(Guid userId, CreateSessionDto data)
        {
            var valid = true;
            var message = new List<string>();

            // Validate user id
            if (userId == Guid.Empty)
            {
                valid = false;
                message.Add("User ID is invalid.");
            }

            // Validate data
            if (string.IsNullOrWhiteSpace(data.SessionName))
            {
                valid = false;
                message.Add("Session name is missing.");
            }

            return (valid, string.Join("\n", message));
        }
    }
}
