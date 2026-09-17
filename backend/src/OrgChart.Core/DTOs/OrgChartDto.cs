using System.Text.Json.Serialization;

namespace OrgChart.Core.DTOs;

public class OrgChartMemberDto : UserDto
{
    [JsonPropertyName("is_concurrent")]
    public bool IsConcurrent { get; set; }
}

public class OrgChartNodeDto
{
    [JsonPropertyName("department")]
    public DepartmentDto Department { get; set; } = new();

    [JsonPropertyName("members")]
    public List<OrgChartMemberDto> Members { get; set; } = new();

    [JsonPropertyName("children")]
    public List<OrgChartNodeDto> Children { get; set; } = new();
}
