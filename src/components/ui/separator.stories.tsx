import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Separator } from './separator'

const meta = {
  component: Separator,
  tags: ['ai-generated'],
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <p className="text-sm font-medium">Sección Superior</p>
      <Separator />
      <p className="text-sm text-muted-foreground">Sección Inferior</p>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Sección Superior')).toBeVisible()
    await expect(canvas.getByText('Sección Inferior')).toBeVisible()
  },
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center space-x-4 text-sm">
      <span>Dosis</span>
      <Separator orientation="vertical" />
      <span>Frecuencia</span>
    </div>
  ),
}
