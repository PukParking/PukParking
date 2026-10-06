using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;



namespace PukParking.Models

{
    public class ParkingArea
    {
        public string ParkingArea_Id { get; set; } = Guid.NewGuid().ToString();
        public string Admin_ID { get; set; } = string.Empty;
        public string ParkingArea_Name { get; set; } = string.Empty;
        public double ParkingArea_Latitude { get; set; }
        public double ParkingArea_Longitude { get; set; }
        public string Parking_Type { get; set; } = string.Empty;
        public int Parking_Capacity { get; set; }
        public int ParkingArea_Occupancy { get; set; }
        public string ParkingArea_Restrictions { get; set; } = string.Empty;
        public string ParkingArea_OperatingHours { get; set; } = string.Empty;
        public string ParkingArea_Accessibility { get; set; } = string.Empty;
        public string ParkingArea_ImageURL { get; set; } = string.Empty; 
        public bool ParkingArea_IsActive { get; set; } = true;
    }
}