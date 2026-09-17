namespace OrgChart.Core.Exceptions;

public class BadRequestException : Exception
{
    public object? Details { get; set; }

    public BadRequestException(string message) : base(message) { }

    public BadRequestException(string message, object? details) : base(message)
    {
        Details = details;
    }
}
