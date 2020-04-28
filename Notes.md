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

API COntroller -> Inside Command Handler (Command => Validate Command => Handler Logic) -> Back to API controller

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

# Identity
* Membership system
* Supports login stored in Identity
* Supports external providers
* Comes with default user stores
* * ASPNetRoles
* * ASPNetUserTokens
* * ASPNetUsers 
* UserManager - gives us funcitons to manage users
* SignInManager - Gives us access to log into the application

ASPNetCore will Hash and Salt the passwords. It will be very difficult to crack these type of passwrods.
Thsi is done by PasswrodHasher.cs class

## Adding Identity User
Data context has to dervice from IDentityDBContext
```C#
public class DataContext: IdentityDbContext<AppUser>
```
And on Moddel creating has to be called on base
```C#
    protected override void OnModelCreating(ModelBuilder builder) 
        {
            // Pass builder to IdentityDBContext OnModelCreating
            base.OnModelCreating(builder);
```

The AppUser will be the model used it has to derve from IDentity User
This means you have to intall the Microsoft.AspNetCore.Identity.EntityFrameworkCore package to Domain project.
```C#
using Microsoft.AspNetCore.Identity;

namespace Domain
{
    public class AppUser : IdentityUser
    {
        public string DisplayName { get; set; }
    }
}
```

## Adding Startup Information
** NOte: Might have to add package Microsoft.AspNetCore.Identity.UI to use SignInManger
In ConfigureServices

```C# Startup.cs
          var builder = services.AddIdentityCore<AppUser>();
            var identityBuilder = new IdentityBuilder(builder.UserType, builder.Services);
            identityBuilder.AddEntityFrameworkStores<DataContext>();
            identityBuilder.AddSignInManager<SignInManager<AppUser>>();
```

## Seeding Users
Check the Seed Method....

## Adding a Login Handler
Although we will be posting the email and password, we don't actually save the data so we will use a Query instead of a Command.

```C#
namespace Application.User
{
  public class Login
  {

    // Set up the properties passed to the Query. In this case they will be the Email and Passsword
    public class Query : IRequest<AppUser>
    {
      public string Email { get; set; }
      public string Password { get; set; }
    }

    // Set up the Fluent Validator, 
    public class QueryValidator : AbstractValidator<Query>
    {
      public QueryValidator()
      {
        RuleFor(x => x.Email).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
      }
    }

    public class Handler : IRequestHandler<Query, AppUser>
    {
      private readonly UserManager<AppUser> _userManager;
      private readonly SignInManager<AppUser> _signInManager;

      public Handler(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager)
      {
        _signInManager = signInManager;
        _userManager = userManager;
      }
      public async Task<AppUser> Handle(Query request, CancellationToken cancellationToken)
      {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
          throw new RestException(HttpStatusCode.Unauthorized);

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);

        if (result.Succeeded)
        {
          // TODO: generate token
          return user;
        }

        throw new RestException(HttpStatusCode.Unauthorized);
      }
    }
  }
}
```

## Creating A Base Controller
We cna create a base controller so we don't have ot template out all the same code all the time.
```C#
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace API.Controllers
{   
    [Route("api/[controller]")]
    [ApiController]
    public class BaseController : ControllerBase
    {
        private IMediator _mediator;

        // WHen using MEdiator it wil lreturn the _mediator if it exists or it will Get the service.
        protected IMediator Mediator => _mediator ?? (_mediator = HttpContext.RequestServices.GetService<IMediator>());
    }
}
```

## Adding a User DTO Object
```C# User DTO Model
namespace Application.User
{
    public class User
    {
        public string DisplayName { get; set; }
        public string Token { get; set; }
        public string Username { get; set; }
        public string Image { get; set; }
    }
}
```

```C# In the Handle we can crete the user and send that back now
        if (result.Succeeded)
        {
          // TODO: generate token
          return new User 
          {
              DisplayName = user.DisplayName,
              Token = "This will be a token",
              Username = user.UserName,
              Image = null
          };
        }
```

## JSON Web Tokens Introduction
Toekns will be generated in their own project, we will create an infrastructure project. It's job will be to generate JWT tokens.
The application will know nothing about generating a token.

We will give our Infrastructure project a dependency on the Application project and the API will have a dependency on the Infrastructure project.

`dotnet new classLib -n Infrastructure`

Add to the solution

`dotnet sln add Infrastructure/`

Change the target framweok on the classLib.

In the Infrastructure Project folder:
`dotnet add reference ../Application/`

In the API folder:
`dotnet add reference ../Infrastructure/`
Becasue we will be useing the JWT as a service.

## Application Interfaces
Becuaes our application has no dependency we will create an interface to make use of the Infrastructure classes.

```C#
using Domain;

namespace Application.Interfaces
{
    public interface IJWTGenerator
    {
        string CreateToken(AppUser user);
    }
}
```

### Add it as a service 
```C#
            services.AddScoped<IJWTGenerator, JWTGenerator>();
```

## Creating the Generator Implemenation

We'll need to add a reference to <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="6.5.0"/> in the Infrastructure project.

