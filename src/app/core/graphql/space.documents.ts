import { gql } from 'apollo-angular';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const SPACE_FIELDS = gql`
  fragment SpaceFields on SpaceDto {
    id
    workspaceId
    name
    isPrivate
    color
    avatarUrl
    memberCount
    createdAt
  }
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch every Space in a workspace that the current user can see (public, or private + a member). */
export const GET_SPACES_BY_WORKSPACE_QUERY = gql`
  ${SPACE_FIELDS}
  query GetSpacesByWorkspace($workspaceId: Int!) {
    getSpacesByWorkspace(workspaceId: $workspaceId) {
      ...SpaceFields
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const CREATE_SPACE_MUTATION = gql`
  ${SPACE_FIELDS}
  mutation CreateSpace($input: CreateSpaceInput!) {
    createSpace(input: $input) {
      ...SpaceFields
    }
  }
`;

export const UPDATE_SPACE_MUTATION = gql`
  ${SPACE_FIELDS}
  mutation UpdateSpace($input: UpdateSpaceInput!) {
    updateSpace(input: $input) {
      ...SpaceFields
    }
  }
`;
