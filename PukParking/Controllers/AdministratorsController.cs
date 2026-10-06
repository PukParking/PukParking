using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;
using PukParking.Services;
using System.Security.Cryptography.X509Certificates;

namespace Administrators.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    
    public class AdministratorsController : ControllerBase
    {
        private readonly MongoDBService _mongoDBService;

        public AdministratorsController(MongoDBService mongoDBService)
        {
            _mongoDBService = mongoDBService;
            
        }
        [HttpGet]
        public async Task<ActionResult<List<Administrator>>> GetAdministrators()
        {
            var administrators = await _mongoDBService.Administrators.Find(_ => true).ToListAsync();
            return Ok(administrators);
        }

        [HttpPost]
        public async Task<ActionResult<Administrator>> Create(Administrator administrator)
        {
            await _mongoDBService.Administrators.InsertOneAsync(administrator);
            return Ok(administrator);
        }   
      
        
    }
}
