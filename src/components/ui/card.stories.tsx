import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card'

const meta = {
  component: Card,
  tags: ['ai-generated'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Paciente Sintético</CardTitle>
        <CardDescription>Resumen clínico para evaluación CDSS</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Parámetros fisiológicos en rango de observación.</p>
      </CardContent>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Paciente Sintético')).toBeVisible()
    await expect(canvas.getByText('Resumen clínico para evaluación CDSS')).toBeVisible()
  },
}
