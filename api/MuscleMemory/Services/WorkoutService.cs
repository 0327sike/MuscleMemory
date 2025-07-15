
using System.Reflection.Metadata.Ecma335;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using MuscleMemory.Models;

namespace Services;

public class WorkoutService : IWorkoutService
{
    private AppDbContext _dbContext;
    public WorkoutService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Workout>> GetWorkoutsAsync()
    {
        try
        {
            var workouts = await _dbContext.Workouts.ToListAsync();
            return workouts;
        }
        catch (Exception ex)
        {
            throw new Exception("Error getting workouts: ", ex);
        }
    }

    public async Task<Workout> GetWorkoutByIdAsync(long id)
    {
        try
        {
            var workout = await _dbContext.Workouts
                .Where(w => w.WorkoutId == id)
                .FirstOrDefaultAsync();

            return workout;
        }
        catch (Exception ex)
        {
            throw new Exception("Error getting workout by id: ", ex);
        }
    }

    public async Task<Workout> CreateWorkoutAsync(Workout workout)
    {
        try
        {
            await _dbContext.AddAsync(workout);
            await _dbContext.SaveChangesAsync();
            return workout;
        }
        catch (Exception ex)
        {
            throw new Exception("Error creating workout: ", ex);
        }
    }
}