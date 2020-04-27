using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Profiles
{
  public class ProfileReader : IProfileReader
  {
    private readonly DataContext _context;
    private readonly IUserAccessor _userAccessor;
    public ProfileReader(DataContext context, IUserAccessor userAccessor)
    {
      _userAccessor = userAccessor;
      _context = context;

    }

    // Return a profile
    public async Task<Profile> ReadProfile(string username)
    {
      var user = await _context.Users.SingleOrDefaultAsync(u => u.UserName == username);

      if (user == null)
        throw new RestException(HttpStatusCode.NotFound, new { User = "Not Found" });

      var currentUser = await _context.Users.SingleOrDefaultAsync(u => u.UserName == _userAccessor.GetCurrentUsername());

      var profile = new Profile
      {
        DisplayName = user.DisplayName,
        Username = user.UserName,
        Image = user.Photos.FirstOrDefault(x => x.IsMain)?.Url,
        Photos = user.Photos,
        Bio = user.Bio,
        FollowersCount = user.Followers.Count,
        FollowingCount = user.Followings.Count,
      };

      if (currentUser.Followings.Any(u => u.TargetId == user.Id))
      {
        profile.IsFollowed = true;
      }
      else
      {
        profile.IsFollowed = false;
      }

      return profile;
    }
  }
}