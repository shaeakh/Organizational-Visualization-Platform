using System;

namespace OrgChart.Core.Entities;

public class ConcurrentDuty
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string DepartmentId { get; set; } = string.Empty;
    public string? Title { get; set; }
    public bool IsPrimary { get; set; } = false;
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
