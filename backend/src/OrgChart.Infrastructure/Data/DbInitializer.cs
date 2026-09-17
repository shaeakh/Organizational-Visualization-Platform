using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OrgChart.Core.Interfaces;

namespace OrgChart.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(
        ApplicationDbContext context,
        IExcelImportService importService,
        string seedDeptPath,
        string seedUserPath,
        ILogger logger)
    {
        try
        {
            if (context.Database.IsSqlServer())
            {
                logger.LogInformation("Applying migrations to SQL Server database...");
                await context.Database.EnsureCreatedAsync();
            }
            else
            {
                logger.LogInformation("Ensuring SQLite database is created...");
                await context.Database.EnsureCreatedAsync();
            }

            await importService.ImportSeedDataIfEmptyAsync(seedDeptPath, seedUserPath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while initializing database and seeding data.");
            throw;
        }
    }
}
