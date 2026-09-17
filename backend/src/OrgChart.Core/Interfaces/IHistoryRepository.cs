using OrgChart.Core.Entities;

namespace OrgChart.Core.Interfaces;

public interface IHistoryRepository
{
    Task<List<ChangeHistory>> GetAllAsync(string? tableName = null, string? recordId = null, CancellationToken cancellationToken = default);
    Task AddAsync(ChangeHistory entry, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<ChangeHistory> entries, CancellationToken cancellationToken = default);
    Task ClearAllAsync(CancellationToken cancellationToken = default);
}