```C#
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.Interfaces;
using Domain;
using Microsoft.IdentityModel.Tokens;

namespace Infrastructure.Security
{
  public class JWTGenerator : IJWTGenerator
  {
    public string CreateToken(AppUser user)
    {
      // Build up a list of claims
      var claims = new List<Claim>
      {
          new Claim(JwtRegisteredClaimNames.NameId, user.UserName)
      };

      // Generate signing credentials
      var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("super secret key"));

      var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

      var tokenDescriptor = new SecurityTokenDescriptor
      {
        Subject = new ClaimsIdentity(claims),
        Expires = DateTime.Now.AddDays(7),
        SigningCredentials = creds
      };

      // The otken Handler will be a JWTSecurity Token
      var tokenHandler = new JwtSecurityTokenHandler();
      //Create the toekn
      var token = tokenHandler.CreateToken(tokenDescriptor);

      return tokenHandler.WriteToken(token);
    }
  }
}
```

## Making use of the Token in Login Handler
Since JwtGenerator is added as a service we can make use of it in the Handlers...

```C# Contrustor
      public Handler(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, IJwtGenerator jwtGenerator)
      {
        _jwtGenerator = jwtGenerator;
        _signInManager = signInManager;
        _userManager = userManager;
      }
```



```C#
        if (result.Succeeded)
        {
          // TODO: generate token
          return new User
          {
            DisplayName = user.DisplayName,
            Token = _jwtGenerator.CreateToken(user),
            Username = user.UserName,
            Image = null
          };
        }
```

## Securing the app with Authentication

IN dotnet 3.0 you need to bring in to the API project
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="3.0.0"/>

NOw in the Startup class

```C#
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("super secret key"));

            // We have to give our Authentication a scheme, in this case we will use JwtBearerDefaults.AuthenicationScheme.
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(opt => 
                {
                    // Tell the API what to validate when we recieve a token.
                    opt.TokenValidationParameters = new TokenValidationParameters
                    {
                        // Validate they key signature.
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = key,
                        // Don't validate the URL for now
                        ValidateAudience = false,
                        ValidateIssuer = false
                    };
                });
```

Add Authorization to the Middleware
```C#
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {

            app.UseMiddleware<ErrorHandlingMiddleware>();

            if (env.IsDevelopment())
            {
                // app.UseDeveloperExceptionPage();
            }

            // app.UseHttpsRedirection();

            app.UseRouting();
            app.UseCors("CorsPolicy");

            app.UseAuthentication();
            app.UseAuthorization();


            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
```

Now we can use the Authorize attribute in controllers


## Using Dotnet User Secrets to hide
User secrets manager comes with dotnet tools
`dotnet user-secrets`

When they are added here, they are only available in development mode, they will not show in production.

First we ahve to initalize user secrets
`dotnet user-secrets init -p API/`

Adding a key
`dotnet user-secrets set "TokenKey" "super secret key" -p API/`

### Making use of a key in the application
Configuration will check appsettings as well as the user secrets store if your are in development. SO we can do the follwoing:
```C#
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["TokenKey"]));
```


## Adding Authorization Policy

```C# Startup
           services.AddControllers(opt => {
                var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();

                opt.Filters.Add(new AuthorizeFilter(policy));
            })
                .AddFluentValidation(cfg => cfg.RegisterValidatorsFromAssemblyContaining<Create>());
```

Now everything will be protected.

We ahve to give [AllowAnonymous] attribute to  controllers that need access without a token.

## Creating a Register Handler
The Register handler will create the user and will return a token (AKA log the user in)

```C#
using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using Application.Interfaces;
using Domain;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.User
{
  public class Register
  {
    public class Command : IRequest<User>
    {
      public string DisplayName { get; set; }
      public string Username { get; set; }
      public string Email { get; set; }
      public string Password { get; set; }
    }

    public class CommandValidator : AbstractValidator<Command>
    {
      public CommandValidator()
      {
        RuleFor(x => x.DisplayName).NotEmpty();
        RuleFor(x => x.Username).NotEmpty();
        RuleFor(x => x.Email).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
      }
    }

    public class Handler : IRequestHandler<Command, User>
    {
      private readonly DataContext _context;
      private readonly UserManager<AppUser> _userManager;
      private readonly IJwtGenerator _jwtGenerator;
      public Handler(DataContext context, UserManager<AppUser> userManager, IJwtGenerator jwtGenerator)
      {
        _jwtGenerator = jwtGenerator;
        _userManager = userManager;
        _context = context;
      }
      public async Task<User> Handle(Command request, CancellationToken cancellationToken)
      {
        if (await _context.Users.Where(x => x.Email == request.Email).AnyAsync())
            throw new RestException(HttpStatusCode.BadRequest, new { Email = "Email already exists"});

        if (await _context.Users.Where(x => x.UserName == request.Username).AnyAsync())
            throw new RestException(HttpStatusCode.BadRequest, new { Email = "Username already exists"});

        var user = new AppUser
        {
            DisplayName = request.DisplayName,
            Email = request.Email,
            UserName = request.Username
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (result.Succeeded) 
        {
            return new User
            {
                DisplayName = user.DisplayName,
                Token = _jwtGenerator.CreateToken(user),
                Username = user.UserName,
                Image = null
            };
        }

        throw new Exception("Problem creating user");
      }
    }
  }
}
```

