using OrgChart.Core.DTOs;

namespace OrgChart.Core.Interfaces;

public interface IUserService
{
    Task<List<UserDto>> GetUsersAsync(string? date = null, string? departmentId = null, string? title = null, string? active = null, CancellationToken cancellationToken = default);
    Task<UserDto?> GetUserByIdAsync(string id, string? date = null, CancellationToken cancellationToken = default);
    Task<string> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task UpdateUserAsync(string id, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(string id, CancellationToken cancellationToken = default);
    Task<(List<string> Deactivated, List<string> Skipped)> BulkDeleteUsersAsync(List<string> userIds, CancellationToken cancellationToken = default);
    Task<List<ConcurrentDutyDto>> GetConcurrentDutiesAsync(string userId, CancellationToken cancellationToken = default);
    Task AddConcurrentDutyAsync(string userId, CreateConcurrentDutyRequest request, CancellationToken cancellationToken = default);
    Task RemoveConcurrentDutyAsync(string userId, int dutyId, CancellationToken cancellationToken = default);
}
