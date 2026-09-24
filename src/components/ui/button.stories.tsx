import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Button } from './button'

const meta = {
  component: Button,
  tags: ['ai-generated'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { children: 'Confirmar' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: /confirmar/i })).toBeVisible()
  },
}

export const Secondary: Story = {
  args: { children: 'Cancelar', variant: 'secondary' },
}

export const Outline: Story = {
  args: { children: 'Detalles', variant: 'outline' },
}

export const Destructive: Story = {
  args: { children: 'Eliminar', variant: 'destructive' },
}

export const CssCheck: Story = {
  args: { children: 'Submit' },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /submit/i })
    await expect(getComputedStyle(button).backgroundColor).toBe('rgb(74, 21, 75)')
  },
}
