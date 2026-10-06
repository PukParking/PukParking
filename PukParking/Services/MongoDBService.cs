using MongoDB.Driver;
using PukParking.Models;


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
        public IMongoDatabase GetDatabase ()  
        {
            return _database;
            
        }
        
        public IMongoCollection<Administrator> Administrators
        {
            get {
                    return _database.GetCollection<Administrator>("Administrators"); 
                }
        }
        public IMongoCollection<ParkingSpaces> ParkingSpaces
        {
            get
            {
                return _database.GetCollection<ParkingSpaces>("ParkingSpaces");
            }
        }
        public IMongoCollection<Building> Buildings
        {
            get
            {
                return _database.GetCollection<Building>("Buildings");
            }
        }
        public IMongoCollection<ParkingArea> ParkingAreas
        {
            get
            {
                return _database.GetCollection<ParkingArea>("ParkingAreas");
            }
        }
        public IMongoCollection<ParkingFullReport> ParkingFullReports
        {
            get
            {
                return _database.GetCollection<ParkingFullReport>("ParkingFullReports");
            }
        }
      

    }
}
