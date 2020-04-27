using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Profiles
{
  public class Details
  {
    public class Query : IRequest<Profile>
    {
      public string Username { get; set; }
    }

    public class Handler : IRequestHandler<Query, Profile>
    {
      private readonly DataContext _context;
      private readonly IProfileReader _profileReader;
      public Handler(DataContext context, IProfileReader profileReader)
      {
        _profileReader = profileReader;
        _context = context;
      }
      public async Task<Profile> Handle(Query request, CancellationToken cancellationToken)
      {
        // var user = await _context.Users.SingleOrDefaultAsync(u => u.UserName == request.Username);

        // if (user == null)
        //   throw new RestException(HttpStatusCode.NotFound, new { User = $"User {request.Username} not found" });

        // return new Profile
        // {
        //   DisplayName = user.DisplayName,
        //   Username = user.UserName,
        //   Image = user.Photos.FirstOrDefault(x => x.IsMain)?.Url,
        //   Photos = user.Photos,
        //   Bio = user.Bio
        // };

        return await _profileReader.ReadProfile(request.Username);

      }
    }
  }
}