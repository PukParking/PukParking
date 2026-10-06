using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;
using PukParking.Services;




namespace PukParking.Models
{
    public class Administrator
    {
        public string Admin_Id { get; set; } = Guid.NewGuid().ToString();
        public string Admin_Username { get; set; } = string.Empty;
        public string Admin_PasswordHash { get; set; } = string.Empty;
        public string Admin_Permissions { get; set; } = string.Empty;

    }
}