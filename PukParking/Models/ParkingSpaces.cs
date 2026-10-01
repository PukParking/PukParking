using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;


namespace PukParking.Models
{
    public class ParkingSpaces
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string SpaceNumber { get; set; } = string.Empty;

        public string ParkingArea { get; set; } = string.Empty;

        public string Status { get; set; } = "Available";

        public double Latitude { get; set; }

        public double Longitude { get; set; }
       
    }
}
