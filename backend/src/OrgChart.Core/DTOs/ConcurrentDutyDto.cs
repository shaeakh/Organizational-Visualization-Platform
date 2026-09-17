using System.Text.Json.Serialization;

namespace OrgChart.Core.DTOs;

public class ConcurrentDutyDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("user_id")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("department_id")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("is_primary")]
    public int IsPrimary { get; set; }

    [JsonPropertyName("start_date")]
    public string? StartDate { get; set; }

    [JsonPropertyName("end_date")]
    public string? EndDate { get; set; }
}

public class CreateConcurrentDutyRequest
{
    [JsonPropertyName("department_id")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("start_date")]
    public string? StartDate { get; set; }
}
