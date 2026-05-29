import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

type ExternalLinkProps = Omit<React.ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

export const ExternalLink = ({ href, ...props }: ExternalLinkProps) => {
  return (
    <Link
      target='_blank'
      {...props}
      href={href as Href}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          e.preventDefault();
          WebBrowser.openBrowserAsync(href);
        }
      }}
    />
  );
};
