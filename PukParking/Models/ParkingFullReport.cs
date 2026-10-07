using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;



namespace PukParking.Models
{
    [BsonIgnoreExtraElements]
    public class ParkingFullReport
    {
        public string Report_Id { get; set; } = Guid.NewGuid().ToString();
        public string ParkingArea_Id { get; set; } = string.Empty;
       public DateTime ReportSubmitted_Time { get; set; }
    
        public DateTime ReportExpiration_Time { get; set; } 
    }
}