using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Azure.Cosmos;
using ClassER.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ClassER.Controllers
{
    public static class GetUser
    {
        [Function("GetUser")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "users/login")] HttpRequestData req,
            GetUserDto data
        )
        {
            // Create response
            var response = req.CreateResponse();

            // Validate params
            var valid = Validate(data);

            if (valid.Item1)
            {
                try
                {
                    // Get container
                    var userContainer = await CosmosDb.GetContainerAsync(CosmosDb.USER_CONTAINER_ID);

                    // Get item
                    var query = new QueryDefinition(@$"SELECT * FROM c WHERE c.email = @email")
                        .WithParameter("@email", data.Email.ToLower());
                    var user = await CosmosDb.GetItemByQueryAsync<User>(userContainer, query);

                    if (user != null && Utils.VerifyPassword(data.Password, user.Salt, user.Password))
                    {
                        var returnUser = new ReturnUserDto()
                        {
                            Id = user.Id,
                            Name = user.Name,
                            Email = user.Email
                        };

                        // Write item to response
                        await response.WriteAsJsonAsync(returnUser);
                    }
                    else
                    {
                        // Response not found message
                        await response.WriteAsJsonAsync("Incorrect email or password");
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

        private static (bool, string) Validate(GetUserDto data)
        {
            var valid = true;
            var message = new List<string>();

            // Validate data
            if (string.IsNullOrWhiteSpace(data.Email))
            {
                valid = false;
                message.Add("Email is invalid.");
            }

            if (string.IsNullOrWhiteSpace(data.Password))
            {
                valid = false;
                message.Add("Password is invalid.");
            }

            return (valid, string.Join("\n", message));
        }
    }
}
