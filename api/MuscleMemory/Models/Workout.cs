using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MuscleMemory.Models;

public class Workout
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int WorkoutId { get; set; }
    public int MuscleGroupId { get; set; }
    public string WorkoutName { get; set; } = null!;

    public MuscleGroup? MuscleGroup { get; set; }
}