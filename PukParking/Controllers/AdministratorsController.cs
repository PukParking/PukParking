using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using PukParking.Models;
using PukParking.Services;


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
        [HttpGet("Count")]
        public async Task<ActionResult<int>> GetAdminCount()
        {
            var count = await _mongoDBService.Administrators.CountDocumentsAsync(_ => true);
            return Ok(new { Count = count });
        }
        [HttpGet("diagnostic")]
public async Task<IActionResult> Diagnostic()
{
var database = _mongoDBService.GetDatabase();

var collectionNames = await database
.ListCollectionNames()
.ToListAsync();

var adminCount = await _mongoDBService.Administrators
.CountDocumentsAsync(_ => true);

return Ok(new
{
DatabaseName = database.DatabaseNamespace.DatabaseName,
Collections = collectionNames,
AdministratorsCount = adminCount
});
}

        [HttpPost]
        public async Task<ActionResult<Administrator>> Create(Administrator administrator)
        {
            await _mongoDBService.Administrators.InsertOneAsync(administrator);
            return Ok(administrator);
        }   
      
        
    }
}
