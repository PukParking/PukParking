
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace PukParking.Models
{
    [BsonIgnoreExtraElements]
    public class Administrator
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public ObjectId Id { get; set; }

        public string Admin_ID { get; set; } = string.Empty;
        public string Admin_Username { get; set; } = string.Empty;
        public string Admin_PasswordHash { get; set; } = string.Empty;
        public string Admin_Permissions { get; set; } = string.Empty;
    }
}