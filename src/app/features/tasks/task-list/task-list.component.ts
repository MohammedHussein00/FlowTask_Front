import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { LucideAngularModule } from 'lucide-angular';
import { Apollo } from 'apollo-angular';
import { GET_TASKS_BY_LIST } from '../../../graphql/task/task.queries';
import { Task } from '../../../models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzTagModule, NzAvatarModule, NzButtonModule, NzInputModule, NzIconModule,
    LucideAngularModule
  ],
  template: `
    <div class="ft-list-header">
      <h2>Tasks</h2>
      <div class="ft-list-actions">

        <div class="ft-search-wrap">
          <span class="ft-search-icon">
            <lucide-icon name="search" [size]="16" />
          </span>
          <input
            nz-input
            type="text"
            [(ngModel)]="searchText"
            placeholder="Filter tasks..."
            class="ft-search-input" />
        </div>

        <button nz-button nzType="primary">
          <lucide-icon name="plus" [size]="16" />
          Add task
        </button>
      </div>
    </div>

    <nz-table
      [nzData]="filteredTasks"
      [nzLoading]="loading()"
      [nzPageSize]="20"
      nzShowPagination="true"
      class="ft-task-table">

      <thead>
        <tr>
          <th>Task</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Due date</th>
          <th>Assignees</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        @for (task of filteredTasks; track task.id) {
          <tr>
            <td>{{ task.name }}</td>

            <td>
              <nz-tag [nzColor]="getPriorityColor(task.priority)">
                {{ task.priority }}
              </nz-tag>
            </td>

            <td>
              <span class="ft-status-pill"
                [style.background]="(task.statusColor || '#d9d9d9') + '22'"
                [style.color]="task.statusColor || '#d9d9d9'">
                {{ task.statusName ?? 'No status' }}
              </span>
            </td>

            <td>{{ task.dueDate ? (task.dueDate | date:'MMM d, y') : '—' }}</td>

            <td>
              @if ((task.assignees.length ?? 0) > 0) {
                <div class="ft-avatar-group">
                  @for (assignee of task.assignees.slice(0, 3); track assignee.userId) {
                    <nz-avatar
                      [nzText]="assignee.fullName[0]"
                      nzShape="circle"
                      [nzSize]="28"
                      [title]="assignee.fullName"
                      class="ft-avatar-overlap" />
                  }
                  @if (task.assignees.length > 3) {
                    <nz-avatar
                      [nzText]="'+' + (task.assignees.length - 3)"
                      nzShape="circle"
                      [nzSize]="28"
                      class="ft-avatar-overlap ft-avatar-extra" />
                  }
                </div>
              }
            </td>

            <td>
              <button nz-button nzType="text" nzSize="small">
                <lucide-icon name="pencil" [size]="14" />
              </button>
              <button nz-button nzType="text" nzDanger nzSize="small">
                <lucide-icon name="trash-2" [size]="14" />
              </button>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `,
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
  listId!: number;
  tasks: Task[] = [];
  searchText = '';
  loading = signal(true);

  get filteredTasks(): Task[] {
    if (!this.searchText) return this.tasks;
    const q = this.searchText.toLowerCase();
    return this.tasks.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.priority.toLowerCase().includes(q)
    );
  }

  constructor(private apollo: Apollo, private route: ActivatedRoute) {}

  ngOnInit() {
    this.listId = +this.route.snapshot.params['listId'];
    this.apollo.query<{ getTasksByList: Task[] }>({
      query: GET_TASKS_BY_LIST,
      variables: { listId: this.listId }
    }).subscribe(res => {
      this.tasks = res.data?.getTasksByList ?? [];
      this.loading.set(false);
    });
  }

  getPriorityColor(priority: string): string {
    const map: Record<string, string> = {
      urgent: 'red',
      high:   'orange',
      normal: 'blue',
      low:    'cyan'
    };
    return map[priority] ?? 'blue';
  }
}