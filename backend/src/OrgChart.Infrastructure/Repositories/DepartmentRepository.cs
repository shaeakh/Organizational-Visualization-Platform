using Microsoft.EntityFrameworkCore;
using OrgChart.Core.Entities;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Data;

namespace OrgChart.Infrastructure.Repositories;

public class DepartmentRepository : IDepartmentRepository
{
    private readonly ApplicationDbContext _context;

    public DepartmentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Department>> GetAllAsync(DateTime? asOfDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Departments.AsNoTracking();

        if (asOfDate.HasValue)
        {
            var date = asOfDate.Value;
            query = query.Where(d => d.ValidFrom <= date && d.ValidTo >= date);
        }
        else
        {
            query = query.Where(d => d.IsActive);
        }

        return await query.OrderBy(d => d.Name).ToListAsync(cancellationToken);
    }

    public async Task<Department?> GetByIdAsync(string departmentId, DateTime? asOfDate = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Departments.AsNoTracking().Where(d => d.DepartmentId == departmentId);

        if (asOfDate.HasValue)
        {
            var date = asOfDate.Value;
            query = query.Where(d => d.ValidFrom <= date && d.ValidTo >= date);
        }
        else
        {
            query = query.Where(d => d.IsActive);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Department?> GetCurrentActiveAsync(string departmentId, CancellationToken cancellationToken = default)
    {
        return await _context.Departments
            .FirstOrDefaultAsync(d => d.DepartmentId == departmentId && d.IsActive, cancellationToken);
    }

    public async Task<List<Department>> GetCurrentActiveListAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Departments
            .AsNoTracking()
            .Where(d => d.IsActive)
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsActiveAsync(string departmentId, CancellationToken cancellationToken = default)
    {
        return await _context.Departments
            .AnyAsync(d => d.DepartmentId == departmentId && d.IsActive, cancellationToken);
    }

    public async Task<List<string>> GetAllDepartmentIdsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Departments
            .Select(d => d.DepartmentId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Departments
            .CountAsync(d => d.IsActive, cancellationToken);
    }

    public async Task AddAsync(Department department, CancellationToken cancellationToken = default)
    {
        await _context.Departments.AddAsync(department, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Department department, CancellationToken cancellationToken = default)
    {
        _context.Departments.Update(department);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ReParentChildrenAsync(string oldParentId, CancellationToken cancellationToken = default)
    {
        var children = await _context.Departments
            .Where(d => d.ParentDepartmentId == oldParentId && d.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var child in children)
        {
            child.ParentDepartmentId = null;
            child.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task ClearAllAsync(CancellationToken cancellationToken = default)
    {
        _context.Departments.RemoveRange(_context.Departments);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
