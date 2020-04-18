using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Persistence;

namespace Infrastructure.Security
{
  public class IsHostRequirement : IAuthorizationRequirement
  {
  }

  public class IsHostRequirementHandler : AuthorizationHandler<IsHostRequirement>
  {
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly DataContext _context;
    public IsHostRequirementHandler(IHttpContextAccessor httpContextAccessor, DataContext context)
    {
      _context = context;
      _httpContextAccessor = httpContextAccessor;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, IsHostRequirement requirement)
    {
        // var currentUserName = _httpContextAccessor.HttpContext.User?.Claims?.SingleOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        var currentUserName = context?.User?.Claims?.SingleOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        //  Get Activity ID from the route values
        var activityId = Guid.Parse(_httpContextAccessor.HttpContext.Request.RouteValues.SingleOrDefault(x => x.Key == "id").Value.ToString());
        
        // Result will extract the task from the FindAsync since this isn't an async function
        var activity = _context.Activities.FindAsync(activityId).Result;

        // UserActivities will be pulled automaticlaly by proxy since we are making use of it so no need to use Include().
        // We use LINQ to search UserActivites and find the user that is host.
        var host = activity?.UserActivities.FirstOrDefault(x => x.IsHost);

        // Now we can check if the host username is the same as the claims user.
        if (host?.AppUser?.UserName == currentUserName)
            context.Succeed(requirement);
        
        return Task.CompletedTask;
    }
  }
}