import { gql } from 'apollo-angular';

export const GET_TASKS_BY_LIST = gql`
  query GetTasksByList($listId: Int!) {
    getTasksByList(listId: $listId) {
      id
      name
      priority
      statusName
      statusColor
      dueDate
      assignees {
        userId
        fullName
        avatarUrl
      }
    }
  }
`;
