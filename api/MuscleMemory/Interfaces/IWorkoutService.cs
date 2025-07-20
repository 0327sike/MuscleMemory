using System;

using MuscleMemory.Models;

public interface IWorkoutService
{
    public Task<List<Workout>> GetWorkoutsAsync();
    public Task<Workout> GetWorkoutByIdAsync(long id);
    public Task<Workout> CreateWorkoutAsync(Workout workout);
}