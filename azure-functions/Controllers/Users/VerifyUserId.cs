using System;
using System.Net;
using System.Threading.Tasks;
using Azure.Cosmos;
using ClassER.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ClassER.Controllers
{
    public static class VerifyUserId
    {
        [Function("VerifyUserId")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "users/verifyid")] HttpRequestData req
        )
        {
            // Create response
            var response = req.CreateResponse();

            // Get user id
            var userId = Utils.GetUserId(req.Headers);

            // Validate params
            var valid = Validate(userId);

            if (valid)
            {
                try
                {
                    // Get container
                    var userContainer = await CosmosDb.GetContainerAsync(CosmosDb.USER_CONTAINER_ID);

                    // Get item
                    var query = new QueryDefinition(@$"SELECT * FROM c WHERE c.id = @userId")
                        .WithParameter("@userId", userId);
                    var user = await CosmosDb.GetItemByQueryAsync<User>(userContainer, query);

                    if (user != null)
                    {
                        // Write true to response
                        await response.WriteAsJsonAsync(true);
                    }
                    else
                    {
                        // Write false to response
                        await response.WriteAsJsonAsync(false);
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
                await response.WriteAsJsonAsync(false);

                // Set http status code
                response.StatusCode = HttpStatusCode.BadRequest;
            }

            return response;
        }

        private static bool Validate(Guid userId)
        {
            // Validate user id
            return userId != Guid.Empty;
        }
    }
}
