package dev.asad.sprintboard.task;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class TaskController {
    private final TaskRepository repository;
    public TaskController(TaskRepository repository) { this.repository = repository; }

    @GetMapping
    public List<Task> list(@RequestParam(required = false) String search, @RequestParam(required = false) Priority priority) {
        var tasks = priority == null ? repository.findAll() : repository.findByPriority(priority);
        if (search == null || search.isBlank()) return tasks;
        var query = search.toLowerCase(Locale.ROOT);
        return tasks.stream().filter(task -> task.getTitle().toLowerCase(Locale.ROOT).contains(query)
                || task.getAssignee().toLowerCase(Locale.ROOT).contains(query)).toList();
    }
    @GetMapping("/{id}")
    public Task get(@PathVariable Long id) { return find(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Task create(@Valid @RequestBody Task task) { task.setId(null); return repository.save(task); }
    @PutMapping("/{id}")
    public Task update(@PathVariable Long id, @Valid @RequestBody Task incoming) {
        var task = find(id); incoming.setId(task.getId()); return repository.save(incoming);
    }
    @PatchMapping("/{id}/status")
    public Task move(@PathVariable Long id, @RequestParam TaskStatus status) {
        var task = find(id); task.setStatus(status); return repository.save(task);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { repository.delete(find(id)); }
    private Task find(Long id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found")); }
}
