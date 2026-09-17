# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and project files for caching layer
COPY OrgChart.sln ./
COPY src/OrgChart.Core/*.csproj ./src/OrgChart.Core/
COPY src/OrgChart.Infrastructure/*.csproj ./src/OrgChart.Infrastructure/
COPY src/OrgChart.Api/*.csproj ./src/OrgChart.Api/
COPY tests/OrgChart.UnitTests/*.csproj ./tests/OrgChart.UnitTests/
COPY tests/OrgChart.IntegrationTests/*.csproj ./tests/OrgChart.IntegrationTests/

RUN dotnet restore OrgChart.sln

# Copy remaining source code and publish
COPY . ./
RUN dotnet publish src/OrgChart.Api/OrgChart.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "OrgChart.Api.dll"]
