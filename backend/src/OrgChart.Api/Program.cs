using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using OrgChart.Api.Middleware;
using OrgChart.Core.Interfaces;
using OrgChart.Core.Validators;
using OrgChart.Infrastructure.Data;
using OrgChart.Infrastructure.Repositories;
using OrgChart.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add MVC Controllers & JSON Options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Use DTO JsonPropertyName attributes
    });

builder.Services.AddEndpointsApiExplorer();

// 2. Configure Swagger / OpenAPI
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Organizational Visualization Platform API",
        Version = "v1",
        Description = "Production ASP.NET Core Web API for Org Chart Hierarchy, Personnel Management, SCD Type 2 Timeline History, and Dual Roles (Kenmu)."
    });
});

// 3. Configure DbContext (SQL Server with SQLite fallback for local dev/testing)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost,1433;Database=OrgChartDb;User Id=sa;Password=Your_Strong_Password123!;TrustServerCertificate=True;MultipleActiveResultSets=true;Connect Timeout=30";

var dbProvider = builder.Configuration["DatabaseProvider"] 
    ?? (connectionString.Contains(".db") ? "Sqlite" : "SqlServer");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (dbProvider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
    {
        var sqlitePath = connectionString.Contains(".db") ? connectionString : "Data Source=orgchart.db";
        options.UseSqlite(sqlitePath);
    }
    else
    {
        options.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
        });
    }
});

// 4. Dependency Injection - Repositories & Services
builder.Services.AddScoped<IDepartmentRepository, DepartmentRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IConcurrentDutyRepository, ConcurrentDutyRepository>();
builder.Services.AddScoped<IHistoryRepository, HistoryRepository>();

builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IOrgChartService, OrgChartService>();
builder.Services.AddScoped<IExcelImportService, ExcelImportService>();

// 5. FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<CreateDepartmentRequestValidator>();

// 6. Configure CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ??
    new[] { "http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:80" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 7. Auto-Initialize & Seed Database on Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var importService = services.GetRequiredService<IExcelImportService>();

        logger.LogInformation("Initializing database ({Provider})...", dbProvider);

        // Locate seed files
        var currentDir = AppDomain.CurrentDomain.BaseDirectory;
        var seedDirs = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "seed"),
            Path.Combine(Directory.GetCurrentDirectory(), "../seed"),
            Path.Combine(Directory.GetCurrentDirectory(), "../../seed"),
            Path.Combine(currentDir, "seed"),
            Path.Combine(currentDir, "../../../seed"),
            "/mnt/503ADFEC3ADFCD5A/code/net/Organizational Visualization Platform/seed",
            "/app/seed"
        };

        string seedDeptPath = "";
        string seedUserPath = "";

        foreach (var dir in seedDirs)
        {
            var deptCandidate = Path.Combine(dir, "cmn_department.xlsx");
            var userCandidate = Path.Combine(dir, "sys_user.xlsx");
            if (File.Exists(deptCandidate) && File.Exists(userCandidate))
            {
                seedDeptPath = deptCandidate;
                seedUserPath = userCandidate;
                break;
            }
        }

        await DbInitializer.InitializeAsync(dbContext, importService, seedDeptPath, seedUserPath, logger);
        logger.LogInformation("Database initialized and ready.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred during database initialization/seeding.");
    }
}

// 8. Middleware Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Organizational Visualization Platform API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontend");

app.MapControllers();

app.Run();

public partial class Program { }
