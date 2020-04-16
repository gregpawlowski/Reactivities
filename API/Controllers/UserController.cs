using System.Threading.Tasks;
using Application.User;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class UserController : BaseController
    {
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<User>> login(Login.Query query) 
        {
            return await Mediator.Send(query);
        }
        
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<User>> register(Register.Command command)
        {
            return await Mediator.Send(command);
        }

        [HttpGet]
        public async Task<ActionResult<User>> getUser()
        {
            return await Mediator.Send(new CurrentUser.Query());
        }
    }
}