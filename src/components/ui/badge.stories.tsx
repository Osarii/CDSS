import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Badge } from './badge'

const meta = {
  component: Badge,
  tags: ['ai-generated'],
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: 'Estado Clínico' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Estado Clínico')).toBeVisible()
  },
}

export const Secondary: Story = {
  args: { children: 'Observación', variant: 'secondary' },
}

export const Destructive: Story = {
  args: { children: 'Contraindicación', variant: 'destructive' },
}

export const Outline: Story = {
  args: { children: 'Información', variant: 'outline' },
}
