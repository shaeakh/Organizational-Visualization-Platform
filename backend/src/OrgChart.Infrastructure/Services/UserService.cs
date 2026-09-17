using System.Text.Json;
using OrgChart.Core.DTOs;
using OrgChart.Core.Entities;
using OrgChart.Core.Exceptions;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Extensions;

namespace OrgChart.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepo;
    private readonly IDepartmentRepository _deptRepo;
    private readonly IConcurrentDutyRepository _dutyRepo;
    private readonly IHistoryRepository _historyRepo;

    public UserService(
        IUserRepository userRepo,
        IDepartmentRepository deptRepo,
        IConcurrentDutyRepository dutyRepo,
        IHistoryRepository historyRepo)
    {
        _userRepo = userRepo;
        _deptRepo = deptRepo;
        _dutyRepo = dutyRepo;
        _historyRepo = historyRepo;
    }

    private static bool ParseBoolProperty(object? val, bool defaultValue = false)
    {
        if (val == null) return defaultValue;
        if (val is bool b) return b;
        if (val is JsonElement je)
        {
            if (je.ValueKind == JsonValueKind.True) return true;
            if (je.ValueKind == JsonValueKind.False) return false;
            if (je.ValueKind == JsonValueKind.Number) return je.GetInt32() == 1;
            if (je.ValueKind == JsonValueKind.String)
            {
                var s = je.GetString();
                return string.Equals(s, "true", StringComparison.OrdinalIgnoreCase) || s == "1";
            }
        }
        var str = val.ToString();
        if (int.TryParse(str, out var num)) return num == 1;
        if (bool.TryParse(str, out var parsedBool)) return parsedBool;
        return defaultValue;
    }

    public async Task<List<UserDto>> GetUsersAsync(string? date = null, string? departmentId = null, string? title = null, string? active = null, CancellationToken cancellationToken = default)
    {
        var targetDate = MappingExtensions.ParseDate(date);
        bool? activeFilter = null;
        if (!string.IsNullOrWhiteSpace(active))
        {
            activeFilter = active == "1" || string.Equals(active, "true", StringComparison.OrdinalIgnoreCase);
        }

        var users = await _userRepo.GetAllAsync(targetDate, departmentId, title, activeFilter, cancellationToken);
        return users.Select(u => u.ToDto()).ToList();
    }

    public async Task<UserDto?> GetUserByIdAsync(string id, string? date = null, CancellationToken cancellationToken = default)
    {
        var targetDate = MappingExtensions.ParseDate(date);
        var user = await _userRepo.GetByIdAsync(id, targetDate, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("User not found for the specified date/version");
        }
        return user.ToDto();
    }

    public async Task<string> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
        {
            throw new BadRequestException("first_name and last_name are required fields.");
        }

        var finalUserId = request.UserId?.Trim();
        if (string.IsNullOrEmpty(finalUserId))
        {
            var allIds = await _userRepo.GetAllUserIdsAsync(cancellationToken);
            int maxId = 0;
            foreach (var id in allIds)
            {
                if (int.TryParse(id, out var num) && num > maxId)
                {
                    maxId = num;
                }
            }
            var nextId = maxId + 1;
            finalUserId = nextId.ToString("D4");
        }
        else
        {
            if (await _userRepo.ExistsActiveAsync(finalUserId, cancellationToken))
            {
                throw new BadRequestException($"User with ID {finalUserId} already exists and is active.");
            }
        }

        var now = DateTime.UtcNow;
        var sysId = !string.IsNullOrWhiteSpace(request.SysId)
            ? request.SysId
            : Guid.NewGuid().ToString("N");

        var user = new User
        {
            UserId = finalUserId,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            DepartmentId = string.IsNullOrWhiteSpace(request.DepartmentId) ? null : request.DepartmentId.Trim(),
            Title = request.Title?.Trim() ?? string.Empty,
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
            MobilePhone = string.IsNullOrWhiteSpace(request.MobilePhone) ? null : request.MobilePhone.Trim(),
            BusinessPhone = string.IsNullOrWhiteSpace(request.BusinessPhone) ? null : request.BusinessPhone.Trim(),
            Active = request.Active != null ? ParseBoolProperty(request.Active, true) : true,
            Vip = ParseBoolProperty(request.Vip, false),
            Language = string.IsNullOrWhiteSpace(request.Language) ? null : request.Language.Trim(),
            Password = string.IsNullOrWhiteSpace(request.Password) ? "********" : request.Password.Trim(),
            LockedOut = ParseBoolProperty(request.LockedOut, false),
            Notification = string.IsNullOrWhiteSpace(request.Notification) ? "Enable" : request.Notification.Trim(),
            SysId = sysId,
            Version = 1,
            ValidFrom = now,
            ValidTo = new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _userRepo.AddAsync(user, cancellationToken);

        await _historyRepo.AddAsync(new ChangeHistory
        {
            TableName = "users",
            RecordId = finalUserId,
            ActionType = "CREATE",
            ChangedBy = "user",
            Description = $"Created user: {user.LastName} {user.FirstName} (ID: {finalUserId})",
            ChangedAt = now
        }, cancellationToken);

        return finalUserId;
    }

    public async Task UpdateUserAsync(string id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var current = await _userRepo.GetCurrentActiveAsync(id, cancellationToken);
        if (current == null)
        {
            throw new NotFoundException("Active user record not found.");
        }

        var now = DateTime.UtcNow;

        // 1. Deactivate old version row
        current.IsActive = false;
        current.ValidTo = now;
        current.UpdatedAt = now;
        await _userRepo.UpdateAsync(current, cancellationToken);

        // 2. Prepare merged properties for new version
        var firstName = request.FirstName != null ? request.FirstName.Trim() : current.FirstName;
        var lastName = request.LastName != null ? request.LastName.Trim() : current.LastName;
        var departmentId = request.DepartmentId != null ? (string.IsNullOrWhiteSpace(request.DepartmentId) ? null : request.DepartmentId.Trim()) : current.DepartmentId;
        var title = request.Title != null ? request.Title.Trim() : current.Title;
        var email = request.Email != null ? (string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim()) : current.Email;
        var mobilePhone = request.MobilePhone != null ? (string.IsNullOrWhiteSpace(request.MobilePhone) ? null : request.MobilePhone.Trim()) : current.MobilePhone;
        var businessPhone = request.BusinessPhone != null ? (string.IsNullOrWhiteSpace(request.BusinessPhone) ? null : request.BusinessPhone.Trim()) : current.BusinessPhone;
        var active = request.Active != null ? ParseBoolProperty(request.Active, current.Active) : current.Active;
        var vip = request.Vip != null ? ParseBoolProperty(request.Vip, current.Vip) : current.Vip;
        var language = request.Language != null ? (string.IsNullOrWhiteSpace(request.Language) ? null : request.Language.Trim()) : current.Language;
        var password = request.Password != null ? request.Password.Trim() : current.Password;
        var lockedOut = request.LockedOut != null ? ParseBoolProperty(request.LockedOut, current.LockedOut) : current.LockedOut;
        var notification = request.Notification != null ? (string.IsNullOrWhiteSpace(request.Notification) ? "Enable" : request.Notification.Trim()) : current.Notification;

        var newUser = new User
        {
            UserId = current.UserId,
            FirstName = firstName,
            LastName = lastName,
            DepartmentId = departmentId,
            Title = title,
            Email = email,
            MobilePhone = mobilePhone,
            BusinessPhone = businessPhone,
            Active = active,
            Vip = vip,
            Language = language,
            Password = password,
            LockedOut = lockedOut,
            Notification = notification,
            SysId = current.SysId,
            Version = current.Version + 1,
            ValidFrom = now,
            ValidTo = new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc),
            IsActive = true,
            CreatedAt = current.CreatedAt,
            UpdatedAt = now
        };

        await _userRepo.AddAsync(newUser, cancellationToken);

        // 3. Log change in history
        var descParts = new List<string>();
        if (departmentId != current.DepartmentId) descParts.Add($"Department: {current.DepartmentId ?? "None"} -> {departmentId ?? "None"}");
        if (title != current.Title) descParts.Add($"Title: {current.Title ?? "None"} -> {title ?? "None"}");
        if (active != current.Active) descParts.Add($"Status: {(current.Active ? "Active" : "Inactive")} -> {(active ? "Active" : "Inactive")}");
        var changeDesc = descParts.Count > 0 ? $"Updated: {string.Join(", ", descParts)}" : "Updated profile metadata";

        await _historyRepo.AddAsync(new ChangeHistory
        {
            TableName = "users",
            RecordId = id,
            ActionType = "UPDATE",
            ChangedBy = "user",
            Description = changeDesc,
            ChangedAt = now
        }, cancellationToken);
    }

    public async Task DeleteUserAsync(string id, CancellationToken cancellationToken = default)
    {
        var current = await _userRepo.GetCurrentActiveAsync(id, cancellationToken);
        if (current == null)
        {
            throw new NotFoundException("Active user record not found.");
        }

        if (!current.Active)
        {
            return;
        }

        var now = DateTime.UtcNow;

        // 1. Deactivate old version row
        current.IsActive = false;
        current.ValidTo = now;
        current.UpdatedAt = now;
        await _userRepo.UpdateAsync(current, cancellationToken);

        // 2. Insert new version row with active = 0 (terminated)
        var newUser = new User
        {
            UserId = current.UserId,
            FirstName = current.FirstName,
            LastName = current.LastName,
            DepartmentId = current.DepartmentId,
            Title = current.Title,
            Email = current.Email,
            MobilePhone = current.MobilePhone,
            BusinessPhone = current.BusinessPhone,
            Active = false,
            Vip = current.Vip,
            Language = current.Language,
            Password = current.Password,
            LockedOut = current.LockedOut,
            Notification = current.Notification,
            SysId = current.SysId,
            Version = current.Version + 1,
            ValidFrom = now,
            ValidTo = new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc),
            IsActive = true,
            CreatedAt = current.CreatedAt,
            UpdatedAt = now
        };

        await _userRepo.AddAsync(newUser, cancellationToken);

        // 3. Log history
        await _historyRepo.AddAsync(new ChangeHistory
        {
            TableName = "users",
            RecordId = id,
            ActionType = "DELETE",
            ChangedBy = "user",
            Description = "Terminated user/marked inactive",
            ChangedAt = now
        }, cancellationToken);
    }

    public async Task<(List<string> Deactivated, List<string> Skipped)> BulkDeleteUsersAsync(List<string> userIds, CancellationToken cancellationToken = default)
    {
        if (userIds == null || userIds.Count == 0)
        {
            throw new BadRequestException("user_ids must be a non-empty array.");
        }

        var deactivated = new List<string>();
        var skipped = new List<string>();
        var now = DateTime.UtcNow;

        foreach (var userId in userIds)
        {
            var current = await _userRepo.GetCurrentActiveAsync(userId, cancellationToken);
            if (current == null || !current.Active)
            {
                skipped.Add(userId);
                continue;
            }

            // 1. Deactivate old row
            current.IsActive = false;
            current.ValidTo = now;
            current.UpdatedAt = now;
            await _userRepo.UpdateAsync(current, cancellationToken);

            // 2. Insert new terminated row
            var newUser = new User
            {
                UserId = current.UserId,
                FirstName = current.FirstName,
                LastName = current.LastName,
                DepartmentId = current.DepartmentId,
                Title = current.Title,
                Email = current.Email,
                MobilePhone = current.MobilePhone,
                BusinessPhone = current.BusinessPhone,
                Active = false,
                Vip = current.Vip,
                Language = current.Language,
                Password = current.Password,
                LockedOut = current.LockedOut,
                Notification = current.Notification,
                SysId = current.SysId,
                Version = current.Version + 1,
                ValidFrom = now,
                ValidTo = new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc),
                IsActive = true,
                CreatedAt = current.CreatedAt,
                UpdatedAt = now
            };

            await _userRepo.AddAsync(newUser, cancellationToken);

            // 3. Log history
            await _historyRepo.AddAsync(new ChangeHistory
            {
                TableName = "users",
                RecordId = userId,
                ActionType = "DELETE",
                ChangedBy = "user",
                Description = "Bulk terminated: marked inactive",
                ChangedAt = now
            }, cancellationToken);

            deactivated.Add(userId);
        }

        return (deactivated, skipped);
    }

    public async Task<List<ConcurrentDutyDto>> GetConcurrentDutiesAsync(string userId, CancellationToken cancellationToken = default)
    {
        var exists = await _userRepo.ExistsActiveAsync(userId, cancellationToken);
        if (!exists)
        {
            throw new NotFoundException("User not found.");
        }

        var duties = await _dutyRepo.GetByUserIdAsync(userId, cancellationToken);
        return duties.Select(d => d.ToDto()).ToList();
    }

    public async Task AddConcurrentDutyAsync(string userId, CreateConcurrentDutyRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.DepartmentId))
        {
            throw new BadRequestException("department_id is required.");
        }

        var user = await _userRepo.GetCurrentActiveAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("Active user not found.");
        }

        var dept = await _deptRepo.GetCurrentActiveAsync(request.DepartmentId.Trim(), cancellationToken);
        if (dept == null)
        {
            throw new NotFoundException("Active department not found.");
        }

        if (await _dutyRepo.ExistsAsync(userId, request.DepartmentId.Trim(), cancellationToken))
        {
            throw new BadRequestException("This concurrent duty already exists for the user.");
        }

        var startDate = !string.IsNullOrWhiteSpace(request.StartDate)
            ? request.StartDate.Trim()
            : DateTime.UtcNow.ToString("yyyy-MM-dd");

        var duty = new ConcurrentDuty
        {
            UserId = userId,
            DepartmentId = request.DepartmentId.Trim(),
            Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim(),
            IsPrimary = false,
            StartDate = startDate,
            CreatedAt = DateTime.UtcNow
        };

        await _dutyRepo.AddAsync(duty, cancellationToken);

        await _historyRepo.AddAsync(new ChangeHistory
        {
            TableName = "users",
            RecordId = userId,
            ActionType = "UPDATE",
            ChangedBy = "user",
            Description = $"Added concurrent duty in {dept.Name} as {duty.Title ?? "No Title"}",
            ChangedAt = DateTime.UtcNow
        }, cancellationToken);
    }

    public async Task RemoveConcurrentDutyAsync(string userId, int dutyId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepo.GetCurrentActiveAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException("Active user not found.");
        }

        var duty = await _dutyRepo.GetByIdAsync(dutyId, userId, cancellationToken);
        if (duty == null)
        {
            throw new NotFoundException("Concurrent duty not found for this user.");
        }

        var dept = await _deptRepo.GetByIdAsync(duty.DepartmentId, null, cancellationToken);
        var deptName = dept?.Name ?? duty.DepartmentId;

        await _dutyRepo.DeleteAsync(duty, cancellationToken);

        await _historyRepo.AddAsync(new ChangeHistory
        {
            TableName = "users",
            RecordId = userId,
            ActionType = "UPDATE",
            ChangedBy = "user",
            Description = $"Removed concurrent duty in {deptName}",
            ChangedAt = DateTime.UtcNow
        }, cancellationToken);
    }
}
