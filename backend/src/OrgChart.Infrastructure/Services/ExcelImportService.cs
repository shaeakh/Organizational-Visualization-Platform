using System.Data;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OrgChart.Core.DTOs;
using OrgChart.Core.Entities;
using OrgChart.Core.Exceptions;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Data;

namespace OrgChart.Infrastructure.Services;

public class ExcelImportService : IExcelImportService
{
    private readonly ApplicationDbContext _context;
    private readonly IDepartmentRepository _deptRepo;
    private readonly IUserRepository _userRepo;
    private readonly ILogger<ExcelImportService> _logger;

    private static readonly string[] RequiredUserHeaders = new[]
    {
        "User ID", "First name", "Last name", "Department", "Title",
        "Email", "Mobile phone", "Business phone", "Active", "VIP",
        "Language", "Password", "Locked out", "Notification", "Sys ID"
    };

    private static readonly string[] RequiredDeptHeaders = new[]
    {
        "ID", "Name", "Parent", "Department head", "Primary contact",
        "Description", "Business unit", "Company", "Cost center", "Head count", "Sys ID"
    };

    public ExcelImportService(
        ApplicationDbContext context,
        IDepartmentRepository deptRepo,
        IUserRepository userRepo,
        ILogger<ExcelImportService> logger)
    {
        _context = context;
        _deptRepo = deptRepo;
        _userRepo = userRepo;
        _logger = logger;
    }

    public async Task<UploadStatusResponse> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var userCount = await _userRepo.GetCountAsync(cancellationToken);
        var deptCount = await _deptRepo.GetCountAsync(cancellationToken);