## Creating register Controller
```C#
        [HttpPost("register")]
        public async Task<ActionResult<User>> register(Register.Command command)
        {
            return await Mediator.Send(command);
        }
```

## Adding fluent validator Extension for password checking

One way we can do it is adding the Rules in the Command Validator:
```C#
        RuleFor(x => x.Email).NotEmpty();
        RuleFor(x => x.Password).NotEmpty()
            .MinimumLength(6).WithMessage("Password must be at least six characters")
            .Matches("[A-Z]").WithMessage("Password must contain one uppercase letter")
            .Matches("[0-9]").WithMessage("Password must have at lest one digit");
      }
```

But a better way is to create an extension

```C#
using FluentValidation;

namespace Application.Validators
{
    public static class ValidatorExtensions
    {
        public static IRuleBuilder<T, string> Password<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            var options = ruleBuilder
                .NotEmpty()
                .MinimumLength(6).WithMessage("Password must be at least six characters")
                .Matches("[A-Z]").WithMessage("Password must contain one uppercase letter")
                .Matches("[0-9]").WithMessage("Password must have at least one digit")
                .Matches("[a-z]").WithMessage("Password must have at least one lower case character")
                .Matches("[^a-zA-Z0-9]").WithMessage("Password must have at least one alphanumeric character");

            return options;
        }
    }
}
```

Now wwe can use this as a Validator

```C#
      public CommandValidator()
      {
        RuleFor(x => x.DisplayName).NotEmpty();
        RuleFor(x => x.Username).NotEmpty();
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).Password();
      }
```

## Get Currently logged in user
Currently logged in user can be taken from the Claims.



# EF Relationships
## One To One
User -> Address

## One To Many
User -> Many Photos

## Many To Many
User -> Many UserActivites <- Activity 

Here a UserActivites table is used as a join table
A user can have many Acivities
and an Activity can have many users

This cannot be mapped direcly in a relational database, have to set up two two one to many relationships instead.
Instead this UserActivites table will have a compound primary key so no same user can belong to the same activity twice and vice versa.


## Fluent API Many-To-Many
First set up Navigation properties in Models
UserActivity Model
```C#
using System;

namespace Domain
{
    public class UserActivity
    {
        public string AppUserId { get; set; }
        public AppUser AppUser { get; set; }
        public Guid ActivityId { get; set; }
        public Activity Activity { get; set; }
        public DateTime DateJoined { get; set; }
        public bool IsHost { get; set; }
    }
}
```

```C#
  public ICollection<UserActivity> UserActivites { get; set; }
```

Next configure relationships in EF FluentAPI
Fist configure the compount Primary Key - This is so no user with same activity can exist twice.
Set up foreign keys will create a constriant so you cannot add a userActivity if the user and the activity doesn't exist in their respective tables.
```C#
            builder.Entity<UserActivity>(x => x.HasKey(ua => new {ua.AppUserId, ua.ActivityId}));

            builder.Entity<UserActivity>()
                .HasOne(u => u.AppUser)
                .WithMany(a => a.UserActivites)
                .HasForeignKey(u => u.AppUserId);

            builder.Entity<UserActivity>()
                .HasOne(a => a.Activity)
                .WithMany(u => u.UserActivities)
                .HasForeignKey(u => u.ActivityId);
```

## Eager Loading related data

Data can be
Eager Loaded - Data laoded as part of the actual query / using Include in the Query
Explicit Loading - means that the related data is explicitly loaded from the database at a later time. 
Lazy Loading - Lazy loading means that the related data is transparently loaded from the database when the navigation property is accessed.

Eager Loading Data
```C#
        var activities = await _context.Activities
          .Include(x => x.UserActivities)
          .ThenInclude(x => x.AppUser)
          .ToListAsync();
```

## Self Referencing Loop
Core 3.0 user Test.Json and it will throw a self refrencing loop error
`System.Text.Json.JsonException: A possible object cycle was detected which is not supported. This can either be due to a cycle or if the object depth is larger than the maximum allowed depth of 32.`

This error happens becuae if yiou look at the data above
We pull the Activity and Include the UserActivites, UserActivites then includes the AppUser
The AppUser has userActivites navigation which includes the UserActivity which then includes the Activity etc...

This happens becuase EF automaticlly will populate data it has in memory

From https://docs.microsoft.com/en-us/ef/core/querying/related-data#explicit-loading
Entity Framework Core will automatically fix-up navigation properties to any other entities that were previously loaded into the context instance. So even if you don't explicitly include the data for a navigation property, the property may still be populated if some or all of the related entities were previously loaded.

# DTO's
DTO's can be used to shape the data so we don't run into the self referencing loop. We can create Dto's then map our Entities to them in a way so we don't include the reference data the is looping.

However this might get tedious so it's a good idea to user AutoMapper to automatically map these properties.


## Adding Automapper 
`AutoMapper.Extenstions.Microsoft.DependencyInjection`

Add Automapper as service to Startup

```C#
       // Set up Automapper and tell it which Assembly to look for AutoMapper profiles.
            services.AddAutoMapper(typeof(List.Handler));
```

