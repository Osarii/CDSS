import type { Preview } from '@storybook/react-vite'
import '../src/index.css'
import { AppProviders } from '../src/app/providers/AppProviders'
import { mswHandlers } from './msw-handlers'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    msw: {
      handlers: mswHandlers,
    },
  },
  decorators: [
    (Story) => (
      <AppProviders>
        <Story />
      </AppProviders>
    ),
  ],
}

export default preview