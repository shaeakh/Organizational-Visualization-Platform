using OrgChart.Core.Entities;

namespace OrgChart.Core.Interfaces;

public interface IUserRepository
{
    Task<List<User>> GetAllAsync(DateTime? asOfDate = null, string? departmentId = null, string? title = null, bool? active = null, CancellationToken cancellationToken = default);
    Task<User?> GetByIdAsync(string userId, DateTime? asOfDate = null, CancellationToken cancellationToken = default);
    Task<User?> GetCurrentActiveAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<User>> GetCurrentActiveListAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsActiveAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<string>> GetAllUserIdsAsync(CancellationToken cancellationToken = default);
    Task<int> GetCountAsync(CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<User> users, CancellationToken cancellationToken = default);
    Task UpdateAsync(User user, CancellationToken cancellationToken = default);
    Task ClearAllAsync(CancellationToken cancellationToken = default);
}
