using System.Text.Json.Serialization;

namespace OrgChart.Core.DTOs;

public class UploadStatusResponse
{
    [JsonPropertyName("users")]
    public int Users { get; set; }

    [JsonPropertyName("departments")]
    public int Departments { get; set; }

    [JsonPropertyName("dataSource")]
    public string DataSource { get; set; } = "database";
}

public class UploadResponseCounts
{
    [JsonPropertyName("users")]
    public int Users { get; set; }

    [JsonPropertyName("departments")]
    public int Departments { get; set; }
}

public class UploadResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("message")]
    public string Message { get; set; } = "Data imported successfully";

    [JsonPropertyName("counts")]
    public UploadResponseCounts Counts { get; set; } = new();
}
