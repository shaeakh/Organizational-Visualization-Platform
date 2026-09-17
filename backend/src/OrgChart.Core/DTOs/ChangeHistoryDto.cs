using System.Text.Json.Serialization;

namespace OrgChart.Core.DTOs;

public class ChangeHistoryDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("table_name")]
    public string TableName { get; set; } = string.Empty;

    [JsonPropertyName("record_id")]
    public string RecordId { get; set; } = string.Empty;

    [JsonPropertyName("action_type")]
    public string ActionType { get; set; } = string.Empty;

    [JsonPropertyName("changed_by")]
    public string? ChangedBy { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("changed_at")]
    public string ChangedAt { get; set; } = string.Empty;
}
