using System.Globalization;
using OrgChart.Core.DTOs;
using OrgChart.Core.Entities;

namespace OrgChart.Infrastructure.Extensions;

public static class MappingExtensions
{
    public static string FormatDateTime(DateTime dt)
    {
        return dt.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture);
    }

    public static DateTime? ParseDate(string? dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr)) return null;
        if (DateTime.TryParse(dateStr, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var dt))
        {
            return dt;
        }
        return null;
    }

    public static DepartmentDto ToDto(this Department entity)
    {
        return new DepartmentDto
        {
            Id = entity.Id,
            DepartmentId = entity.DepartmentId,
            Name = entity.Name,
            ParentDepartmentId = entity.ParentDepartmentId,
            DepartmentHead = entity.DepartmentHead,
            PrimaryContact = entity.PrimaryContact,
            Description = entity.Description,
            BusinessUnit = entity.BusinessUnit,
            Company = entity.Company,
            CostCenter = entity.CostCenter,
            HeadCount = entity.HeadCount,
            SysId = entity.SysId,
            Version = entity.Version,
            ValidFrom = FormatDateTime(entity.ValidFrom),
            ValidTo = FormatDateTime(entity.ValidTo),
            IsActive = entity.IsActive ? 1 : 0,
            CreatedAt = FormatDateTime(entity.CreatedAt),
            UpdatedAt = FormatDateTime(entity.UpdatedAt)
        };
    }

    public static UserDto ToDto(this User entity)
    {
        return new UserDto
        {
            Id = entity.Id,
            UserId = entity.UserId,
            FirstName = entity.FirstName,
            LastName = entity.LastName,
            DepartmentId = entity.DepartmentId,
            Title = entity.Title,
            Email = entity.Email,
            MobilePhone = entity.MobilePhone,
            BusinessPhone = entity.BusinessPhone,
            Active = entity.Active ? 1 : 0,
            Vip = entity.Vip ? 1 : 0,
            Language = entity.Language,
            Password = entity.Password,
            LockedOut = entity.LockedOut ? 1 : 0,
            Notification = entity.Notification,
            SysId = entity.SysId,
            Version = entity.Version,
            ValidFrom = FormatDateTime(entity.ValidFrom),
            ValidTo = FormatDateTime(entity.ValidTo),
            IsActive = entity.IsActive ? 1 : 0,
            CreatedAt = FormatDateTime(entity.CreatedAt),
            UpdatedAt = FormatDateTime(entity.UpdatedAt)
        };
    }

    public static ConcurrentDutyDto ToDto(this ConcurrentDuty entity)
    {
        return new ConcurrentDutyDto
        {
            Id = entity.Id,
            UserId = entity.UserId,
            DepartmentId = entity.DepartmentId,
            Title = entity.Title,
            IsPrimary = entity.IsPrimary ? 1 : 0,
            StartDate = entity.StartDate,
            EndDate = entity.EndDate
        };
    }

    public static ChangeHistoryDto ToDto(this ChangeHistory entity)
    {
        return new ChangeHistoryDto
        {
            Id = entity.Id,
            TableName = entity.TableName,
            RecordId = entity.RecordId,
            ActionType = entity.ActionType,
            ChangedBy = entity.ChangedBy,
            Description = entity.Description,
            ChangedAt = FormatDateTime(entity.ChangedAt)
        };
    }
}
