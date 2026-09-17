using System.Text.Json.Serialization;

namespace OrgChart.Core.DTOs;

public class UserDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("user_id")]
    public string UserId { get; set; } = string.Empty;

    [JsonPropertyName("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("last_name")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("department_id")]
    public string? DepartmentId { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("mobile_phone")]
    public string? MobilePhone { get; set; }

    [JsonPropertyName("business_phone")]
    public string? BusinessPhone { get; set; }

    [JsonPropertyName("active")]
    public int Active { get; set; }

    [JsonPropertyName("vip")]
    public int Vip { get; set; }

    [JsonPropertyName("language")]
    public string? Language { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }

    [JsonPropertyName("locked_out")]
    public int LockedOut { get; set; }

    [JsonPropertyName("notification")]
    public string? Notification { get; set; }

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

public class CreateUserRequest
{
    [JsonPropertyName("user_id")]
    public string? UserId { get; set; }

    [JsonPropertyName("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [JsonPropertyName("last_name")]
    public string LastName { get; set; } = string.Empty;

    [JsonPropertyName("department_id")]
    public string? DepartmentId { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("mobile_phone")]
    public string? MobilePhone { get; set; }

    [JsonPropertyName("business_phone")]
    public string? BusinessPhone { get; set; }

    [JsonPropertyName("active")]
    public object? Active { get; set; }

    [JsonPropertyName("vip")]
    public object? Vip { get; set; }

    [JsonPropertyName("language")]
    public string? Language { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }

    [JsonPropertyName("locked_out")]
    public object? LockedOut { get; set; }

    [JsonPropertyName("notification")]
    public string? Notification { get; set; }

    [JsonPropertyName("sys_id")]
    public string? SysId { get; set; }
}

public class UpdateUserRequest
{
    [JsonPropertyName("first_name")]
    public string? FirstName { get; set; }

    [JsonPropertyName("last_name")]
    public string? LastName { get; set; }

    [JsonPropertyName("department_id")]
    public string? DepartmentId { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("mobile_phone")]
    public string? MobilePhone { get; set; }

    [JsonPropertyName("business_phone")]
    public string? BusinessPhone { get; set; }

    [JsonPropertyName("active")]
    public object? Active { get; set; }

    [JsonPropertyName("vip")]
    public object? Vip { get; set; }

    [JsonPropertyName("language")]
    public string? Language { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }

    [JsonPropertyName("locked_out")]
    public object? LockedOut { get; set; }

    [JsonPropertyName("notification")]
    public string? Notification { get; set; }
}

public class BulkDeactivateRequest
{
    [JsonPropertyName("user_ids")]
    public List<string> UserIds { get; set; } = new();
}
