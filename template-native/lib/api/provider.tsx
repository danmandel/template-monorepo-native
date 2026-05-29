import { ApolloProvider as BaseApolloProvider } from '@apollo/client/react';
import type { ReactNode } from 'react';

import { apolloClient } from './client';

type ApolloProviderProps = {
  children: ReactNode;
};

export const ApolloProvider = ({ children }: ApolloProviderProps) => (
  <BaseApolloProvider client={apolloClient}>{children}</BaseApolloProvider>
);
