using MongoDB.Driver;
using System.Security.Cryptography.X509Certificates;

namespace PukParking.Services
{

    public class MongoDBService
    {
        private readonly IMongoDatabase _database;

        public MongoDBService(IConfiguration configuration)
        {


            var connectionString = configuration["MongoDB:ConnectionString"];
            var databaseName = configuration["MongoDB:DatabaseName"];
            var client = new MongoClient(connectionString);
               
             _database = client.GetDatabase(databaseName);
        }
        public IMongoDatabase GetDatabase()
        {
            return _database;
        }

    }
}
