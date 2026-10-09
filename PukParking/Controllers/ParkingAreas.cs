using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;
using PukParking.Services;
using System.Security.Cryptography.X509Certificates;

namespace ParkingAreas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    
    public class ParkingAreasController : ControllerBase
    {
        private readonly MongoDBService _mongoDBService;

        public ParkingAreasController(MongoDBService mongoDBService)
        {
            _mongoDBService = mongoDBService;
            
        }
        [HttpGet]
        public async Task<ActionResult<List<ParkingArea>>> GetParkingAreas()
        {
            var parkingAreas = await _mongoDBService.ParkingAreas.Find(_ => true).ToListAsync();
            return Ok(parkingAreas);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<ParkingArea>> Create(ParkingArea parkingArea)
        {
            await _mongoDBService.ParkingAreas.InsertOneAsync(parkingArea);
            return Ok(parkingArea);
        }   
      
        
    }
}
