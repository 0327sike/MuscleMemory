namespace MuscleMemory.Models;

public class Workout
{
    public int WorkoutId { get; set; }
    public int MuscleGroupId { get; set; }
    public string Name { get; set; } = null!;

    public MuscleGroup MuscleGroup { get; set; } = null!;
}