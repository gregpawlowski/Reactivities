# CQRS and Mediator Pattern

## Adding Activity Entity
Entities are all created in the Domain project.

Activities will use a Guid as the primary key.
In SQLServer that is a uniqueidentifier type.

```C#
namespace Domain
{
    public class Activity
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public DateTime Date { get; set; }
        public string City { get; set; }
        public string Venue { get; set; }
    }
}
```

## Seeding Activity Data
In persistance folder create a new seed class.

We won't use Entity framework Modelbuilder to seed the data becuase we don't want to manually create the ID's.


## CQRS - Commands and Queries 
Command alwasy does something - modifies state, should not return a value. Create / Update / Delete should be commands.
Query - Returns something, does not modify state. Ansers a question. Get a list of activities, etc..


The flow of data is differetn for Commands and Queries

API -> Command -> Domain -> Persistence -> Database -> Data Access -> Query -> API

CQRS has different implementations:
Single Database:
Commands use a Domain, Domain, uses Persistance which queries Database
Queries use Database
Simple to Implement

Read Database And Write Database (2 Databases)
Command use Domain, Domain users Persistence which writes to Write DB
Queries use Read DB
Eventual consistence
Can be faster.

Event Store
Commands use Domain -> Doamin users Persistence which users Event Store
Event Store palys event to Read Database.
Queries use Read DB

This introduces complexity but the event is tracked.

Pros:
Scalability
Flexability
Event Sourcing

Cons:
More comples then other patterns
Does not modify state
Event sourcing costs

## mediatR
API controllers will use the Mediator handler. The Mediator will run the application logic though and then return it back to the API controller.

This is becuase our API should not know anything about our application and Application should not know anything about the API.

For example to create an acitity:
Command Handler:
{
  Title: Test Activity
  Date: 21 Oct 2020
}

Handler Logic:
Create new Activity
Save new Actitvity to DB
return 'Unit' -> 

Unit is a special mediator object.



To qery and get some data:
Query Handler:
{
  id: 3
}

Get Activity from Database with Id of 3
If activity doesn not exist return not found
if activity is found, poroject into ActivityDTO
return ActivityDTO

## First Query Handler
All application logic should go in Application project.

First we need to install mediatoR, it should be installed to the Application project.

Then we create a folder for Activites, this will hold all our handlers.

```C#
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Activities
{
  public class List
  {
    public class Query : IRequest<List<Activity>> { }

    public class Handler : IRequestHandler<Query, List<Activity>>
    {
      private readonly DataContext _context;
      public Handler(DataContext context)
      {
        _context = context;
      }
      public async Task<List<Activity>> Handle(Query request, CancellationToken cancellationToken)
      {
        var activities = await _context.Activities.ToListAsync();
        return activities;
      }
    }
  }
}
```


## Cancellation Tokens
The cancellation token can be used to cancel a request and clean up database.

The way you use a cancellationToken is that you have to pass it to the controller

```C# ActivitiesController.cs
    [HttpGet]
    public async Task<ActionResult<List<Activity>>> List(CancellationToken ct)
    {
        return await _mediator.Send(new List.Query(), ct);
    }
```

Here the CancellationToken is passed to Mediator and mediator will pass it to EntityFramework so that it can cancel the request if the user cancels the request.

```C#
namespace Application.Activities
{
  public class List
  {
    public class Query : IRequest<List<Activity>> { }

    public class Handler : IRequestHandler<Query, List<Activity>>
    {
      private readonly DataContext _context;
      private readonly ILogger<List> _logger;
      public Handler(DataContext context, ILogger<List> logger)
      {
        _logger = logger;
        _context = context;
      }
      public async Task<List<Activity>> Handle(Query request, CancellationToken cancellationToken)
      {
        try
        {
          for (var i = 0; i < 10; i++)
          {
            cancellationToken.ThrowIfCancellationRequested();
            await Task.Delay(1000, cancellationToken);
            _logger.LogInformation($"Task {i} has completed");
          }
        } catch (Exception ex) when (ex is TaskCanceledException)
        {
            _logger.LogInformation("Task was cancelled");
        }
        
        var activities = await _context.Activities.ToListAsync(cancellationToken);
        return activities;
      }
    }
  }
}
```

## Adding a Create Handler (Command)