## Adding Mapping Profile

Atomapper will try to map properties by convention but all names must match.

It will not do deep mapping unless specified.
```C#
     CreateMap<Activity, ActivityDto>();
      CreateMap<UserActivity, AttendeeDto>()
          .ForMember(d => d.Username, o => o.MapFrom(s => s.AppUser.UserName))
          .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.AppUser.DisplayName));
```
Here we have to tell Autmapper that when it maps the UserActivity 

## Sending down different proeprty names
In the Activity Dtos we don't want to call UserActivities the same thing

Since we are using System.Text.Json we can use an atrtibute to call the property something else when serializing.

```C#
      [JsonPropertyName("attendees")]
        public ICollection<AttendeeDto> UserActivities { get; set; }
```

## Using LazyLoading
Instead of using Include and ThenInclude we can LazyLoad.
We can then remove Include and when we transperantly load the data.

First install Proxies
`Microsoft.EntityFrameworkCore.Proxies` Needs to be the same version as EFCore version.

Add it to Persistance Project, it's related to EF

```C#
     services.AddDbContext<DataContext>(opt => {
                opt.UseLazyLoadingProxies();
                opt.UseSqlServer(Configuration.GetConnectionString("DefaultConnection"));
            });
```

To use this we have to tell EF which properties are navigation properties
Inside out Doamins we have to add the virtual keyword.
```C#
        public virtual ICollection<UserActivity> UserActivities { get; set; }
```

We can now remove Include().


# Creating a Custom Auth Policy
Since we only want some routes to be aviable to hosts of the activity we can create a custom Auth Policy.

For exmaple, only host of an activity can Delete an activity or Edit an activity.

The logic can be added to the handler to check but its better long term to add a policy.

Infrastructure -> Security
```C# IsHostRequired
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
```

Set up the Policy in Startup
```C#
            services.AddAuthorization(opt => 
            {
                opt.AddPolicy("IsActivityHost", policy => {
                    policy.Requirements.Add(new IsHostRequirement());
                });
            });

            // Transient is only avialbe for the lifetime of the operation, not the whole request
            services.AddTransient<IAuthorizationHandler, IsHostRequirementHandler>();
```

Now in the controller we can add the Policy in the controllers

```C#
  [HttpPut("{id}")]
  [Authorize(Policy = "IsActivityHost")]
```

# Photo Upload

## Options
Database - Not efficient, database is not optimized, dis pace is an issue possibly, authentication is easy.
Filesystem - Good for storing files, disk space is an issue. File permissions are needed for the web service to write to the server.
Cloud - Scalable, potentially faster, secured with API key, could be more expensive price wise.


## Cloudinary Architecture
API Controller => Handeler => Photo Accessor => Cloudinary

## Setting Up Cloudinary in API

### Add secrets 
dotnet user-secrets set "Cloudinary:CloudName" "XXX"
dotnet user-secrets set "Cloudinary:ApiKey" "XXXX"
dotnet user-secrets set "Cloudinary:ApiSecret" "XXXX"

`dotnet user-secrets list`

### Add Settings Class
Infrastructure => Photos => CloudinarySettings.cs

```C#
namespace Infrastructure.Photos
{
    public class CloudinarySettings
    {
        public string CloudName { get; set; }
        public string ApiKey { get; set; }
        public string ApiSecret { get; set; }
    }
}
```

### Add Settings to Services
```C#
            // Strongly type our Cloudinary Settings based on the class. 
            // Settings are saved in user-secrets "Cloudinary" section.
            services.Configure<CloudinarySettings>(Configuration.GetSection("Cloudinary"));
```

### Install Cloudinary .NET in INfrastructure
`CloudinaryDotNet`
Add it to the Infrastructure project, this project will be the one taht will hold the implementation to access the photos using a PhotoAccessor service.
The Application project will have an interface to the PhotoAcessor. 

## Adding Application Logic for PHoto upload

### Interface in Application
```C#
using Application.Photos;
using Microsoft.AspNetCore.Http;

namespace Application.Interfaces
{
    public interface IPhotoAccessor
    {
        PhotoUploadResult AddPhoto(IFormFile file);

        string DeletePhoto(string publicId);
    }
}
```

We get a PhotoUploadResult from the AddPhoto. We're going to make this class, that's becuase the CLoudinary API will return a ImageUploadResult but we don't have access to CloudinaryNet project as it's a dependency in the Infrastructure project.

```C#
namespace Application.Photos
{
  public class PhotoUploadResult
  {
    public string PublicId { get; set; }
    public string Url { get; set; }
  }
}
```

