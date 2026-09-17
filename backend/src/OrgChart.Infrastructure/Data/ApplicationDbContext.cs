using Microsoft.EntityFrameworkCore;
using OrgChart.Core.Entities;

namespace OrgChart.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Department> Departments => Set<Department>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ConcurrentDuty> ConcurrentDuties => Set<ConcurrentDuty>();
    public DbSet<ChangeHistory> ChangeHistories => Set<ChangeHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Departments Configuration
        modelBuilder.Entity<Department>(entity =>
        {
            entity.ToTable("departments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.DepartmentId).HasColumnName("department_id").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.ParentDepartmentId).HasColumnName("parent_department_id").HasMaxLength(50);
            entity.Property(e => e.DepartmentHead).HasColumnName("department_head").HasMaxLength(255);
            entity.Property(e => e.PrimaryContact).HasColumnName("primary_contact").HasMaxLength(255);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.BusinessUnit).HasColumnName("business_unit").HasMaxLength(255);
            entity.Property(e => e.Company).HasColumnName("company").HasMaxLength(255);
            entity.Property(e => e.CostCenter).HasColumnName("cost_center").HasMaxLength(255);
            entity.Property(e => e.HeadCount).HasColumnName("head_count");
            entity.Property(e => e.SysId).HasColumnName("sys_id").HasMaxLength(100);
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValue(1);
            entity.Property(e => e.ValidFrom).HasColumnName("valid_from");
            entity.Property(e => e.ValidTo).HasColumnName("valid_to");
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(e => new { e.DepartmentId, e.IsActive }).HasDatabaseName("idx_departments_active");
            entity.HasIndex(e => new { e.DepartmentId, e.Version }).HasDatabaseName("idx_departments_version");
            entity.HasIndex(e => new { e.ValidFrom, e.ValidTo }).HasDatabaseName("idx_departments_valid");
        });

        // 2. Users Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).HasColumnName("user_id").HasMaxLength(50).IsRequired();
            entity.Property(e => e.FirstName).HasColumnName("first_name").HasMaxLength(100);
            entity.Property(e => e.LastName).HasColumnName("last_name").HasMaxLength(100);
            entity.Property(e => e.DepartmentId).HasColumnName("department_id").HasMaxLength(50);
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(100);
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255);
            entity.Property(e => e.MobilePhone).HasColumnName("mobile_phone").HasMaxLength(50);
            entity.Property(e => e.BusinessPhone).HasColumnName("business_phone").HasMaxLength(50);
            entity.Property(e => e.Active).HasColumnName("active").HasDefaultValue(true);
            entity.Property(e => e.Vip).HasColumnName("vip").HasDefaultValue(false);
            entity.Property(e => e.Language).HasColumnName("language").HasMaxLength(50);
            entity.Property(e => e.Password).HasColumnName("password").HasMaxLength(255);
            entity.Property(e => e.LockedOut).HasColumnName("locked_out").HasDefaultValue(false);
            entity.Property(e => e.Notification).HasColumnName("notification").HasMaxLength(50).HasDefaultValue("Enable");
            entity.Property(e => e.SysId).HasColumnName("sys_id").HasMaxLength(100);
            entity.Property(e => e.Version).HasColumnName("version").HasDefaultValue(1);
            entity.Property(e => e.ValidFrom).HasColumnName("valid_from");
            entity.Property(e => e.ValidTo).HasColumnName("valid_to");
            entity.Property(e => e.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(e => new { e.UserId, e.IsActive }).HasDatabaseName("idx_users_active");
            entity.HasIndex(e => new { e.UserId, e.Version }).HasDatabaseName("idx_users_version");
            entity.HasIndex(e => new { e.ValidFrom, e.ValidTo }).HasDatabaseName("idx_users_valid");
        });

        // 3. Concurrent Duties Configuration
        modelBuilder.Entity<ConcurrentDuty>(entity =>
        {
            entity.ToTable("concurrent_duties");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).HasColumnName("user_id").HasMaxLength(50).IsRequired();
            entity.Property(e => e.DepartmentId).HasColumnName("department_id").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(100);
            entity.Property(e => e.IsPrimary).HasColumnName("is_primary").HasDefaultValue(false);
            entity.Property(e => e.StartDate).HasColumnName("start_date").HasMaxLength(50);
            entity.Property(e => e.EndDate).HasColumnName("end_date").HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasIndex(e => e.UserId).HasDatabaseName("idx_concurrent_user");
        });

        // 4. Change History Configuration
        modelBuilder.Entity<ChangeHistory>(entity =>
        {
            entity.ToTable("change_history");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.TableName).HasColumnName("table_name").HasMaxLength(50).IsRequired();
            entity.Property(e => e.RecordId).HasColumnName("record_id").HasMaxLength(50).IsRequired();
            entity.Property(e => e.ActionType).HasColumnName("action_type").HasMaxLength(20).IsRequired();
            entity.Property(e => e.ChangedBy).HasColumnName("changed_by").HasMaxLength(100);
            entity.Property(e => e.Description).HasColumnName("description").IsRequired();
            entity.Property(e => e.ChangedAt).HasColumnName("changed_at");

            entity.HasIndex(e => new { e.TableName, e.RecordId }).HasDatabaseName("idx_history_record");
            entity.HasIndex(e => e.ChangedAt).HasDatabaseName("idx_history_date");
        });
    }
}
