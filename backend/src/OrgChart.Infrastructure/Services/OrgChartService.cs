using OrgChart.Core.DTOs;
using OrgChart.Core.Interfaces;
using OrgChart.Infrastructure.Extensions;

namespace OrgChart.Infrastructure.Services;

public class OrgChartService : IOrgChartService
{
    private readonly IDepartmentRepository _deptRepo;
    private readonly IUserRepository _userRepo;
    private readonly IConcurrentDutyRepository _dutyRepo;

    private static readonly string[] TitlePriority = new[]
    {
        "代表取締役", "本部長", "事業部長", "部長", "課長", "担当課長", "主任", "主任２", "課員"
    };

    public OrgChartService(
        IDepartmentRepository deptRepo,
        IUserRepository userRepo,
        IConcurrentDutyRepository dutyRepo)
    {
        _deptRepo = deptRepo;
        _userRepo = userRepo;
        _dutyRepo = dutyRepo;
    }

    public async Task<List<OrgChartNodeDto>> GetOrgChartAsync(string? date = null, CancellationToken cancellationToken = default)
    {
        var targetDate = MappingExtensions.ParseDate(date);

        // 1. Fetch departments
        var depts = await _deptRepo.GetAllAsync(targetDate, cancellationToken);

        // 2. Fetch users (only employed/active = true at that timeline)
        var users = await _userRepo.GetAllAsync(targetDate, null, null, true, cancellationToken);

        // 3. Fetch concurrent duties
        var concurrentDuties = await _dutyRepo.GetAllAsync(targetDate, cancellationToken);

        // 4. Map departments to OrgChartNodeDto
        var nodeMap = new Dictionary<string, OrgChartNodeDto>();
        var roots = new List<OrgChartNodeDto>();

        foreach (var dept in depts)
        {
            nodeMap[dept.DepartmentId] = new OrgChartNodeDto
            {
                Department = dept.ToDto(),
                Members = new List<OrgChartMemberDto>(),
                Children = new List<OrgChartNodeDto>()
            };
        }

        // 5. Assign primary users to departments
        foreach (var user in users)
        {
            if (!string.IsNullOrEmpty(user.DepartmentId) && nodeMap.TryGetValue(user.DepartmentId, out var node))
            {
                var userDto = user.ToDto();
                node.Members.Add(new OrgChartMemberDto
                {
                    Id = userDto.Id,
                    UserId = userDto.UserId,
                    FirstName = userDto.FirstName,
                    LastName = userDto.LastName,
                    DepartmentId = userDto.DepartmentId,
                    Title = userDto.Title,
                    Email = userDto.Email,
                    MobilePhone = userDto.MobilePhone,
                    BusinessPhone = userDto.BusinessPhone,
                    Active = userDto.Active,
                    Vip = userDto.Vip,
                    Language = userDto.Language,
                    Password = userDto.Password,
                    LockedOut = userDto.LockedOut,
                    Notification = userDto.Notification,
                    SysId = userDto.SysId,
                    Version = userDto.Version,
                    ValidFrom = userDto.ValidFrom,
                    ValidTo = userDto.ValidTo,
                    IsActive = userDto.IsActive,
                    CreatedAt = userDto.CreatedAt,
                    UpdatedAt = userDto.UpdatedAt,
                    IsConcurrent = false
                });
            }
        }

        // 6. Assign concurrent users (Kenmu)
        foreach (var duty in concurrentDuties)
        {
            if (nodeMap.TryGetValue(duty.DepartmentId, out var deptNode))
            {
                var user = await _userRepo.GetByIdAsync(duty.UserId, targetDate, cancellationToken);
                if (user != null && user.Active)
                {
                    var userDto = user.ToDto();
                    deptNode.Members.Add(new OrgChartMemberDto
                    {
                        Id = userDto.Id,
                        UserId = userDto.UserId,
                        FirstName = userDto.FirstName,
                        LastName = userDto.LastName,
                        DepartmentId = duty.DepartmentId,
                        Title = !string.IsNullOrEmpty(duty.Title) ? duty.Title : userDto.Title,
                        Email = userDto.Email,
                        MobilePhone = userDto.MobilePhone,
                        BusinessPhone = userDto.BusinessPhone,
                        Active = userDto.Active,
                        Vip = userDto.Vip,
                        Language = userDto.Language,
                        Password = userDto.Password,
                        LockedOut = userDto.LockedOut,
                        Notification = userDto.Notification,
                        SysId = userDto.SysId,
                        Version = userDto.Version,
                        ValidFrom = userDto.ValidFrom,
                        ValidTo = userDto.ValidTo,
                        IsActive = userDto.IsActive,
                        CreatedAt = userDto.CreatedAt,
                        UpdatedAt = userDto.UpdatedAt,
                        IsConcurrent = true
                    });
                }
            }
        }

        // 7. Sort members within each department node
        foreach (var node in nodeMap.Values)
        {
            var deptHead = node.Department.DepartmentHead;

            node.Members.Sort((a, b) =>
            {
                var isHeadA = !string.IsNullOrEmpty(deptHead) &&
                    (deptHead == $"{a.LastName} {a.FirstName}" || deptHead == $"{a.FirstName} {a.LastName}");
                var isHeadB = !string.IsNullOrEmpty(deptHead) &&
                    (deptHead == $"{b.LastName} {b.FirstName}" || deptHead == $"{b.FirstName} {b.LastName}");

                if (isHeadA && !isHeadB) return -1;
                if (!isHeadA && isHeadB) return 1;

                var indexA = Array.IndexOf(TitlePriority, a.Title);
                var indexB = Array.IndexOf(TitlePriority, b.Title);

                var prioA = indexA == -1 ? 99 : indexA;
                var prioB = indexB == -1 ? 99 : indexB;

                if (prioA != prioB) return prioA.CompareTo(prioB);

                return string.Compare(a.LastName, b.LastName, StringComparison.Ordinal);
            });
        }

        // 8. Build hierarchy
        foreach (var dept in depts)
        {
            var node = nodeMap[dept.DepartmentId];
            if (!string.IsNullOrEmpty(dept.ParentDepartmentId) && nodeMap.TryGetValue(dept.ParentDepartmentId, out var parentNode))
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
}
