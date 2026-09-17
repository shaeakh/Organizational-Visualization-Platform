using Microsoft.EntityFrameworkCore;
using OrgChart.Core.Entities;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Data;

namespace OrgChart.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<User>> GetAllAsync(DateTime? asOfDate = null, string? departmentId = null, string? title = null, bool? active = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.AsNoTracking();

        if (asOfDate.HasValue)
        {
            var date = asOfDate.Value;
            query = query.Where(u => u.ValidFrom <= date && u.ValidTo >= date);
        }
        else
        {
            query = query.Where(u => u.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(departmentId))
        {
            query = query.Where(u => u.DepartmentId == departmentId);
        }

        if (!string.IsNullOrWhiteSpace(title))
        {
            query = query.Where(u => u.Title == title);
        }

        if (active.HasValue)
        {
            query = query.Where(u => u.Active == active.Value);
        }

        return await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<User?> GetByIdAsync(string userId, DateTime? asOfDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Users.AsNoTracking().Where(u => u.UserId == userId);

        if (asOfDate.HasValue)
        {
            var date = asOfDate.Value;
            query = query.Where(u => u.ValidFrom <= date && u.ValidTo >= date);
        }
        else
        {
            query = query.Where(u => u.IsActive);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<User?> GetCurrentActiveAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId && u.IsActive, cancellationToken);
    }

    public async Task<List<User>> GetCurrentActiveListAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsActiveAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AnyAsync(u => u.UserId == userId && u.IsActive, cancellationToken);
    }

    public async Task<List<string>> GetAllUserIdsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .Select(u => u.UserId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .CountAsync(u => u.IsActive, cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddAsync(user, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<User> users, CancellationToken cancellationToken = default)
    {
        await _context.Users.AddRangeAsync(users, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ClearAllAsync(CancellationToken cancellationToken = default)
    {
        _context.Users.RemoveRange(_context.Users);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
