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
public class FeedbackController : Controller
{
    private IFeedbackService _service;

    public FeedbackController(IFeedbackService service)
    {
        _service = service;
    }

    [HttpGet("get")]
    public async Task<IActionResult> GetFeedbackList()
    {
        try
        {
            var feedbacks = await _service.GetFeedbackListAsync();
            return Ok(feedbacks);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("get/{id}")]
    public async Task<IActionResult> GetFeedbackById([FromRoute] long id)
    {
        try
        {
            var feedback = await _service.GetFeedbackByIdAsync(id);
            if (feedback == null)
            {
                return NotFound();
            }

            return Ok(feedback);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateFeedback([FromBody] Feedback feedback)
    {
        try
        {
            var newFeedback = await _service.CreateFeedbackAsync(feedback);
            return Ok(newFeedback);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}