using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace API.Controllers
{
  [Route("api/[controller]")]
  public class ValuesController : ControllerBase
  {
    private readonly DataContext _context;

    public ValuesController(DataContext context)
    {
      _context = context;
    }
    // GET api/values
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Value>>> Get()
    {
      var values = await _context.Values.ToListAsync();
      return Ok(values);
    }

    // GET api/values/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Value>> Get(int id)
    {
        var value = await _context.Values.FindAsync(id);

        if (value != null)
            return Ok(value);
        
        return BadRequest("id does not exist");
    }

    // POST api/values
    [HttpPost]
    public void Post([FromBody] string value)
    {
      // Do something
    }


  }
}