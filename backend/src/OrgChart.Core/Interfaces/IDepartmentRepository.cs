using OrgChart.Core.Entities;

namespace OrgChart.Core.Interfaces;

public interface IDepartmentRepository
{
    Task<List<Department>> GetAllAsync(DateTime? asOfDate = null, CancellationToken cancellationToken = default);
    Task<Department?> GetByIdAsync(string departmentId, DateTime? asOfDate = null, CancellationToken cancellationToken = default);
    Task<Department?> GetCurrentActiveAsync(string departmentId, CancellationToken cancellationToken = default);
    Task<List<Department>> GetCurrentActiveListAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsActiveAsync(string departmentId, CancellationToken cancellationToken = default);
    Task<List<string>> GetAllDepartmentIdsAsync(CancellationToken cancellationToken = default);
    Task<int> GetCountAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Department department, CancellationToken cancellationToken = default);
    Task UpdateAsync(Department department, CancellationToken cancellationToken = default);
    Task ReParentChildrenAsync(string oldParentId, CancellationToken cancellationToken = default);
    Task ClearAllAsync(CancellationToken cancellationToken = default);
}
