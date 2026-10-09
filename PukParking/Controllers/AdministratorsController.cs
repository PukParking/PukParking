using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;
using PukParking.Services;
using Microsoft.AspNetCore.Authorization;


namespace Administrators.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    
    public class AdministratorsController : ControllerBase
    {
        private readonly MongoDBService _mongoDBService;

        public AdministratorsController(MongoDBService mongoDBService)
        {
            _mongoDBService = mongoDBService;
            
        }
        [HttpPost]
        public async Task<IActionResult> Create(Administrator administrator)
        {
            await _mongoDBService.Administrators.InsertOneAsync(administrator);
            return StatusCode(StatusCodes.Status201Created);
        }   
      
        
    }
}
