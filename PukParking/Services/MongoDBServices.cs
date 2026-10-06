using MongoDB.Driver;

namespace PukParking.Services
{
    public class MongoDBServices
    {
        private readonly IMongoDatabase _database;

        public MongoDBServices(IConfiguration configuration)
        {
            var connectionString = configuration["MongoDB:ConnectionString"];
            var databaseName = configuration["MongoDB:DatabaseName"];

            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoDatabase GetDatabase
        {
            get { return _database; }
        }
   
    }
}