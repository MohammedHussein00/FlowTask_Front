import { gql } from 'apollo-angular';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      data { userId email fullName accessToken expiresAt }
      error { code message errors { field message code } }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      data { userId email fullName accessToken expiresAt }
      error { code message errors { field message code } }
    }
  }
`;

export const OAUTH_LOGIN_MUTATION = gql`
  mutation OAuthLogin($input: OAuthLoginInput!) {
    oAuthLogin(input: $input) {
      data { userId email fullName accessToken expiresAt }
      error { code message errors { field message code } }
    }
  }
`;
