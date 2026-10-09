using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;
using PukParking.Services;
using System.Security.Cryptography.X509Certificates;

namespace PukParking.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    
    public class ParkingController : ControllerBase
    {
        private readonly IMongoCollection<ParkingSpaces> _parkingSpaces;

        public ParkingController(MongoDBService mongoDBService)
        {
           var database = mongoDBService.GetDatabase();
            _parkingSpaces = database.GetCollection<ParkingSpaces>("ParkingSpaces");
            
        }
        [HttpGet]
        public async Task<ActionResult<List<ParkingSpaces>>> GetAll()
        {
            var parkingSpaces = await _parkingSpaces.Find(_ => true).ToListAsync();
            return Ok(parkingSpaces);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ParkingSpaces>> Create(ParkingSpaces parkingSpace)
        {
            await _parkingSpaces.InsertOneAsync(parkingSpace);
            return Ok(parkingSpace);
        }
    }
}
