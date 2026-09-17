using Microsoft.EntityFrameworkCore;
using OrgChart.Core.Entities;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Data;

namespace OrgChart.Infrastructure.Repositories;

public class ConcurrentDutyRepository : IConcurrentDutyRepository
{
    private readonly ApplicationDbContext _context;

    public ConcurrentDutyRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ConcurrentDuty>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _context.ConcurrentDuties
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ConcurrentDuty>> GetAllAsync(DateTime? asOfDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.ConcurrentDuties.AsNoTracking();

        if (asOfDate.HasValue)
        {
            var dateStr = asOfDate.Value.ToString("yyyy-MM-dd");
            query = query.Where(c => 
                (c.StartDate == null || string.Compare(c.StartDate, dateStr) <= 0) &&
                (c.EndDate == null || string.Compare(c.EndDate, dateStr) >= 0));
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<ConcurrentDuty?> GetByIdAsync(int id, string userId, CancellationToken cancellationToken = default)
    {
        return await _context.ConcurrentDuties
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId, cancellationToken);
    }

    public async Task<bool> ExistsAsync(string userId, string departmentId, CancellationToken cancellationToken = default)
    {
        return await _context.ConcurrentDuties
            .AnyAsync(c => c.UserId == userId && c.DepartmentId == departmentId, cancellationToken);
    }

    public async Task AddAsync(ConcurrentDuty concurrentDuty, CancellationToken cancellationToken = default)
    {
        await _context.ConcurrentDuties.AddAsync(concurrentDuty, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(ConcurrentDuty concurrentDuty, CancellationToken cancellationToken = default)
    {
        _context.ConcurrentDuties.Remove(concurrentDuty);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ClearAllAsync(CancellationToken cancellationToken = default)
    {
        _context.ConcurrentDuties.RemoveRange(_context.ConcurrentDuties);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
