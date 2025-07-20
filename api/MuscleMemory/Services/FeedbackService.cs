using Microsoft.EntityFrameworkCore;
using MuscleMemory.Models;
public class FeedbackService : IFeedbackService
{
    private AppDbContext _dbContext;

    public FeedbackService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Feedback>> GetFeedbackListAsync()
    {
        try
        {
            var feedbacks = await _dbContext.Feedbacks
                .ToListAsync();
            return feedbacks;
        }
        catch (Exception ex)
        {
            throw new Exception("Error getting feedbacks: ", ex);
        }
    }

    public async Task<Feedback> GetFeedbackByIdAsync(long id)
    {
        try
        {
            var feedback = await _dbContext.Feedbacks
                .Where(f => f.FeedbackId == id)
                .FirstOrDefaultAsync();
            return feedback;
        }
        catch (Exception ex)
        {
            throw new Exception("Error getting feedback: ", ex);
        }
    }

    public async Task<Feedback> CreateFeedbackAsync(Feedback feedback)
    {
        try
        {
            var newFeedback = new Feedback
            {
                UserFeedback = feedback.UserFeedback,
            };

            await _dbContext.AddAsync(newFeedback);
            await _dbContext.SaveChangesAsync();

            return newFeedback;
        }
        catch (Exception ex)
        {
            throw new Exception("Error creating feedback: ", ex);
        }
    }
}