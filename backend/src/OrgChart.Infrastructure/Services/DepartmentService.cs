using System.Globalization;
using OrgChart.Core.DTOs;
using OrgChart.Core.Entities;
using OrgChart.Core.Exceptions;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Extensions;

namespace OrgChart.Infrastructure.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _deptRepo;
    private readonly IHistoryRepository _historyRepo;

    public DepartmentService(IDepartmentRepository deptRepo, IHistoryRepository historyRepo)
    {
        _deptRepo = deptRepo;
        _historyRepo = historyRepo;
    }

    public async Task<List<DepartmentDto>> GetDepartmentsAsync(string? date = null, CancellationToken cancellationToken = default)
    {
        var targetDate = MappingExtensions.ParseDate(date);
        var depts = await _deptRepo.GetAllAsync(targetDate, cancellationToken);
        return depts.Select(d => d.ToDto()).ToList();
    }

    public async Task<List<DepartmentTreeDto>> GetDepartmentTreeAsync(string? date = null, CancellationToken cancellationToken = default)
    {
        var targetDate = MappingExtensions.ParseDate(date);
        var depts = await _deptRepo.GetAllAsync(targetDate, cancellationToken);

        var idMap = new Dictionary<string, DepartmentTreeDto>();
        var roots = new List<DepartmentTreeDto>();

        foreach (var d in depts)
        {
            var dto = new DepartmentTreeDto
            {
                Id = d.Id,
                DepartmentId = d.DepartmentId,
                Name = d.Name,
                ParentDepartmentId = d.ParentDepartmentId,
                DepartmentHead = d.DepartmentHead,
                PrimaryContact = d.PrimaryContact,
                Description = d.Description,
                BusinessUnit = d.BusinessUnit,
                Company = d.Company,
                CostCenter = d.CostCenter,
                HeadCount = d.HeadCount,
                SysId = d.SysId,
                Version = d.Version,
                ValidFrom = MappingExtensions.FormatDateTime(d.ValidFrom),
                ValidTo = MappingExtensions.FormatDateTime(d.ValidTo),
                IsActive = d.IsActive ? 1 : 0,
                CreatedAt = MappingExtensions.FormatDateTime(d.CreatedAt),
                UpdatedAt = MappingExtensions.FormatDateTime(d.UpdatedAt),
                Children = new List<DepartmentTreeDto>()
            };
            idMap[d.DepartmentId] = dto;
        }

        foreach (var d in depts)
        {
            var node = idMap[d.DepartmentId];
            if (!string.IsNullOrEmpty(d.ParentDepartmentId) && idMap.TryGetValue(d.ParentDepartmentId, out var parentNode))
            {
                parentNode.Children.Add(node);
            }
            else
            {
                roots.Add(node);
            }
        }

        return roots;
    }

    public async Task<DepartmentDto?> GetDepartmentByIdAsync(string id, string? date = null, CancellationToken cancellationToken = default)
    {
        var targetDate = MappingExtensions.ParseDate(date);
        var dept = await _deptRepo.GetByIdAsync(id, targetDate, cancellationToken);
        if (dept == null)
        {
            throw new NotFoundException("Department not found for the specified date/version");
        }
        return dept.ToDto();
    }

    public async Task<string> CreateDepartmentAsync(CreateDepartmentRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new BadRequestException("name is a required field.");
        }

        var finalDeptId = request.DepartmentId?.Trim();
        if (string.IsNullOrEmpty(finalDeptId))
        {
            var allIds = await _deptRepo.GetAllDepartmentIdsAsync(cancellationToken);
            int maxId = 0;
            foreach (var id in allIds)
            {
                if (int.TryParse(id, out var num) && num > maxId)
                {
                    maxId = num;
                }
            }
            var nextId = maxId > 0 ? maxId + 1 : 24100;
            finalDeptId = nextId.ToString();
        }
        else
        {
            if (await _deptRepo.ExistsActiveAsync(finalDeptId, cancellationToken))
            {
                throw new BadRequestException($"Department with ID {finalDeptId} already exists and is active.");
            }
        }

        var now = DateTime.UtcNow;
        var sysId = !string.IsNullOrWhiteSpace(request.SysId)
            ? request.SysId
            : Guid.NewGuid().ToString("N");

        var dept = new Department
        {
            DepartmentId = finalDeptId,
            Name = request.Name.Trim(),
            ParentDepartmentId = string.IsNullOrWhiteSpace(request.ParentDepartmentId) ? null : request.ParentDepartmentId.Trim(),
            DepartmentHead = string.IsNullOrWhiteSpace(request.DepartmentHead) ? null : request.DepartmentHead.Trim(),
            PrimaryContact = string.IsNullOrWhiteSpace(request.PrimaryContact) ? null : request.PrimaryContact.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            BusinessUnit = string.IsNullOrWhiteSpace(request.BusinessUnit) ? null : request.BusinessUnit.Trim(),
            Company = string.IsNullOrWhiteSpace(request.Company) ? null : request.Company.Trim(),
            CostCenter = string.IsNullOrWhiteSpace(request.CostCenter) ? null : request.CostCenter.Trim(),
            HeadCount = request.HeadCount,
            SysId = sysId,
            Version = 1,
            ValidFrom = now,
            ValidTo = new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        await _deptRepo.AddAsync(dept, cancellationToken);

        await _historyRepo.AddAsync(new ChangeHistory
        {
            TableName = "departments",
            RecordId = finalDeptId,
            ActionType = "CREATE",
            ChangedBy = "user",
            Description = $"Created department: {dept.Name} (ID: {finalDeptId})",
            ChangedAt = now
        }, cancellationToken);

        return finalDeptId;
    }

    public async Task UpdateDepartmentAsync(string id, UpdateDepartmentRequest request, CancellationToken cancellationToken = default)
    {
        var current = await _deptRepo.GetCurrentActiveAsync(id, cancellationToken);
        if (current == null)
        {
            throw new NotFoundException("Active department record not found.");
        }

        var now = DateTime.UtcNow;

        // 1. Deactivate old version row
        current.IsActive = false;
        current.ValidTo = now;
        current.UpdatedAt = now;
        await _deptRepo.UpdateAsync(current, cancellationToken);

        // 2. Prepare merged properties for new version
        var name = request.Name != null ? request.Name.Trim() : current.Name;
        var parentDeptId = request.ParentDepartmentId != null ? (string.IsNullOrWhiteSpace(request.ParentDepartmentId) ? null : request.ParentDepartmentId.Trim()) : current.ParentDepartmentId;
        var deptHead = request.DepartmentHead != null ? (string.IsNullOrWhiteSpace(request.DepartmentHead) ? null : request.DepartmentHead.Trim()) : current.DepartmentHead;
        var primaryContact = request.PrimaryContact != null ? (string.IsNullOrWhiteSpace(request.PrimaryContact) ? null : request.PrimaryContact.Trim()) : current.PrimaryContact;
        var desc = request.Description != null ? (string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()) : current.Description;
        var bu = request.BusinessUnit != null ? (string.IsNullOrWhiteSpace(request.BusinessUnit) ? null : request.BusinessUnit.Trim()) : current.BusinessUnit;
        var company = request.Company != null ? (string.IsNullOrWhiteSpace(request.Company) ? null : request.Company.Trim()) : current.Company;
        var costCenter = request.CostCenter != null ? (string.IsNullOrWhiteSpace(request.CostCenter) ? null : request.CostCenter.Trim()) : current.CostCenter;
        var headCount = request.HeadCount ?? current.HeadCount;

        var newDept = new Department
        {
            DepartmentId = current.DepartmentId,
            Name = name,
            ParentDepartmentId = parentDeptId,
            DepartmentHead = deptHead,
            PrimaryContact = primaryContact,
            Description = desc,
            BusinessUnit = bu,
            Company = company,
            CostCenter = costCenter,
            HeadCount = headCount,
            SysId = current.SysId,
            Version = current.Version + 1,
            ValidFrom = now,
            ValidTo = new DateTime(9999, 12, 31, 23, 59, 59, DateTimeKind.Utc),
            IsActive = true,
            CreatedAt = current.CreatedAt,
            UpdatedAt = now
        };

        await _deptRepo.AddAsync(newDept, cancellationToken);

        // 3. Log change in history
        var descParts = new List<string>();
        if (name != current.Name) descParts.Add($"Name: {current.Name} -> {name}");
        if (parentDeptId != current.ParentDepartmentId) descParts.Add($"Parent: {current.ParentDepartmentId ?? "None"} -> {parentDeptId ?? "None"}");
        if (deptHead != current.DepartmentHead) descParts.Add($"Head: {current.DepartmentHead ?? "None"} -> {deptHead ?? "None"}");
        var changeDesc = descParts.Count > 0 ? $"Updated: {string.Join(", ", descParts)}" : "Updated department metadata";

        await _historyRepo.AddAsync(new ChangeHistory
        {
            TableName = "departments",
            RecordId = id,
            ActionType = "UPDATE",
            ChangedBy = "user",
            Description = changeDesc,
            ChangedAt = now
        }, cancellationToken);
    }

    public async Task DeleteDepartmentAsync(string id, CancellationToken cancellationToken = default)
    {
        var current = await _deptRepo.GetCurrentActiveAsync(id, cancellationToken);
        if (current == null)
        {
            throw new NotFoundException("Active department record not found.");
        }

        var now = DateTime.UtcNow;

        // 1. Deactivate old version row
        current.IsActive = false;
        current.ValidTo = now;
        current.UpdatedAt = now;
        await _deptRepo.UpdateAsync(current, cancellationToken);

        // 2. Re-parent any child departments to null
        await _deptRepo.ReParentChildrenAsync(id, cancellationToken);

        // 3. Log history
        await _historyRepo.AddAsync(new ChangeHistory
        {
            TableName = "departments",
            RecordId = id,
            ActionType = "DELETE",
            ChangedBy = "user",
            Description = $"Retired department: {current.Name} (Child departments re-parented to root)",
            ChangedAt = now
        }, cancellationToken);
    }
}
