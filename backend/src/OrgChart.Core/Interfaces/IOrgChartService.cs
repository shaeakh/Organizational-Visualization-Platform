using OrgChart.Core.DTOs;

namespace OrgChart.Core.Interfaces;

public interface IOrgChartService
{
    Task<List<OrgChartNodeDto>> GetOrgChartAsync(string? date = null, CancellationToken cancellationToken = default);
}
