using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;
using PukParking.Services;
using System.Security.Cryptography.X509Certificates;

namespace ParkingFullReports.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    
    public class ParkingFullReportsController : ControllerBase
    {
        private readonly MongoDBService _mongoDBService;

        public ParkingFullReportsController(MongoDBService mongoDBService)
        {
            _mongoDBService = mongoDBService;
            
        }
        [HttpGet]
        public async Task<ActionResult<List<ParkingFullReport>>> GetParkingFullReports()
        {
            var parkingFullReports = await _mongoDBService.ParkingFullReports.Find(_ => true).ToListAsync();
            return Ok(parkingFullReports);
        }

        [HttpPost]
        public async Task<ActionResult<ParkingFullReport>> Create(ParkingFullReport parkingFullReport)
        {
            await _mongoDBService.ParkingFullReports.InsertOneAsync(parkingFullReport);
            return Ok(parkingFullReport);
        }   
      
        
    }
}
