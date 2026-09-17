using System;

namespace OrgChart.Core.Entities;

public class Department
{
    public int Id { get; set; }
    public string DepartmentId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ParentDepartmentId { get; set; }
    public string? DepartmentHead { get; set; }
    public string? PrimaryContact { get; set; }
    public string? Description { get; set; }
    public string? BusinessUnit { get; set; }
    public string? Company { get; set; }
    public string? CostCenter { get; set; }
    public int? HeadCount { get; set; }
    public string SysId { get; set; } = string.Empty;

    // Slowly Changing Dimension (SCD Type 2)
    public int Version { get; set; } = 1;
    public DateTime ValidFrom { get; set; } = DateTime.UtcNow;
    public DateTime ValidTo { get; set; } = new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc);
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
