package com.yasith.task_manager.controller;

import com.yasith.task_manager.dto.ApiResponse;
import com.yasith.task_manager.entity.Task;
import com.yasith.task_manager.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // View All Tasks
    @GetMapping
    public ResponseEntity<ApiResponse<List<Task>>> getAllTasks(@RequestParam(required = false) String assigneeEmail) {
        List<Task> tasks = taskService.getAllTasks(assigneeEmail);
        return ResponseEntity.ok(ApiResponse.success("Tasks fetched successfully", tasks));
    }

    // Create new task
    @PostMapping
    public ResponseEntity<ApiResponse<Task>> createTask(@Valid @RequestBody Task task) {
        Task createdTask = taskService.createTask(task);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully", createdTask));
    }

    // Update Task
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Task>> updateTask(@PathVariable UUID id, @Valid @RequestBody Task task) {
        Task updatedTask = taskService.updateTask(id, task);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", updatedTask));
    }

    // Delete Task
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }

}
