using System;

using MuscleMemory.Models;

public interface IMuscleGroupService
{
    public Task<List<MuscleGroup>> GetGroupsAsync();
    public Task<MuscleGroup> GetGroupByIdAsync(long id);
    public Task<MuscleGroup> CreateGroupAsync(MuscleGroup workout);
}