### Implementation in Infrastructure Project To Add Photo
```C#
using Application.Interfaces;
using Application.Photos;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Infrastructure.Photos
{
  public class PhotoAccessor : IPhotoAccessor
  {
    private readonly Cloudinary _cloudinary;

    // Use IOptions to retrieve our configured options of CloudinarySettings
    public PhotoAccessor(IOptions<CloudinarySettings> config)
    {
        var acc = new Account(
            config.Value.CloudName,
            config.Value.ApiKey,
            config.Value.ApiSecret
        );
        
        // Create a new cloudinary instance by passing in account
        _cloudinary = new Cloudinary(acc);
    }

    public PhotoUploadResult AddPhoto(IFormFile file)
    {
        var uploadResult = new ImageUploadResult();

        if (file.Length > 0)
        {
            // Read file into memmory using a readstream
            // Have to use a using statement becuaes readstream is a disposavble.
            using(var stream = file.OpenReadStream())
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream)
                };

                uploadResult = _cloudinary.Upload(uploadParams);
            }
        }

        // Return a Photo Result Object
        return new PhotoUploadResult
        {
            Url = uploadResult.SecureUri.AbsoluteUri,
            PublicId = uploadResult.PublicId
        };
    }

    public string DeletePhoto(string publicId)
    {
      throw new System.NotImplementedException();
    }
  }
}
```

Add to Startup as a service so that it's injectable

```C#
            services.AddScoped<IPhotoAccessor, PhotoAccessor>();
```

## New Photo Entity
We will need a new Entitiy becuase we'll be saving the photo informaiton after uploading to cloudinary into our database.

```C#
namespace Domain
{
    public class Photo
    {
        public string Id { get; set; }
        public string Url { get; set; }
        public bool IsMain { get; set; }
    }
}
```

This will be a one-to-many relationship, one User can have many photos.

```C#
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace Domain
{
    public class AppUser : IdentityUser
    {
        public string DisplayName { get; set; }
        public string Bio { get; set; }
        public virtual ICollection<UserActivity> UserActivites { get; set; }
        public virtual ICollection<Photo> Photos { get; set; }
    }
}
```

!! And of course we have to add the Photos to the DbSet in DBConext

Now that we set up the Entities, Entitiy Framework will implicitely set up a one to many relationshyip in the database of our choice
It will create a Photos table and set up the Id as the PK (Unique Key), it will aslso automatically add a AppUser_Id column to the photos table which will be the foreign key to the AppUsers table. 

## Adding a Handler for Photos
Normally you don't return anythign from a Command, but we will have to return the URL from Cloudinary

```C#
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
  public class Add
  {
    public class Command : IRequest<Photo>
    {
      public IFormFile file { get; set; }
    }

    public class Handler : IRequestHandler<Command, Photo>
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
      public async Task<Photo> Handle(Command request, CancellationToken cancellationToken)
      {
        var photoUploadResult = _photoAccessor.AddPhoto(request.file);

        var user = await _context.Users.SingleOrDefaultAsync(x => x.UserName == _userAccessor.GetCurrentUsername());

        var photo = new Photo
        {
            Url = photoUploadResult.Url,
            Id = photoUploadResult.PublicId
        };

        if (!user.Photos.Any(p => p.IsMain == true))
            photo.IsMain = true;

        user.Photos.Add(photo);

        var success = await _context.SaveChangesAsync() > 0;

        if (success) return photo;

        throw new Exception("Problem saving changes");
      }
    }
  }
}
```

## Adding a Photos Controller
```C#
using System.Threading.Tasks;
using Application.Photos;
using Domain;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class PhotosController : BaseController
    {
        [HttpPost]
        public async Task<ActionResult<Photo>> Add([FromForm] Add.Command command)
        {
            return await Mediator.Send(command);
        }
    }
}
```

## Unsupported Media Type Error
This error is happening becuase the method isn't able to assertain where to get info from.
WE have to tell it to look in the form [FromForm]


## Returning a User Profile


## Deleting a photo

First add the accessor method to Cloudinary in PhotoAccessor.cs
```C#
    public string DeletePhoto(string publicId)
    {
        var deleteParams = new DeletionParams(publicId);

        var result = _cloudinary.Destroy(deleteParams);

        return result.Result == "ok" ? result.Result : null;
    }
```
Add the Handler which will be a command

```C#
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
```

Because of the way we set up our on-to-many in the domain classes by convention if we do a `_context.user.Photos.Remove(photo)` instead of `_context.Photos.Remove(photo)` we will be actaully nulling out the foreign key and not deleting the row in the photos table. The foreign key will be set to nullable.


## Adding Mapping for Images
Currently we're sending back null but now that we have images, we can return the main image for the user with the profile as well as the activity etc...

Send down with user:
```C#
user.Photos.FirstOrDefault(p => p.IsMain)?.Url
```

Update mapping profile to return the main image

```C#
        public MappingProfiles()
        {
            CreateMap<Activity, ActivityDto>();
            CreateMap<UserActivity, AttendeeDto>()
                .ForMember(d => d.Username, o => o.MapFrom(s => s.AppUser.UserName))
                .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.AppUser.DisplayName))
                .ForMember(d => d.Image, o => o.MapFrom(s => s.AppUser.Photos.FirstOrDefault(x => x.IsMain).Url));
        }
    }
```


# Signal R
Allows clients to recieve real time updates.
* Adds real-time web fucntionaly to apps.
* Connected clients recieve constent instantly
* Ideal for:
* * Chat Apps
* * Dashboards
* * Monitoring

Here I'll be using it for chat app.

* Transports
* * WebSockets
* * Server-Sent Events
* * Long Polling

Typically WebSockets are used.


