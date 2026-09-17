using System.Text.Json.Serialization;

namespace OrgChart.Core.DTOs;

public class DepartmentDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("department_id")]
    public string DepartmentId { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("parent_department_id")]
    public string? ParentDepartmentId { get; set; }

    [JsonPropertyName("department_head")]
    public string? DepartmentHead { get; set; }

    [JsonPropertyName("primary_contact")]
    public string? PrimaryContact { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("business_unit")]
    public string? BusinessUnit { get; set; }

    [JsonPropertyName("company")]
    public string? Company { get; set; }

    [JsonPropertyName("cost_center")]
    public string? CostCenter { get; set; }

    [JsonPropertyName("head_count")]
    public int? HeadCount { get; set; }

    [JsonPropertyName("sys_id")]
    public string SysId { get; set; } = string.Empty;

    [JsonPropertyName("version")]
    public int Version { get; set; }

    [JsonPropertyName("valid_from")]
    public string ValidFrom { get; set; } = string.Empty;

    [JsonPropertyName("valid_to")]
    public string ValidTo { get; set; } = string.Empty;

    [JsonPropertyName("is_active")]
    public int IsActive { get; set; }

    [JsonPropertyName("created_at")]
    public string CreatedAt { get; set; } = string.Empty;

    [JsonPropertyName("updated_at")]
    public string UpdatedAt { get; set; } = string.Empty;
}

public class DepartmentTreeDto : DepartmentDto
{
    [JsonPropertyName("children")]
    public List<DepartmentTreeDto> Children { get; set; } = new();
}

public class CreateDepartmentRequest
{
    [JsonPropertyName("department_id")]
    public string? DepartmentId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("parent_department_id")]
    public string? ParentDepartmentId { get; set; }

    [JsonPropertyName("department_head")]
    public string? DepartmentHead { get; set; }

    [JsonPropertyName("primary_contact")]
    public string? PrimaryContact { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("business_unit")]
    public string? BusinessUnit { get; set; }

    [JsonPropertyName("company")]
    public string? Company { get; set; }

    [JsonPropertyName("cost_center")]
    public string? CostCenter { get; set; }

    [JsonPropertyName("head_count")]
    public int? HeadCount { get; set; }

    [JsonPropertyName("sys_id")]
    public string? SysId { get; set; }
}

public class UpdateDepartmentRequest
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("parent_department_id")]
    public string? ParentDepartmentId { get; set; }

    [JsonPropertyName("department_head")]
    public string? DepartmentHead { get; set; }

    [JsonPropertyName("primary_contact")]
    public string? PrimaryContact { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("business_unit")]
    public string? BusinessUnit { get; set; }

    [JsonPropertyName("company")]
    public string? Company { get; set; }

    [JsonPropertyName("cost_center")]
    public string? CostCenter { get; set; }

    [JsonPropertyName("head_count")]
    public int? HeadCount { get; set; }
}
