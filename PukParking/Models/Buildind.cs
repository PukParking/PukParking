using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;



namespace PukParking.Models
{
    public class Building
    {
        public string Building_Id { get; set; } = Guid.NewGuid().ToString();
        public string Admin_ID { get; set; } = string.Empty;
        public string Building_Name { get; set; } = string.Empty;
        public string Building_Abbreviation { get; set; } = string.Empty;

        public string Building_Description { get; set; } = string.Empty;
        public double Building_Latitude { get; set; }
        public double Building_Longitude { get; set; }
    }
}