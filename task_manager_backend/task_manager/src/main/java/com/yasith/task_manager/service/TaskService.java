package com.yasith.task_manager.service;

import com.yasith.task_manager.entity.Task;
import com.yasith.task_manager.entity.enums.TaskStatus;
import com.yasith.task_manager.exception.TaskNotFoundException;
import com.yasith.task_manager.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;

    // Read Tasks
    public List<Task> getAllTasks(String assigneeEmail) {
        if (StringUtils.hasText(assigneeEmail)) {
            return taskRepository.findByAssigneeEmailIgnoreCase(assigneeEmail.trim());
        }
        return taskRepository.findAll();
    }

    // Create Tasks
    public Task createTask(Task task) {
        if (task.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
        }
        return taskRepository.save(task);
    }

    // Update Task
    public Task updateTask(UUID id, Task updatedTask) {
        Optional<Task> optionalTask = taskRepository.findById(id);
        if (optionalTask.isPresent()) {
            Task existing = optionalTask.get();

            existing.setTitle(updatedTask.getTitle());
            existing.setDescription(updatedTask.getDescription());
            existing.setAssigneeEmail(updatedTask.getAssigneeEmail());
            existing.setPriority(updatedTask.getPriority());
            existing.setDueDate(updatedTask.getDueDate());
            if (updatedTask.getStatus() == TaskStatus.DONE && existing.getStatus() != TaskStatus.DONE) {
                existing.setCompletedAt(LocalDateTime.now());
            } else if (updatedTask.getStatus() != TaskStatus.DONE) {
                existing.setCompletedAt(null);
            }
            existing.setStatus(updatedTask.getStatus());

            return taskRepository.save(existing);
        } else {
            throw new TaskNotFoundException("Task cannot be found with this id: " + id);
        }
    }

    // delete task
    public void deleteTask(UUID id) {
        if (!taskRepository.existsById(id)) {
            throw new TaskNotFoundException("Task cannot be found with this id: " + id);
        }
        taskRepository.deleteById(id);
    }

}
