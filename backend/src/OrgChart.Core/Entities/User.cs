using System;

namespace OrgChart.Core.Entities;

public class User
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? DepartmentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? MobilePhone { get; set; }
    public string? BusinessPhone { get; set; }
    public bool Active { get; set; } = true;
    public bool Vip { get; set; } = false;
    public string? Language { get; set; }
    public string? Password { get; set; } = "********";
    public bool LockedOut { get; set; } = false;
    public string? Notification { get; set; } = "Enable";
    public string SysId { get; set; } = string.Empty;

    // Slowly Changing Dimension (SCD Type 2)
    public int Version { get; set; } = 1;
    public DateTime ValidFrom { get; set; } = DateTime.UtcNow;
    public DateTime ValidTo { get; set; } = new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc);
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
