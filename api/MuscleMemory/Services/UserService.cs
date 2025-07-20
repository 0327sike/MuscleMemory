
using Microsoft.EntityFrameworkCore;
using MuscleMemory.Models;

public class UserService : IUserService
{
    private AppDbContext _dbContext;

    public UserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<User>> GetUsersAsync()
    {
        try
        {
            var users = await _dbContext.Users
                .ToListAsync();
            return users;
        }
        catch (Exception ex)
        {
            throw new Exception("Error getting users: ", ex);
        }
    }

    public async Task<User> GetUserByIdAsync(string id)
    {
        try
        {
            var user = await _dbContext.Users
                .Where(u => u.UserId == id)
                .FirstOrDefaultAsync();
            return user;
        }
        catch (Exception ex)
        {
            throw new Exception("Error getting user: ", ex);
        }
    }

    public async Task<User> CreateUserAsync(User user)
    {
        try
        {
            var newUser = new User
            {
                UserId = Guid.NewGuid().ToString(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                Age = user.Age,
            };

            _dbContext.Users.Add(newUser);
            await _dbContext.SaveChangesAsync();

            return newUser;
        }
        catch (Exception ex)
        {
            throw new Exception("Adding user failed: ", ex);
        }
    }
}