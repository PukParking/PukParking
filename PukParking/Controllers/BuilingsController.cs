using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;
using PukParking.Services;
using System.Security.Cryptography.X509Certificates;

namespace Buildings.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    
    public class BuildingsController : ControllerBase
    {
        private readonly MongoDBService _mongoDBService;

        public BuildingsController(MongoDBService mongoDBService)
        {
            _mongoDBService = mongoDBService;
            
        }
        [HttpGet]
        public async Task<ActionResult<List<Building>>> GetBuildings()
        {
            var buildings = await _mongoDBService.Buildings.Find(_ => true).ToListAsync();
            return Ok(buildings);
        }

        [HttpPost]
        public async Task<ActionResult<Building>> Create(Building building)
        {
            await _mongoDBService.Buildings.InsertOneAsync(building);
            return Ok(building);
        }   
      
        
    }
}
