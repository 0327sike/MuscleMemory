namespace MuscleMemory.Models;

public class MuscleGroup
{
    public int MuscleGroupId { get; set; }
    public string Muscle { get; set; } = null!;

    public ICollection<Workout> Workouts { get; set; } = new List<Workout>();
}