using System.IO;
using OrgChart.Core.DTOs;

namespace OrgChart.Core.Interfaces;

public interface IExcelImportService
{
    Task<UploadStatusResponse> GetStatusAsync(CancellationToken cancellationToken = default);
    Task<UploadResponse> ImportDataAsync(Stream usersStream, Stream deptsStream, string source = "bulk-upload", CancellationToken cancellationToken = default);
    Task ImportSeedDataIfEmptyAsync(string seedDeptPath, string seedUserPath, CancellationToken cancellationToken = default);
}
