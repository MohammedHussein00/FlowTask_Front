export const environment = {
  production: false,
  graphqlUrl: 'https://flowtask.runasp.net/graphql',
  oauth: {
    // Both are currently empty, which is why "Continue with Google/GitHub"
    // shows an error on click — see SocialAuthService for details.
    // Google: create an OAuth 2.0 Client ID (type "Web application") at
    //   https://console.cloud.google.com/apis/credentials
    //   and add this origin under "Authorized JavaScript origins".
    googleClientId: '',
    // GitHub: create an OAuth App at https://github.com/settings/developers
    //   with Authorization callback URL = `${origin}/auth/login`.
    githubClientId: '',
  },
  apiUrl:'https://flowtask.runasp.net/api',
};
