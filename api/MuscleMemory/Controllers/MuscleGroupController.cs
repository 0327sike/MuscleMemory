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
public class MuscleGroupController : Controller
{
    private IMuscleGroupService _service;

    public MuscleGroupController(IMuscleGroupService service)
    {
        _service = service;
    }

    [HttpGet("groups")]
    public async Task<IActionResult> GetGroupList()
    {
        try
        {
            var groups = await _service.GetGroupsAsync();
            return Ok(groups);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("groups/{id}")]
    public async Task<IActionResult> GetGroupById([FromRoute] long id)
    {
        try
        {
            var group = await _service.GetGroupByIdAsync(id);
            if (group == null)
            {
                return NotFound();
            }

            return Ok(group);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateGroup([FromBody] MuscleGroup group)
    {
        try
        {
            var newGroup = await _service.CreateGroupAsync(group);
            return Ok(newGroup);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}