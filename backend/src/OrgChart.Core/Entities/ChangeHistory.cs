using System;

namespace OrgChart.Core.Entities;

public class ChangeHistory
{
    public int Id { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string RecordId { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty; // CREATE, UPDATE, DELETE
    public string? ChangedBy { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
