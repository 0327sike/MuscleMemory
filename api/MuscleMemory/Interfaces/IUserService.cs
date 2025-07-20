using MuscleMemory.Models;

public interface IUserService
{
    public Task<List<User>> GetUsersAsync();
    public Task<User> GetUserByIdAsync(string id);
    public Task<User> CreateUserAsync(User user);
}