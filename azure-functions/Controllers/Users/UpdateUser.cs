using System;
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
    public static class UpdateUser
    {
        [Function("UpdateUser")]
        public static async Task<HttpResponseData> RunAsync(
            [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "users")] HttpRequestData req,
            UpdateUserDto data
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
                    var userContainer = await CosmosDb.GetContainerAsync(CosmosDb.USER_CONTAINER_ID);

                    // Get item
                    var query = new QueryDefinition(@$"SELECT * FROM c WHERE c.id = @userId")
                        .WithParameter("@userId", userId);
                    var user = await CosmosDb.GetItemByQueryAsync<User>(userContainer, query);

                    if (user != null && Utils.VerifyPassword(data.Password, user.Salt, user.Password))
                    {
                        // Update item
                        user.Name = data.Name;
                        if (data.UpdatePassword) {
                            user.Salt = Utils.GenerateSalt();
                            user.Password = Utils.HashPassword(data.NewPassword, user.Salt);
                        }

                        Task.WaitAll(
                            // Save to database
                            CosmosDb.UpdateItemAsync<User>(userContainer, user, user.Id.ToString(), user.Id.ToString()),
                            // Response update successful
                            response.WriteAsJsonAsync("Updated user").AsTask()
                        );
                    }
                    else
                    {
                        // Response not found message
                        await response.WriteAsJsonAsync("Incorrect password");
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

        private static (bool, string) Validate(Guid userId, UpdateUserDto data)
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
            if (string.IsNullOrWhiteSpace(data.Name))
            {
                valid = false;
                message.Add("Name is missing.");
            }

            if (string.IsNullOrWhiteSpace(data.Password))
            {
                valid = false;
                message.Add("Password is invalid.");
            }

            if (data.UpdatePassword)
            {
                if (string.IsNullOrWhiteSpace(data.NewPassword))
                {
                    valid = false;
                    message.Add("New password is invalid.");
                }
                else
                {
                    var regex = new Regex("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$");
                    if (!regex.IsMatch(data.NewPassword))
                    {
                        valid = false;
                        message.Add("Password is must be at least 8 characters and contains at least 1 uppercase letter, 1 lowercase letter, and 1 number.");
                    }
                }
            }

            return (valid, string.Join("\n", message));
        }
    }
}
