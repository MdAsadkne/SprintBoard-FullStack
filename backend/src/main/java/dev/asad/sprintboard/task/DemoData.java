package dev.asad.sprintboard.task;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.LocalDate;
import java.util.List;

@Configuration
class DemoData {
    @Bean CommandLineRunner seedTasks(TaskRepository repository) {
        return args -> {
            if (repository.count() > 0) return;
            var titles = List.of("Refresh onboarding flow", "Add keyboard shortcuts", "Write API error guide", "Improve task search");
            var statuses = List.of(TaskStatus.IN_PROGRESS, TaskStatus.BACKLOG, TaskStatus.IN_REVIEW, TaskStatus.DONE);
            var priorities = List.of(Priority.HIGH, Priority.MEDIUM, Priority.LOW, Priority.MEDIUM);
            for (int i = 0; i < titles.size(); i++) {
                var task = new Task(); task.setTitle(titles.get(i)); task.setDescription("Sample sprint task to demonstrate the API and board.");
                task.setAssignee(List.of("A. Khan", "M. Patel", "R. Das", "A. Khan").get(i)); task.setStatus(statuses.get(i));
                task.setPriority(priorities.get(i)); task.setDueDate(LocalDate.now().plusDays(5 + i)); repository.save(task);
            }
        };
    }
}
