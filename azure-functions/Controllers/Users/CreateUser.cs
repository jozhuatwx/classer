using System.Collections.Generic;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Azure.Cosmos;
using ClassER.Models;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace ClassER.Controllers
{
    public static class CreateUser
    {
        [Function("CreateUser")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "users/register")] HttpRequestData req,
            CreateUserDto data
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
                    var currentUser = await CosmosDb.GetItemByQueryAsync<User>(userContainer, query);

                    if (currentUser == null)
                    {
                        // Create new instance
                        var salt = Utils.GenerateSalt();
                        var user = new User()
                        {
                            Name = data.Name,
                            Email = data.Email.ToLower(),
                            Salt = salt,
                            Password = Utils.HashPassword(data.Password, salt),
                        };

                        var returnUser = new ReturnUserDto()
                        {
                            Id = user.Id,
                            Name = user.Name,
                            Email = user.Email
                        };

                        Task.WaitAll(
                            // Save to database
                            CosmosDb.CreateItemAsync<User>(userContainer, user, user.Id.ToString()),
                            // Write user to response
                            response.WriteAsJsonAsync(returnUser).AsTask()
                        );
                    }
                    else
                    {
                        // Response duplicate message
                        await response.WriteAsJsonAsync("Email is registered");
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

        private static (bool, string) Validate(CreateUserDto data)
        {
            var valid = true;
            var message = new List<string>();

            // Validate data
            if (string.IsNullOrWhiteSpace(data.Name))
            {
                valid = false;
                message.Add("Name is missing.");
            }

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
            else
            {
                var regex = new Regex("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$");
                if (!regex.IsMatch(data.Password))
                {
                    valid = false;
                    message.Add("Password is must be at least 8 characters and contains at least 1 uppercase letter, 1 lowercase letter, and 1 number.");
                }
            }

            return (valid, string.Join("\n", message));
        }
    }
}
