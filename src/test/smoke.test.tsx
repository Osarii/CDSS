import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'

describe('CDSS-CR Smoke Test', () => {
  it('renders a base button component correctly', () => {
    render(<Button>CDSS-CR Action</Button>)
    expect(screen.getByRole('button', { name: /cdss-cr action/i })).toBeInTheDocument()
  })

  it('basic environment sanity check', () => {
    expect(true).toBe(true)
  })
})
