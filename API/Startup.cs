using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using API.Middleware;
using API.SignalR;
using Application.Activities;
using Application.Interfaces;
using Application.Profiles;
using AutoMapper;
using Domain;
using FluentValidation.AspNetCore;
using Infrastructure.Photos;
using Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Persistence;

namespace API
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers(opt => {
                var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();

                opt.Filters.Add(new AuthorizeFilter(policy));
            })
                .AddFluentValidation(cfg => cfg.RegisterValidatorsFromAssemblyContaining<Create>());
        
            services.AddDbContext<DataContext>(opt => {
                opt.UseLazyLoadingProxies();
                opt.UseSqlServer(Configuration.GetConnectionString("DefaultConnection"));
            });
            services.AddCors(opt => 
            {
                opt.AddPolicy("CorsPolicy", policy => 
                {
                    policy.AllowAnyHeader()
                    .AllowAnyMethod()
                    .WithOrigins("http://localhost:4200")
                    .AllowCredentials()
                    .WithExposedHeaders("WWW-Authenticate");
                });
            });
            
            services.AddMediatR(typeof(List.Handler).Assembly);

            var builder = services.AddIdentityCore<AppUser>();
            var identityBuilder = new IdentityBuilder(builder.UserType, builder.Services);
            identityBuilder.AddEntityFrameworkStores<DataContext>();
            identityBuilder.AddSignInManager<SignInManager<AppUser>>();

            services.AddAuthorization(opt => 
            {
                opt.AddPolicy("IsActivityHost", policy => {
                    policy.Requirements.Add(new IsHostRequirement());
                });
            });

            // Transient is only avialbe for the lifetime of the operation, not the whole request
            services.AddTransient<IAuthorizationHandler, IsHostRequirementHandler>();

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["TokenKey"]));

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
                        ValidateIssuer = false,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero
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

            services.AddScoped<IJwtGenerator, JwtGenerator>();

            services.AddScoped<IUserAccessor, UserAccessor>();

            services.AddScoped<IPhotoAccessor, PhotoAccessor>();

            services.AddScoped<IProfileReader, ProfileReader>();
            
            // Set up Automapper and tell it which Assembly to look for AutoMapper profiles.
            services.AddAutoMapper(typeof(List.Handler));

            // We need more then the essential services.
            services.AddSignalR();

            // Strongly type our Cloudinary Settings based on the class. 
            // Settings are saved in user-secrets "Cloudinary" section.
            services.Configure<CloudinarySettings>(Configuration.GetSection("Cloudinary"));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {

            app.UseMiddleware<ErrorHandlingMiddleware>();

            if (env.IsDevelopment())
            {
                // app.UseDeveloperExceptionPage();
            }

            // app.UseHttpsRedirection();

            // Look in wwwroot folder for default files. (index.html)
            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseRouting();
            app.UseCors("CorsPolicy");

            app.UseAuthentication();
            app.UseAuthorization();


            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                // Every request that goes to /chat will go to the ChatHub.
                endpoints.MapHub<ChatHub>("/chat");
                endpoints.MapFallbackToController("Index", "Fallback");
            });
        }
    }
}
