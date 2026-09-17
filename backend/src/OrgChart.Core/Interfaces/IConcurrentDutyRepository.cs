using OrgChart.Core.Entities;

namespace OrgChart.Core.Interfaces;

public interface IConcurrentDutyRepository
{
    Task<List<ConcurrentDuty>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<ConcurrentDuty>> GetAllAsync(DateTime? asOfDate = null, CancellationToken cancellationToken = default);
    Task<ConcurrentDuty?> GetByIdAsync(int id, string userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string userId, string departmentId, CancellationToken cancellationToken = default);
    Task AddAsync(ConcurrentDuty concurrentDuty, CancellationToken cancellationToken = default);
    Task DeleteAsync(ConcurrentDuty concurrentDuty, CancellationToken cancellationToken = default);
    Task ClearAllAsync(CancellationToken cancellationToken = default);
}
