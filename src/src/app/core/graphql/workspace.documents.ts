import { gql } from 'apollo-angular';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const WORKSPACE_FIELDS = gql`
  fragment WorkspaceFields on WorkspaceType {
    id
    name
    avatarUrl
    ownerId
    ownerName
    memberCount
    createdAt
  }
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch a single workspace by id (user must be a member). */
export const GET_WORKSPACE_QUERY = gql`
  ${WORKSPACE_FIELDS}
  query GetWorkspace($id: Int!) {
    workspace(id: $id) {
      ...WorkspaceFields
    }
  }
`;

/** Fetch all workspaces the current user belongs to. */
export const GET_MY_WORKSPACES_QUERY = gql`
  ${WORKSPACE_FIELDS}
  query GetMyWorkspaces {
    myWorkspaces {
      ...WorkspaceFields
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const CREATE_WORKSPACE_MUTATION = gql`
  ${WORKSPACE_FIELDS}
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      ...WorkspaceFields
    }
  }
`;

export const UPDATE_WORKSPACE_MUTATION = gql`
  ${WORKSPACE_FIELDS}
  mutation UpdateWorkspace($input: UpdateWorkspaceInput!) {
    updateWorkspace(input: $input) {
      ...WorkspaceFields
    }
  }
`;
