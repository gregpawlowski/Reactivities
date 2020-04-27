using System.Linq;
using Application.Interfaces;
using AutoMapper;
using Domain;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Activities
{
  // Takes three values, the mapping from, mappting to and the type the value will resolve to.
  public class FollowingResolver : IValueResolver<UserActivity, AttendeeDto, bool>
  {
    private readonly IUserAccessor _userAccessor;
    private readonly DataContext _context;
    public FollowingResolver(IUserAccessor userAccessor, DataContext context)
    {
      _context = context;
      _userAccessor = userAccessor;

    }

    // Cant make this method async so we'll need to use Result.
    public bool Resolve(UserActivity source, AttendeeDto destination, bool destMember, ResolutionContext context)
    {
        var currentUser = _context.Users.SingleOrDefaultAsync(x => x.UserName == _userAccessor.GetCurrentUsername()).Result;

        if (currentUser.Followings.Any(x => x.TargetId == source.AppUserId))
            return true;
        
        return false;
    }
  }
}