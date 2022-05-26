using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Azure.Cosmos;

namespace ClassER.Controllers
{
    public static class CosmosDb
    {
        public const string DATABASE_ID = "ClassER";
        public const string SNAPSHOT_CONTAINER_ID = "Snapshot";
        public const string SESSION_CONTAINER_ID = "Session";
        public const string USER_CONTAINER_ID = "User";

        public static CosmosClient CosmosClient { get; } = new CosmosClient(Environment.GetEnvironmentVariable("CosmosEndpoint", EnvironmentVariableTarget.Process), Environment.GetEnvironmentVariable("CosmosKeyFromKeyVault", EnvironmentVariableTarget.Process));

        public static async Task<CosmosContainer> GetContainerAsync(string containerId)
        {
            // Get container
            return await Task.Run(() => CosmosClient.GetContainer(DATABASE_ID, containerId));
        }

        public static async Task<ItemResponse<T>> CreateItemAsync<T>(CosmosContainer container, T item, string partitionKeyValue)
        {
            // Create item
            return await container.CreateItemAsync<T>(item, new PartitionKey(partitionKeyValue));
        }

        public static async Task<T?> GetItemByQueryAsync<T>(CosmosContainer container, QueryDefinition query)
        {
            // Get first item
            await foreach (var item in container.GetItemQueryIterator<T>(query))
                return item;

            return default(T);
        }

        public static async Task<List<T>> GetItemsByQueryAsync<T>(CosmosContainer container, QueryDefinition query)
        {
            var list = new List<T>();

            // Get items
            await foreach (var item in container.GetItemQueryIterator<T>(query))
                list.Add(item);

            return list;
        }

        public static async Task UpdateItemAsync<T>(CosmosContainer container, T item, string id, string partitionKeyValue)
        {
            await container.ReplaceItemAsync<T>(item, id, new PartitionKey(partitionKeyValue));
        }

        public static async Task DeleteItemByIdAsync<T>(CosmosContainer container, string id, string partitionKeyValue)
        {
            // Delete item
            await container.DeleteItemAsync<T>(id, new PartitionKey(partitionKeyValue));
        }

        public static async Task DeleteItemsByIdsAsync<T>(CosmosContainer container, List<string> ids, string partitionKeyValue)
        {
            // Delete item
            foreach (var id in ids)
            {
                await container.DeleteItemAsync<T>(id, new PartitionKey(partitionKeyValue));
            };
        }

        public static async Task DeleteItemsByIdWithPartitionKeysAsync<T>(CosmosContainer container, List<(string, string)> idWithPartitionKeys)
        {
            // Delete item
            foreach (var id in idWithPartitionKeys)
            {
                await container.DeleteItemAsync<T>(id.Item1, new PartitionKey(id.Item2));
            };
        }
    }
}
