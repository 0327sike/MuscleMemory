using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MuscleMemory.Models;

public class MuscleGroup
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int MuscleGroupId { get; set; }
    public string Muscle { get; set; } = null!;

    public ICollection<Workout> Workouts { get; set; } = new List<Workout>();
}