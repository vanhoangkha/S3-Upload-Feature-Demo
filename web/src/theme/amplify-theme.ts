import { Theme } from '@aws-amplify/ui-react';

export const dmsTheme: Theme = {
  name: 'dms-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: '#e6f3ff',
          20: '#b3d9ff',
          40: '#4da6ff',
          60: '#0073e6',
          80: '#005bb3',
          90: '#004080',
          100: '#002d5c'
        }
      },
      background: {
        primary: '#ffffff',
        secondary: '#f8f9fa'
      }
    },
    components: {
      card: {
        backgroundColor: '{colors.background.primary}',
        borderRadius: '{radii.medium}',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '{space.large}'
      },
      button: {
        primary: {
          backgroundColor: '{colors.brand.primary.80}',
          color: '{colors.white}',
          _hover: {
            backgroundColor: '{colors.brand.primary.90}'
          }
        }
      },
      table: {
        row: {
          _hover: {
            backgroundColor: '{colors.background.secondary}'
          }
        }
      }
    }
  }
};
