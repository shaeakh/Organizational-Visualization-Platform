using Microsoft.AspNetCore.Mvc;

namespace OrgChart.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "ok",
            time = DateTime.UtcNow.ToString("o")
        });
    }
}
