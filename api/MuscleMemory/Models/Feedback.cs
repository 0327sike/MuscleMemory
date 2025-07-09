namespace MuscleMemory.Models;

public class Feedback
{
    public int FeedbackId { get; set; }
    public string? UserFeedback { get; set; } = null;
    public string UserId { get; set; } = null!;

    public User User { get; set; } = null!;
}