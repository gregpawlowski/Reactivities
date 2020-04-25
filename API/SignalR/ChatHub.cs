using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Application.Comments;
using MediatR;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR
{
  public class ChatHub : Hub
  {
    private readonly IMediator _mediator;
    public ChatHub(IMediator mediator)
    {
      _mediator = mediator;
    }

    // SignalR Method Name matters, it will be used from the client side to envoke the method.
    public async Task SendComment(Create.Command command)
    {
      string username = GetUsername();

      command.Username = username;

      // Send the commetn through mediator, mediator will return the comment Dto
      var comment = await _mediator.Send(command);

      // Send comment to all clients
      // await Clients.All.SendAsync("RecieveComment", comment);

      await Clients.Group(command.ActivityId.ToString()).SendAsync("RecieveComment", comment);
    }

    private string GetUsername()
    {
      // Use HubContext to get Username, this is derived from Hub.
      return Context.User?.Claims?.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;
    }

    // This method will be used right away when a connection is made, it'll add this client to a group
    // In this case the groupName will be the activityId.
    public async Task AddToGroup(string groupName)
    {
      await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

      var username = GetUsername();

      await Clients.Group(groupName).SendAsync("Send", $"{username} has joined the group");
    }

    public async Task RemoveFromGroup(string groupName)
    {
      await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

      var username = GetUsername();

      await Clients.Group(groupName).SendAsync("Send", $"{username} has left the group");
    }


  }
}