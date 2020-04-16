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


New interface 
