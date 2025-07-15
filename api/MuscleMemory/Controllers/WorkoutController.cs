using System;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using MuscleMemory.Models;
using Services;

namespace Controllers;

[Route("api/[controller]")]
[ApiController]
public class WorkoutController : Controller
{
    private IWorkoutService _service;

    public WorkoutController(IWorkoutService service)
    {
        _service = service;
    }

    [HttpGet("workouts")]
    public async Task<IActionResult> GetWorkoutList()
    {
        try
        {
            var workouts = await _service.GetWorkoutsAsync();
            return Ok(workouts);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("workouts/{id}")]
    public async Task<IActionResult> GetWorkoutById([FromRoute] long id)
    {
        try
        {
            var workout = await _service.GetWorkoutByIdAsync(id);
            if (workout == null)
            {
                return NotFound();
            }

            return Ok(workout);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateWorkout([FromBody] Workout workout)
    {
        try
        {
            var newWorkout = await _service.CreateWorkoutAsync(workout);
            return Ok(newWorkout);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}