        return new UploadStatusResponse
        {
            Users = userCount,
            Departments = deptCount,
            DataSource = "database"
        };
    }

    private static (bool Valid, List<string> Missing, List<string> Extra) ValidateHeaders(List<string> actualHeaders, string[] requiredHeaders)
    {
        var actualTrimmed = actualHeaders.Select(h => h.Trim()).Where(h => !string.IsNullOrEmpty(h)).ToList();
        var actualSet = new HashSet<string>(actualTrimmed, StringComparer.OrdinalIgnoreCase);
        var requiredSet = new HashSet<string>(requiredHeaders, StringComparer.OrdinalIgnoreCase);

        var missing = requiredHeaders.Where(req => !actualSet.Contains(req)).ToList();
        var extra = actualTrimmed.Where(act => !requiredSet.Contains(act)).ToList();

        return (missing.Count == 0, missing, extra);
    }

    private static List<Dictionary<string, string>> ReadSheetRows(Stream stream, string[] requiredHeaders, out (bool Valid, List<string> Missing, List<string> Extra) validation)
    {
        using var workbook = new XLWorkbook(stream);
        var worksheet = workbook.Worksheets.FirstOrDefault();
        if (worksheet == null)
        {
            validation = (false, requiredHeaders.ToList(), new List<string>());
            return new List<Dictionary<string, string>>();
        }

        var headerRow = worksheet.Row(1);
        var lastCellCol = headerRow.LastCellUsed()?.Address.ColumnNumber ?? 0;
        var headers = new List<string>();
        for (int col = 1; col <= lastCellCol; col++)
        {
            headers.Add(headerRow.Cell(col).GetString().Trim());
        }

        validation = ValidateHeaders(headers, requiredHeaders);

        var rows = new List<Dictionary<string, string>>();
        var lastRowNumber = worksheet.LastRowUsed()?.RowNumber() ?? 1;

        for (int rowNum = 2; rowNum <= lastRowNumber; rowNum++)
        {
            var row = worksheet.Row(rowNum);
            if (row.IsEmpty()) continue;

            var rowDict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (int col = 1; col <= headers.Count; col++)
            {
                var header = headers[col - 1];
                if (string.IsNullOrEmpty(header)) continue;
                var cell = row.Cell(col);
                rowDict[header] = cell.GetString().Trim();
            }
            rows.Add(rowDict);
        }

        return rows;
    }

    public async Task<UploadResponse> ImportDataAsync(Stream usersStream, Stream deptsStream, string source = "bulk-upload", CancellationToken cancellationToken = default)
    {
        var deptRows = ReadSheetRows(deptsStream, RequiredDeptHeaders, out var deptsValidation);
        var userRows = ReadSheetRows(usersStream, RequiredUserHeaders, out var usersValidation);

        if (!deptsValidation.Valid || !usersValidation.Valid)
        {
            var details = new Dictionary<string, object>();
            if (!usersValidation.Valid)
            {
                details["users"] = new { missing = usersValidation.Missing, extra = usersValidation.Extra };
            }
            if (!deptsValidation.Valid)
            {
                details["departments"] = new { missing = deptsValidation.Missing, extra = deptsValidation.Extra };
            }

            throw new BadRequestException("Column structure mismatch. Please check your files.", details);
        }

        var counts = await ExecuteImportAsync(deptRows, userRows, source, cancellationToken);

        return new UploadResponse
        {
            Success = true,
            Message = "Data imported successfully",
            Counts = new UploadResponseCounts
            {
                Users = counts.Users,
                Departments = counts.Departments
            }
        };
    }

    public async Task<(int Users, int Departments)> ExecuteImportAsync(
        List<Dictionary<string, string>> deptRows,
        List<Dictionary<string, string>> userRows,
        string source,
        CancellationToken cancellationToken = default)
    {
        var baselineDate = source == "excel-import"
            ? new DateTime(2024, 4, 1, 0, 0, 0, DateTimeKind.Utc)
            : DateTime.UtcNow;

        var validTo = new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc);

        // Clear existing data
        _context.ChangeHistories.RemoveRange(_context.ChangeHistories);
        _context.ConcurrentDuties.RemoveRange(_context.ConcurrentDuties);
        _context.Users.RemoveRange(_context.Users);
        _context.Departments.RemoveRange(_context.Departments);
        await _context.SaveChangesAsync(cancellationToken);

        // 1. Insert Departments
        var deptList = new List<Department>();
        var deptNameToIdMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in deptRows)
        {
            row.TryGetValue("ID", out var deptId);
            row.TryGetValue("Name", out var name);
            row.TryGetValue("Parent", out var parent);
            row.TryGetValue("Department head", out var head);
            row.TryGetValue("Primary contact", out var contact);
            row.TryGetValue("Description", out var desc);
            row.TryGetValue("Business unit", out var bu);
            row.TryGetValue("Company", out var company);
            row.TryGetValue("Cost center", out var costCenter);
            row.TryGetValue("Head count", out var headCountStr);
            row.TryGetValue("Sys ID", out var sysId);

            if (string.IsNullOrWhiteSpace(deptId) || string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            int? headCount = null;
            if (int.TryParse(headCountStr, out var parsedHc)) headCount = parsedHc;

            var dept = new Department
            {
                DepartmentId = deptId.Trim(),
                Name = name.Trim(),
                ParentDepartmentId = string.IsNullOrWhiteSpace(parent) ? null : parent.Trim(),
                DepartmentHead = string.IsNullOrWhiteSpace(head) ? null : head.Trim(),
                PrimaryContact = string.IsNullOrWhiteSpace(contact) ? null : contact.Trim(),
                Description = string.IsNullOrWhiteSpace(desc) ? null : desc.Trim(),
                BusinessUnit = string.IsNullOrWhiteSpace(bu) ? null : bu.Trim(),
                Company = string.IsNullOrWhiteSpace(company) ? null : company.Trim(),
                CostCenter = string.IsNullOrWhiteSpace(costCenter) ? null : costCenter.Trim(),
                HeadCount = headCount,
                SysId = string.IsNullOrWhiteSpace(sysId) ? Guid.NewGuid().ToString("N") : sysId.Trim(),
                Version = 1,
                ValidFrom = baselineDate,
                ValidTo = validTo,
                IsActive = true,
                CreatedAt = baselineDate,
                UpdatedAt = baselineDate
            };

            deptList.Add(dept);
            deptNameToIdMap[dept.Name] = dept.DepartmentId;
        }

        await _context.Departments.AddRangeAsync(deptList, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 2. Insert Users
        var userList = new List<User>();

        foreach (var row in userRows)
        {
            row.TryGetValue("User ID", out var userId);
            row.TryGetValue("First name", out var firstName);
            row.TryGetValue("Last name", out var lastName);
            row.TryGetValue("Department", out var deptName);
            row.TryGetValue("Title", out var title);
            row.TryGetValue("Email", out var email);
            row.TryGetValue("Mobile phone", out var mobilePhone);
            row.TryGetValue("Business phone", out var businessPhone);
            row.TryGetValue("Active", out var activeStr);
            row.TryGetValue("VIP", out var vipStr);
            row.TryGetValue("Language", out var language);
            row.TryGetValue("Password", out var password);
            row.TryGetValue("Locked out", out var lockedOutStr);
            row.TryGetValue("Notification", out var notification);
            row.TryGetValue("Sys ID", out var sysId);

            if (string.IsNullOrWhiteSpace(userId))
            {
                continue;
            }

            string? deptId = null;
            if (!string.IsNullOrWhiteSpace(deptName) && deptNameToIdMap.TryGetValue(deptName.Trim(), out var mappedId))
            {
                deptId = mappedId;
            }

            bool active = string.Equals(activeStr, "true", StringComparison.OrdinalIgnoreCase) || activeStr == "1" || string.IsNullOrWhiteSpace(activeStr);
            bool vip = string.Equals(vipStr, "true", StringComparison.OrdinalIgnoreCase) || vipStr == "1";
            bool lockedOut = string.Equals(lockedOutStr, "true", StringComparison.OrdinalIgnoreCase) || lockedOutStr == "1";

            var user = new User
            {
                UserId = userId.Trim(),
                FirstName = firstName?.Trim() ?? string.Empty,
                LastName = lastName?.Trim() ?? string.Empty,
                DepartmentId = deptId,
                Title = title?.Trim() ?? string.Empty,
                Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim(),
                MobilePhone = string.IsNullOrWhiteSpace(mobilePhone) ? null : mobilePhone.Trim(),
                BusinessPhone = string.IsNullOrWhiteSpace(businessPhone) ? null : businessPhone.Trim(),
                Active = active,
                Vip = vip,
                Language = string.IsNullOrWhiteSpace(language) ? null : language.Trim(),
                Password = string.IsNullOrWhiteSpace(password) ? "********" : password.Trim(),
                LockedOut = lockedOut,
                Notification = string.IsNullOrWhiteSpace(notification) ? "Enable" : notification.Trim(),
                SysId = string.IsNullOrWhiteSpace(sysId) ? Guid.NewGuid().ToString("N") : sysId.Trim(),
                Version = 1,
                ValidFrom = baselineDate,
                ValidTo = validTo,
                IsActive = true,
                CreatedAt = baselineDate,
                UpdatedAt = baselineDate
            };

            userList.Add(user);
        }

        await _context.Users.AddRangeAsync(userList, cancellationToken);

        // 3. Log change history
        var deptDesc = source == "bulk-upload" ? "Bulk import from uploaded files" : "Initial seed import from cmn_department.xlsx";
        var userDesc = source == "bulk-upload" ? "Bulk import from uploaded files" : "Initial seed import from sys_user.xlsx";

        var histories = new List<ChangeHistory>
        {
            new() { TableName = "departments", RecordId = "system", ActionType = "CREATE", ChangedBy = "system", Description = deptDesc, ChangedAt = baselineDate },
            new() { TableName = "users", RecordId = "system", ActionType = "CREATE", ChangedBy = "system", Description = userDesc, ChangedAt = baselineDate }
        };

        await _context.ChangeHistories.AddRangeAsync(histories, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Imported {DeptCount} departments and {UserCount} users from source: {Source}", deptList.Count, userList.Count, source);

        return (userList.Count, deptList.Count);
    }

    public async Task ImportSeedDataIfEmptyAsync(string seedDeptPath, string seedUserPath, CancellationToken cancellationToken = default)
    {
        var count = await _deptRepo.GetCountAsync(cancellationToken);
        if (count > 0)
        {
            _logger.LogInformation("Database already contains {Count} departments. Skipping seed import.", count);
            return;
        }

        if (!File.Exists(seedDeptPath) || !File.Exists(seedUserPath))
        {
            _logger.LogWarning("Seed Excel files not found at: '{DeptPath}' or '{UserPath}'. Skipping initial seed.", seedDeptPath, seedUserPath);
            return;
        }

        _logger.LogInformation("Database is empty. Importing seed data from '{DeptPath}' and '{UserPath}'...", seedDeptPath, seedUserPath);

        using var deptStream = File.OpenRead(seedDeptPath);
        using var userStream = File.OpenRead(seedUserPath);

        var deptRows = ReadSheetRows(deptStream, RequiredDeptHeaders, out var deptsValidation);
        var userRows = ReadSheetRows(userStream, RequiredUserHeaders, out var usersValidation);

        if (!deptsValidation.Valid || !usersValidation.Valid)
        {
            _logger.LogError("Seed files column validation failed.");
            return;
        }

        await ExecuteImportAsync(deptRows, userRows, "excel-import", cancellationToken);
        _logger.LogInformation("Database seeded successfully.");
    }
}
