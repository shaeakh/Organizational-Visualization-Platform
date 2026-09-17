using OrgChart.Core.DTOs;

namespace OrgChart.Core.Interfaces;

public interface IDepartmentService
{
    Task<List<DepartmentDto>> GetDepartmentsAsync(string? date = null, CancellationToken cancellationToken = default);
    Task<List<DepartmentTreeDto>> GetDepartmentTreeAsync(string? date = null, CancellationToken cancellationToken = default);
    Task<DepartmentDto?> GetDepartmentByIdAsync(string id, string? date = null, CancellationToken cancellationToken = default);
    Task<string> CreateDepartmentAsync(CreateDepartmentRequest request, CancellationToken cancellationToken = default);
    Task UpdateDepartmentAsync(string id, UpdateDepartmentRequest request, CancellationToken cancellationToken = default);
    Task DeleteDepartmentAsync(string id, CancellationToken cancellationToken = default);
}
