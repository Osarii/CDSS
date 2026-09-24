import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Input } from './input'

const meta = {
  component: Input,
  tags: ['ai-generated'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Buscar medicamento o principio activo...',
    'aria-label': 'Búsqueda de medicamento',
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: /búsqueda de medicamento/i })
    await userEvent.type(input, 'Metformina')
    await expect(input).toHaveValue('Metformina')
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Dato bloqueado por protocolo',
  },
}
