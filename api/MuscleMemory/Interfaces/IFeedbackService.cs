

using MuscleMemory.Models;

public interface IFeedbackService
{
    public Task<List<Feedback>> GetFeedbackListAsync();
    public Task<Feedback> GetFeedbackByIdAsync(long id);
    public Task<Feedback> CreateFeedbackAsync(Feedback feedback);
}