You create a Hub and Clients make connections. Instead of an API endpoint, you create a hub.


Client sends comment up to Hub => Hub sends responses (Dto) down to All clients.

## ASPNET Core SignalR (Server Side)

### Adding Comment Entitiy
We need the comment and they will be a one to many relationship with Acitvities.

```C# Comment.cs
using System;

namespace Domain
{
    public class Comment
    {
        public Guid Id { get; set; }
        public string Body { get; set; }
        public virtual AppUser Author { get; set; }
        public virtual Activity Activity { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
```

And we want to add it as a one to many relationship to Acitvities
```C#
public virtual ICollection<Comment> Comments { get; set; }
```

### Create a CommendDto
WE don't want to send back all the data back, Dto will be the shaped data returned to the client

```C#
using System;

namespace Application.Comments
{
    public class CommentDto
    {
        public Guid Id { get; set; }
        public string Body { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Username { get; set; }
        public string DisplayName { get; set; }
        public string Image { get; set; }
    }
}
```
We'll need to cretae a mapping for the three new properties we're bringing in.
We'll use AutoMapper so we need an AutoMapper Profile

```C#
using System.Linq;
using AutoMapper;
using Domain;

namespace Application.Comments
{
  public class MappingProfile : Profile
  {
    public MappingProfile()
    {
        CreateMap<Comment, CommentDto>()
            .ForMember(d => d.Username, opt => opt.MapFrom(s => s.Author.UserName))
            .ForMember(d => d.DisplayName, opt => opt.MapFrom(s => s.Author.DisplayName))
            .ForMember(d => d.Image, opt => opt.MapFrom(s => s.Author.Photos.FirstOrDefault(x => x.IsMain).Url));
    }
  }
}
```

And we want the comments to be returned with the Acitvity. They are already set up as virtual poperties for EF Model but we have to add it to the AcitivyDto.

```C#
        public ICollection<CommentDto> Comments { get; set; }
```

### Set Up Create Handler to add Comments
The handler will have to return a Comment becuaes it will be sent down to all clients. 
The handler will not be aclled by a Http Request so the User will not be able to be gotten form the Http Context. We'll have to pass it to the handler.

```C#
using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Application.Errors;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Comments
{
  public class Create
  {
    public class Command : IRequest<CommentDto>
    {
      public string Body { get; set; }
      public Guid ActivityId { get; set; }
      public string Username { get; set; }
    }

    public class Handler : IRequestHandler<Command, CommentDto>
    {
      private readonly DataContext _context;
      private readonly IMapper _mapper;
      public Handler(DataContext context, IMapper mapper)
      {
        _mapper = mapper;
        _context = context;
      }
      public async Task<CommentDto> Handle(Command request, CancellationToken cancellationToken)
      {
        // handler logic
        var activity = await _context.Activities.FindAsync(request.ActivityId);

        if (activity == null)
            throw new RestException(HttpStatusCode.NotFound, new { Activity = "Not Found"});

        var user = await _context.Users.SingleOrDefaultAsync(u => u.UserName == request.Username);

        var comment = new Comment {
            Author = user,
            Activity = activity,
            Body = request.Body,
            CreatedAt = DateTime.UtcNow
        };

        activity.Comments.Add(comment);

        var success = await _context.SaveChangesAsync() > 0;

        if (success) return _mapper.Map<CommentDto>(comment);

        throw new Exception("Problem saving changes");
      }
    }
  }
}
```

### Adding A Signal R Hub
* Add Signal R As a Service

```C# Startup
            // We need more then the essential services.
            services.AddSignalR();
```

* Add new endpoint for Singal R
```C# Startup
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                // Every request that goes to /chat will go to the ChatHub.
                endpoints.MapHub<ChatHub>("/chat");
            });
```

ChatHub will be created in the API project because essentailly it is similar to an API controller
```C#
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
        // Use HubContext to get Username, this is derived from Hub.
        var username = Context.User?.Claims?.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;

        command.Username = username;

        // Send the commetn through mediator, mediator will return the comment Dto
        var comment = await _mediator.Send(command);

        // Send comment to all clients
        await Clients.All.SendAsync("RecieveComment", comment);
    }
  }
}
```
### Configuring Auth For SignalR
Above we are using Context to get the UserClaims but right now that doesn't exist in Hub Context, we have to configure it.

Here we need to add a custom Event. Whenever a request is made, instead of looking for the Auth header as it's done by default, we will look to see if the access token is sent in the query. 
```C#
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(opt => 
                {
                    // Tell the API what to validate when we recieve a token.
                    opt.TokenValidationParameters = new TokenValidationParameters
                    {
                        // Validate they key signature.
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = key,
                        // Don't validate the URL for now
                        ValidateAudience = false,
                        ValidateIssuer = false
                    };

                    // Add an Event for when a jwt Toekn is recieved
                    opt.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context => 
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;

                            // Check if we have an access_token query string and the path we are sending to starts with "/chat".
                            if (!string.IsNullOrEmpty(accessToken) && (path.StartsWithSegments("/chat")))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };
                });
```

