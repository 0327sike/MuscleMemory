
using Microsoft.EntityFrameworkCore;
using MuscleMemory.Models;

public class MuscleGroupService : IMuscleGroupService
{
    private AppDbContext _dbContext;

    public MuscleGroupService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<MuscleGroup>> GetGroupsAsync()
    {
        try
        {
            var groups = await _dbContext.MuscleGroups
                .ToListAsync();
            return groups;
        }
        catch (Exception ex)
        {
            throw new Exception("Error getting muscle groups: ", ex);
        }
    }

    public async Task<MuscleGroup> GetGroupByIdAsync(long id)
    {
        try
        {
            var group = await _dbContext.MuscleGroups
                .Where(g => g.MuscleGroupId == id)
                .FirstOrDefaultAsync();
            return group;
        }
        catch (Exception ex)
        {
            throw new Exception("Error getting muscle group: ", ex);
        }
    }

    public async Task<MuscleGroup> CreateGroupAsync(MuscleGroup group)
    {
        try
        {
            _dbContext.MuscleGroups.Add(group);
            await _dbContext.SaveChangesAsync();

            return group;
        }
        catch (Exception ex)
        {
            throw new Exception("Adding muscle group failed: ", ex);
        }
    }
}