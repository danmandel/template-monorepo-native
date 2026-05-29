import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import * as SecureStore from 'expo-secure-store';

// API endpoint - can be configured via environment
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.dailydash.app/graphql';

// Create HTTP link
const httpLink = createHttpLink({
  uri: API_URL
});

// Auth link to add token to requests
const authLink = setContext(async (_, { headers }) => {
  // Get token from secure storage
  const token = await SecureStore.getItemAsync('auth_token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  };
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        keyFields: ['id']
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network'
    },
    query: {
      fetchPolicy: 'cache-first'
    }
  }
});

// Helper to store auth token
export const setAuthToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync('auth_token', token);
};

// Helper to clear auth token
export const clearAuthToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync('auth_token');
};

// Helper to get stored auth token
export const getAuthToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('auth_token');
};
