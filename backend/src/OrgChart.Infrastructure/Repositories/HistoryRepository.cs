using Microsoft.EntityFrameworkCore;
using OrgChart.Core.Entities;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Data;

namespace OrgChart.Infrastructure.Repositories;

public class HistoryRepository : IHistoryRepository
{
    private readonly ApplicationDbContext _context;

    public HistoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChangeHistory>> GetAllAsync(string? tableName = null, string? recordId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.ChangeHistories.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(tableName))
        {
            query = query.Where(h => h.TableName == tableName);
        }

        if (!string.IsNullOrWhiteSpace(recordId))
        {
            query = query.Where(h => h.RecordId == recordId);
        }

        return await query.OrderByDescending(h => h.ChangedAt).ToListAsync(cancellationToken);
    }

    public async Task AddAsync(ChangeHistory entry, CancellationToken cancellationToken = default)
    {
        await _context.ChangeHistories.AddAsync(entry, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<ChangeHistory> entries, CancellationToken cancellationToken = default)
    {
        await _context.ChangeHistories.AddRangeAsync(entries, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ClearAllAsync(CancellationToken cancellationToken = default)
    {
        _context.ChangeHistories.RemoveRange(_context.ChangeHistories);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
