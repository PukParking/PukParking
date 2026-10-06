using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;




namespace PukParking.Models
{
    [BsonIgnoreExtraElements]
    public class ParkingSpaces
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ParkingSpaceId { get; set; } = string.Empty;

        public string ParkingName { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public bool IsAvailable { get; set; }

        public double Latitude { get; set; }

        public double Longitude { get; set; }
    }
}