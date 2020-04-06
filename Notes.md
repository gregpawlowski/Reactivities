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



# Validation and Error Handling
Error handling and excepion handling will be done in the application Project.
On the client side we can intercept Http Requests

## Data Atributes
```c#
using System.ComponentModel.DataAnnotations;
//omitted

[Required]
public string Title {get; set;}

[Required]
[StringLength(60, MinimumLength=3)]
public string Description {get; set;}
```

### APIController
APIController attribute on the controller class takes care of checking the modeLState and will automatically send down a 400 repspone if modelState is not valid.


Prior to APIController we would have to handle it ourselves like so:
```C#
    [HttpPost]
    public async Task<ActionResult<Unit>> Create(Create.Command command)
    {
      if (!ModelState.IsValid)
        return BadRequest(ModelState);

        return await _mediator.Send(command);
    }
```

#### Data Inferrance
The API controller also automatically tries to infer where the data is coming from. 


## Fluent Validation
Before processing the request we can make use of a package called FluentValidation.

```C#
public class CommmandValidator : AbstractValidator<Command>
{
  public CommandValidator()
  {
    RuleFor(x => x.Title).NotEmpty();
    RuleFor(x => x.Description).NotEmpyt();
    RuleFor(x => x.Category).NotEmpyt();
    RuleFor(x => x.Date).NotEmpyt();
    RuleFor(x => x.City).NotEmpyt();
    RuleFor(x => x.Venue).NotEmpyt();
  }
}
```
The flow is:

API COntroller -> Ihnside Command Handler (Command => Validate Command => Handler Logic) -> Back to API controller

Add Package:
FluentValidation.AspNetCore
Add it to the application project

We want to add teh FluentValidator between the Command and the Handler
```C#
    public class CommandValidator : AbstractValidator<Command>
    {
      public CommandValidator()
      {
        RuleFor(x => x.Title).NotEmpty();
      }
    }
```

We also have configure FluentValidation in Startup.cs
Have to specify the path to the assbly so we can just use one of the classes in the assembly/project.
```C#
            services.AddControllers()
                .AddFluentValidation(cfg => cfg.RegisterValidatorsFromAssemblyContaining<Create>());
```

## Exception & Error Handling
CLient Sends HTTP Rqeust -> API -> Application -> Domain -> Persistance
Then we send back a HTTP Response back to the Client

2XX - Okay
3XX - Not modified / redirection
4XX - Client side error (Client requesting data that doesnt exist etc..)
5XX - Server side error (Something went wrong on the API)

### Handling Errors in API COntroller
One way to do it is to handle it in the API controller:

```c#
    [HttpGet("{id}")]
    public async Task<ActionResult<Activity>> Details(Guid id)
    {
      var value = await _context.Value.FindAsync(id);
      
      if (value == null)
        return NotFound();

      return Ok(value);
    }
```

APIController has access to the HTTP Context so we can write our reponse and exist out of the request but we'ere not putting logic in the API controller.

### Application Handler
Application Handler doesn't have access to HTTP Context, it just recieves and object and sends out an object but we do have to stop execution somehow.


We can throw an Exception to stop the excution.
```C# Application Query Handler 
public async Task<Activity> Handle(Query request, CancellationToken cancellationToken)
{
  var activity = await _context.Activites.FindAsync(request.Id);

  if (acitvity == null) 
    throw Exception("Not Found");
  
  return activity;
}
```

We don't want to send back a 500 error though because that's what will happen with an Excpetion.

We will still throw an Exception but we'll create our own that has Exception Handling middleware. This middleware will ahve access to the Context and if an Excpetion is thrown it will check if it's our own Rest Exeption or an Applicatino one. In the case of our own it will send back a 400 error etc..

### Handling Errors Strategy
What kind of errors do we need?

404 - Not Found
401 - Not Authorized
500 Errors - Server thrown exception

WE need to intercept Excpetions throw by our Handler and then return them to the Client as BadRequests or NotFound status codes etc..

### Creating a Exception Class for Rest Exceptions

```C#
using System;
using System.Net;

namespace Application.Errors
{
  public class RestException : Exception
  {
    public RestException(HttpStatusCode code, object errors = null)
    {
      Code = code;
      Errors = errors;
    }

    public HttpStatusCode Code { get; }
    public object Errors { get; }
  }
}
```

### Add MiddleWare
This middleware is long but really its just catching the exception, checking what type it is and writing the response.
The Middleware should be early in the pipeline
The invoke method is needed by all middleare.

All middleware needs an Inoke method. We call next in the Invoke method to pass the context to the next delegate in the pipeline. We await thereponse and catch excpeitons. Once we catch the exception we check to see what type it is.
```C#
namespace API.Middleware
{
  public class ErrorHandlingMiddleware
  {
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
      _logger = logger;
      _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
      try
      {
        await _next(context);
      }
      catch (Exception ex)
      {
        await HandleExceptionAsync(context, ex, _logger);
      }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex, ILogger<ErrorHandlingMiddleware> logger)
    {
      object errors = null;

      switch (ex)
      {
        case RestException re:
          logger.LogError(ex, "REST ERROR");
          errors = re.Errors;
          context.Response.StatusCode = (int)re.Code;
          break;
        case Exception e:
          logger.LogError(ex, "SERVER ERROR");
          errors = string.IsNullOrWhiteSpace(e.Message) ? "Error" : e.Message;
          context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
          break;
      }

      context.Response.ContentType = "application/json";

      if (errors != null)
      {
        var result = JsonSerializer.Serialize(new
        {
          errors
        });

        await context.Response.WriteAsync(result);
      }

    }
  }
}
```

### Using The Middleware

```C# Startup.cs
            app.UseMiddleware<ErrorHandlingMiddleware>();

            if (env.IsDevelopment())
            {
                // app.UseDeveloperExceptionPage();
            }
```

Now in the Handler:
```C#
      public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
      {
        var activity = await _context.Activities.FindAsync(request.Id);

        if (activity == null)
            throw new RestException(HttpStatusCode.NotFound, new {activity = "Not Found"});
        
        _context.Remove(activity);
        
        var success = await _context.SaveChangesAsync() > 0;

        if (success) return Unit.Value;

        throw new Exception("Problem saving changes");
      }
```