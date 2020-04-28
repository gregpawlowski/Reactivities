using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Persistence;

namespace Application.Activities
{
  public class List
  {

    public class ActivitiesEnvelope
    {
      public List<ActivityDto> Activites { get; set; }
      public int ActivityCount { get; set; }
    }
    public class Query : IRequest<ActivitiesEnvelope>
    {
      public Query(int? offset, int? limit, bool isGoing, bool isHost, DateTime? startDate)
      {
        StartDate = startDate ?? DateTime.UtcNow;
        IsHost = isHost;
        IsGoing = isGoing;
        Offset = offset;
        Limit = limit;
      }
      public int? Offset { get; set; }
      public int? Limit { get; set; }
      public bool IsGoing { get; set; }
      public bool IsHost { get; set; }
      public DateTime? StartDate { get; set; }
    }

    public class Handler : IRequestHandler<Query, ActivitiesEnvelope>
    {
      private readonly DataContext _context;
      private readonly IMapper _mapper;
      private readonly IUserAccessor _userAccessor;
      public Handler(DataContext context, IMapper mapper, IUserAccessor userAccessor)
      {
        _userAccessor = userAccessor;
        _mapper = mapper;
        _context = context;
      }
      public async Task<ActivitiesEnvelope> Handle(Query request, CancellationToken cancellationToken)
      {
        // var activities = await _context.Activities
        //   .Include(x => x.UserActivities)
        //   .ThenInclude(x => x.AppUser)
        //   .ToListAsync();

        // Now using Lazy loadig proxies, no need to add Include()

        var queryable = _context.Activities
          .Where(x => x.Date >= request.StartDate)
          .OrderBy(x => x.Date)
          .AsQueryable();

        if (request.IsGoing && !request.IsHost)
        {
          queryable = queryable.Where(x => x.UserActivities.Any(u => u.AppUser.UserName == _userAccessor.GetCurrentUsername()));
        }

        if (request.IsHost && !request.IsGoing)
        {
          queryable = queryable.Where(x => x.UserActivities.Any(u => u.AppUser.UserName == _userAccessor.GetCurrentUsername() && u.IsHost));
        }

        var activities = await queryable
          .Skip(request.Offset ?? 0)
          .Take(request.Limit ?? 3)
          .ToListAsync();

        return new ActivitiesEnvelope
        {
          Activites = _mapper.Map<List<ActivityDto>>(activities),
          ActivityCount = queryable.Count()
        };
      }
    }
  }
}