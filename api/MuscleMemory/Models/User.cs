namespace MuscleMemory.Models;

public class User
{
    public string UserId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; } = null!;
    public int Age { get; set; }

    public ICollection<Feedback> Feedbacks { get; set; }
}