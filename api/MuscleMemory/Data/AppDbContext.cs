using Microsoft.EntityFrameworkCore;
using MuscleMemory.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Feedback> Feedbacks { get; set; }
    public DbSet<MuscleGroup> MuscleGroups { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Workout> Workouts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Feedback>().ToTable("feedback");
        modelBuilder.Entity<MuscleGroup>().ToTable("muscle_group");
        modelBuilder.Entity<User>().ToTable("user");
        modelBuilder.Entity<Workout>().ToTable("workouts");


        modelBuilder.Entity<Feedback>().HasKey(f => f.FeedbackId);
        modelBuilder.Entity<MuscleGroup>().HasKey(m => m.MuscleGroupId);
        modelBuilder.Entity<User>().HasKey(u => u.UserId);
        modelBuilder.Entity<Workout>().HasKey(w => w.WorkoutId);


        modelBuilder.Entity<Feedback>()
            .HasOne(f => f.User)
            .WithMany(u => u.Feedbacks)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Workout>()
            .HasOne(w => w.MuscleGroup)
            .WithMany(m => m.Workouts)
            .HasForeignKey(w => w.MuscleGroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}