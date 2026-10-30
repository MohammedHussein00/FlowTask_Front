export const environment = {
  production: true,
  graphqlUrl: 'https://api.example.com/graphql',
  oauth: {
    // See environment.ts for where to get these. Use the production
    // domain's origin when registering it with Google/GitHub.
    googleClientId: '',
    githubClientId: '',
  },
};