### CORS for SignalR
SingnalR client sends Credentials in header we need to allow that. This is different from our other HTTP requests.
``` C#
          services.AddCors(opt => 
            {
                opt.AddPolicy("CorsPolicy", policy => 
                {
                    policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:4200").AllowCredentials();
                });
            });
```
## @aspnet/signal4 (Client Side)

### Create a Service that will open connection

This is the comment service, I'll be using this to start a connection to the chat hub and to send up a new comment.

After the connection is started we will listen to the RecieveComment event and add the comment to the activity once it's recieved.

```ts
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { UserService } from './user.service';
import { ActivityService } from './activity.service';
import { IComment } from '../models/comment';
import { HttpClient } from '@angular/common/http';

const apiBase = environment.apiBaseUrl;

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  constructor(private userService: UserService, private activityService: ActivityService, private http: HttpClient) { }

  private hubConnection: HubConnection;

  startConnection() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(apiBase + 'chat', {
        accessTokenFactory: () => this.userService.user.token
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection
      .start()
      .then(() => console.log(this.hubConnection.state))
      .catch(err => console.log('Error while starting connection: ' + err));

    // Has to match the evetn sent by the Hub from ASP.NET
    this.hubConnection.on('RecieveComment', (comment: IComment) => {
      const currentActivity = {...this.activityService.activity};
      currentActivity.comments.push(comment);
      this.activityService.activity = currentActivity;
    });
  }

  stopConnection() {
    this.hubConnection.stop();
  }

  async addComment(values: IComment & { activityId: string }) {
    values.activityId = this.activityService.activity.id;

    try {
      this.hubConnection.invoke('SendComment', values);
    } catch (error) {
      console.log(error);
    }
  }
}

```

## Set up the component
The component will start the connection and t
```ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommentService } from 'src/app/shared/services/comment.service';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-activity-detailed-chat',
  templateUrl: './activity-detailed-chat.component.html',
  styleUrls: ['./activity-detailed-chat.component.scss']
})
export class ActivityDetailedChatComponent implements OnInit, OnDestroy {

  constructor(private commentService: CommentService, public activityService: ActivityService) { }

  commentFormValues = {
    body: ''
  };
  loading = false;

  ngOnInit() {
    this.commentService.startConnection();
  }

  ngOnDestroy() {
    this.commentService.stopConnection();
  }

  async submitComment(form: NgForm) {
    this.loading = true;

    try {
      await this.commentService.addComment(form.value);
      this.loading = false;
      form.reset();
    } catch (error) {
      this.loading = false;
    }
  }
}

```
### SignalR Groups
Right now the comments are pushed to anyone who has a connection.
We'll have to create a group.

### Adding SignalR Gorups to API
Here we'll add a user to a group as soon as he joins, then when sending down a comment we'll onlyu send it to the gorup with that activiyId as the group name.
```C#
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
```

### Client Group Settings for SignalR
We'll have to make the necessary adjustments on the client.


# Follower / Following Feature

## Self Referencing Many-To-Many
The entitiy will be used to both getting followers and followees. AppUser will be able to follow many other AppUsers and be followed by many AppUsers.

```C#
namespace Domain
{
    public class UserFollowing
    {
        public string ObserverId { get; set; }
        public virtual AppUser Observer { get; set; }
        public string TargetId { get; set; }
        public virtual AppUser Target { get; set;}
    }
}
```

We can add these to AppUser as collections so that there is a navigation property

```C#
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace Domain
{
    public class AppUser : IdentityUser
    {
        public string DisplayName { get; set; }
        public string Bio { get; set; }
        public virtual ICollection<UserActivity> UserActivites { get; set; }
        public virtual ICollection<Photo> Photos { get; set; }
        public ICollection<UserFollowing> Followings { get; set; }
        public ICollection<UserFollowing> Followers { get; set; }
    }
}
```
Now that we are specifing the same Collection in the AppUser, we need to configure the relationship in FluentAPI

```C#
builder.Entity<UserFollowing>(builder => 
{
    builder.HasKey(k => new { k.ObserverId, k.TargetId });

    builder.HasOne(o => o.Observer)
        .WithMany(a => a.Followings)
        .HasForeignKey(o => o.ObserverId)
        .OnDelete(DeleteBehavior.Restrict);
    
    builder.HasOne(o => o.Target)
        .WithMany(a => a.Followers)
        .HasForeignKey(o => o.TargetId)
        .OnDelete(DeleteBehavior.Restrict);
});
```

## Add Handers


## Create Controller
```C#
using System.Threading.Tasks;
using Application.Followers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Route("api/profiles")]
    public class FollowersController : BaseController
    {
        [HttpPost("{username}/follow")]
        public async Task<ActionResult<Unit>> Follow(string username)
        {
            return await Mediator.Send(new Add.Command{ Username = username});
        }

        [HttpDelete("{username}/follow")]
        public async Task<ActionResult<Unit>> Unfollow(string username)
        {
            return await Mediator.Send(new Delete.Command{ Username = username});
        }
        
    }
}
```

## Pass following and follower into profile 
We want to return it more than the details method.


New interface and class to go and get the user's profile anywher in our app logic.

