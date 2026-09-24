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

export const ClinicalCritical: Story = {
  args: { children: 'Crítico — Alerta Grave', variant: 'critical' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Crítico — Alerta Grave')).toBeVisible()
  },
}

export const ClinicalWarning: Story = {
  args: { children: 'Precaución — Dosis', variant: 'warning' },
}

export const ClinicalSafe: Story = {
  args: { children: 'Verificado — Seguro', variant: 'safe' },
}

export const ClinicalLow: Story = {
  args: { children: 'Leve — Informativo', variant: 'low' },
}

export const ClinicalMissing: Story = {
  args: { children: 'Faltante — Creatinina Requerida', variant: 'missing' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Faltante — Creatinina Requerida')).toBeVisible()
  },
}
