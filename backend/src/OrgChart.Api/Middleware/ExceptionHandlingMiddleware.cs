using System.Net;
using System.Text.Json;
using OrgChart.Core.Exceptions;

namespace OrgChart.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        switch (exception)
        {
            case NotFoundException notFoundEx:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    error = notFoundEx.Message
                }));
                break;

            case BadRequestException badRequestEx:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                if (badRequestEx.Details != null)
                {
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        error = badRequestEx.Message,
                        details = badRequestEx.Details
                    }));
                }
                else
                {
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        error = badRequestEx.Message
                    }));
                }
                break;

            default:
                _logger.LogError(exception, "Unhandled Exception during HTTP request execution: {Message}", exception.Message);
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    error = exception.Message ?? "Internal Server Error"
                }));
                break;
        }
    }
}
