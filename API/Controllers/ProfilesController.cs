using System.Threading.Tasks;
using Application.Profiles;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ProfilesController: BaseController
    {
        [HttpGet("{username}")]
        public async Task<ActionResult<Profile>> Get([FromRoute]Details.Query query)
        {
            return await Mediator.Send(query);
        }
    }
}