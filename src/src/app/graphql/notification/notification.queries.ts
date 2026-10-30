import { gql } from 'apollo-angular';

export const GET_MY_NOTIFICATIONS = gql`
  query GetMyNotifications($unreadOnly: Boolean, $page: Int, $pageSize: Int) {
    getMyNotifications(unreadOnly: $unreadOnly, page: $page, pageSize: $pageSize) {
      id
      title
      message
      isRead
      createdAt
    }
  }
`;