In Profiles feature create a new interface.
```C#
using System.Threading.Tasks;

namespace Application.Profiles
{
    public interface IProfileReader
    {
        Task<Profile> ReadProfile(string username);
    }
}
```

We will add a concrete implementation in the same folder

Have to also modify the Domain Entity
We want to return if the user is followed by the current user logged in
As well as the count of follwers and following this profile has.
```C#
using System.Collections.Generic;
using System.Text.Json.Serialization;
using Domain;

namespace Application.Profiles
{
    public class Profile
    {
        public string DisplayName { get; set; }
        public string Username { get; set; }
        public string Image { get; set; }
        public string Bio { get; set; }

        [JsonPropertyName("following")]
        public bool IsFollowed { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
        public ICollection<Photo> Photos { get; set; }
    }
}
```

Now for the concrete implementation of the ReadProfile
```C#
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
```

##  Add profile reader into Startup 
We want this profile reader to be injectable we have to add it to services.

```C#
            services.AddScoped<IProfileReader, ProfileReader>();
```

## Now we can use it inside our Application Handlers
In the Details.cs class we can use our Reader, removing most of the implementation.
```C# Details.cs 
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
```

## Getting a list of Followings for a user
This handler will build up a list of profiles to return with their follower and following counts as well as if this user is currently following them.

```C#
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Profiles;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Followers
{
  public class List
  {
    public class Query : IRequest<List<Profile>>
    {
      public string Username { get; set; }
      public string Predicate { get; set; }
    }

    public class Handler : IRequestHandler<Query, List<Profile>>
    {
      private readonly DataContext _context;
      private readonly IProfileReader _profileReader;
      public Handler(DataContext context, IProfileReader profileReader)
      {
        _profileReader = profileReader;
        _context = context;
      }
      public async Task<List<Profile>> Handle(Query request, CancellationToken cancellationToken)
      {
        var queryable = _context.Followings.AsQueryable();

        var userFollowings = new List<UserFollowing>();

        var profiles = new List<Profile>();

        switch (request.Predicate)
        {
          case "followers":
            {
              userFollowings = await queryable.Where(x => x.Target.UserName == request.Username).ToListAsync();
              foreach (var follower in userFollowings)
              {
                profiles.Add(await _profileReader.ReadProfile(follower.Observer.UserName));
              }
            }
            break;
          case "following":
            {
              userFollowings = await queryable.Where(x => x.Observer.UserName == request.Username).ToListAsync();
              foreach (var follower in userFollowings)
              {
                profiles.Add(await _profileReader.ReadProfile(follower.Target.UserName));
              }
            }
            break;
        }

        return profiles;
      }
    }
  }
}
```

## Controller
Now we can set up the controller to get the profiles:
```C#
  [HttpGet("{username}/follow")]
  public async Task<ActionResult<List<Profile>>> GetFollowings([FromQuery] string predicate, [FromRoute] string username)
  {
      return await Mediator.Send(new List.Query{Predicate = predicate, Username = username});
  }
```

## Adding a Custom Value Resolver
In the Activites, in the attendee information, we want to add if the currently logged in user is follwing this user.

We want to add a IsFollowing propety to the list of Activites.
Since we are usig AutoMapper we'll have to configure it.

Add it to the Dto first:

```C#
namespace Application.Activities
{
    public class AttendeeDto
    {
        public string Username { get; set; }
        public string DisplayName { get; set; }
        public string Image { get; set; }
        public bool IsHost { get; set; }
        // Add this propety below
        public bool Following { get; set; }
    }
}
```
Our Attendee Dto is mapped by AutoMapper so we're going to have to configure it...
But we cannot simply add a profile becuase we have no access to the currently logged in user, nor can we inject it to AutoMapper

What we can do is create a Value Resolver...

```C# FollowingResolver.cs
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
```

Now to use this resolve we can add it to the Mapping Profile:
```C#
          .ForMember(d => d.Following, o => o.MapFrom<FollowingResolver>());
```



# Paging, Sorting and Filtering
IQueryable<T>
  * Creates an expression tree of LINQ queries
  * Can be build up
  * Call is not made until iterated:
  * * foreach loop
  * * ToList(), toArray(), ToDictionary
  * * Singleton query (Count, Average, etc)

IQueryable example:
```C#
var queryable = _context.Activites
  .Where(x => x.Date > = request.startDate)
  .OrderBy(x => x.Date)
  .AsQuerable();

var activites = await queryable
  .Skip(request.Offset ?? 0)
  .Take(request.Limit ?? 3)
  .ToListAsync();
```

## Adding Pagin to API
Only focusing on the Activiy List handler.
We'll create a 

```C#
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
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
      public Query(int? offset, int? limit)
      {
        Offset = offset;
        Limit = limit;

      }
      public int? Offset { get; set; }
      public int? Limit { get; set; }
    }

    public class Handler : IRequestHandler<Query, ActivitiesEnvelope>
    {
      private readonly DataContext _context;
      private readonly IMapper _mapper;
      public Handler(DataContext context, IMapper mapper)
      {
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

        var queryable = _context.Activities.AsQueryable();

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
```

## Filtering in API
We can sent up more parameters and filter our activity list based on different predicates.

```C#
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
```