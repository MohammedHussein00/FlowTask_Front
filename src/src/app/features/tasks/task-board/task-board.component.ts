import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { Apollo } from 'apollo-angular';
import { GET_TASKS_BY_LIST } from '../../../graphql/task/task.queries';
import { Task } from '../../../models/task.model';

interface Column {
  id: string;
  label: string;
  color: string;
  tasks: Task[];
}

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, LucideAngularModule, DatePipe],
  template: `
    <div class="ft-board-header">
      <h2>Task Board</h2>
      <div class="ft-board-actions">
        <button type="button" (click)="addTask('')">
          <lucide-icon [img]="Plus" [size]="15" />
          Add task
        </button>
      </div>
    </div>

    <div class="ft-kanban" cdkDropListGroup>
      @for (col of columns; track col.id) {
        <div class="ft-column">
          <div class="ft-column-header">
            <span class="ft-col-dot" [style.background]="col.color"></span>
            <span class="ft-col-label">{{ col.label }}</span>
            <span class="ft-col-count">{{ col.tasks.length }}</span>
          </div>

          <div class="ft-column-body"
            cdkDropList
            [cdkDropListData]="col.tasks"
            [id]="col.id"
            (cdkDropListDropped)="onDrop($event)">

            @for (task of col.tasks; track task.id) {
              <div class="ft-task-card" cdkDrag>
                <div class="ft-task-header">
                  <span class="ft-priority-dot" [class]="'priority-' + task.priority"></span>
                  <span class="ft-task-name">{{ task.name }}</span>
                </div>

                @if (task.dueDate) {
                  <div class="ft-task-due">
                    <lucide-icon name="calendar" [size]="13" />
                    {{ task.dueDate | date:'MMM d' }}
                  </div>
                }

                <div class="ft-task-footer">
                  @if (task.assignees.length > 0) {
                    <div class="ft-avatar-group">
                      @for (assignee of task.assignees.slice(0, 3); track assignee.userId) {
                        <span class="ft-avatar-overlap" [title]="assignee.fullName">
                          {{ assignee.fullName[0] }}
                        </span>
                      }
                      @if (task.assignees.length > 3) {
                        <span class="ft-avatar-overlap ft-avatar-extra">
                          +{{ task.assignees.length - 3 }}
                        </span>
                      }
                    </div>
                  }
                  <span class="ft-priority-tag" [class]="'priority-' + task.priority">
                    {{ task.priority }}
                  </span>
                </div>
              </div>
            }

            <button class="ft-add-card-btn" type="button" (click)="addTask(col.id)">
              <lucide-icon [img]="Plus" [size]="14" />
              Add task
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './task-board.component.scss',
})
export class TaskBoardComponent implements OnInit {
  readonly Plus = Plus;

  listId!: number;
  loading = signal(true);

  columns: Column[] = [
    { id: 'todo',        label: 'To do',       color: '#d9d9d9', tasks: [] },
    { id: 'in_progress', label: 'In progress', color: '#faad14', tasks: [] },
    { id: 'review',      label: 'In review',   color: '#8b5cf6', tasks: [] },
    { id: 'done',        label: 'Done',        color: '#52c41a', tasks: [] },
  ];

  constructor(private apollo: Apollo, private route: ActivatedRoute) {}

  ngOnInit() {
    this.listId = +this.route.snapshot.params['listId'];
    this.loadTasks();
  }

  loadTasks() {
    this.apollo.query<{ getTasksByList: Task[] }>({
      query: GET_TASKS_BY_LIST,
      variables: { listId: this.listId },
    }).subscribe((res: { data?: { getTasksByList: Task[] } }) => {
      this.loading.set(false);
      const tasks = res.data?.getTasksByList;
      this.columns[0].tasks = tasks?.filter((t: Task) => !t.statusName || t.statusName === 'To do') || [];
      this.columns[1].tasks = tasks?.filter((t: Task) => t.statusName === 'In progress') || [];
      this.columns[2].tasks = tasks?.filter((t: Task) => t.statusName === 'In review') || [];
      this.columns[3].tasks = tasks?.filter((t: Task) => t.statusName === 'Done') || [];
    });
  }

  onDrop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      // TODO: call UPDATE_TASK mutation with new statusId
    }
  }

  addTask(_columnId: string) {
    // Open task create dialog
  }
}
