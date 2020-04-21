using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
  public class Delete
  {
    public class Command : IRequest
    {
      public string PublicId { get; set; }
    }

    public class Handler : IRequestHandler<Command>
    {
      private readonly DataContext _context;
      private readonly IUserAccessor _userAccessor;
      private readonly IPhotoAccessor _photoAccessor;
      public Handler(DataContext context, IUserAccessor userAccessor, IPhotoAccessor photoAccessor)
      {
        _photoAccessor = photoAccessor;
        _userAccessor = userAccessor;
        _context = context;
      }
      public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
      {
        var user = await _context.Users.SingleOrDefaultAsync(x => x.UserName == _userAccessor.GetCurrentUsername());

        var photo = user.Photos.FirstOrDefault(x => x.Id == request.PublicId);

        if (photo == null)
            throw new RestException(HttpStatusCode.NotFound, new { Photo = "Not found" });

        if (photo.IsMain)
            throw new RestException(HttpStatusCode.BadRequest, new { Photo = "Cannot delete main photo"});

        var deleteResult = _photoAccessor.DeletePhoto(photo.Id);

        if (deleteResult == null)
            throw new Exception("Problem deleting the photo");

        _context.Photos.Remove(photo);
        
        // handler logic
        var success = await _context.SaveChangesAsync() > 0;

        if (success) return Unit.Value;

        throw new Exception("Problem saving changes");
      }
    }
  }
}