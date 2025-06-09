import { render, screen } from '@testing-library/react'
import { BreadcrumbPage } from '../breadcrumb'
import { Carousel } from '../carousel'
import { InputOTPSeparator } from '../input-otp'

// Minimal wrapper for Carousel children
function BasicCarousel() {
  return (
    <Carousel>
      <div>Slide</div>
    </Carousel>
  )
}

describe('UI accessibility components', () => {
  it('BreadcrumbPage is focusable', () => {
    render(<BreadcrumbPage>Home</BreadcrumbPage>)
    const page = screen.getByRole('link')
    expect(page).toHaveAttribute('tabindex', '0')
  })

  it('Carousel root renders a section element', () => {
    const { container } = render(<BasicCarousel />)
    const section = container.querySelector('section[data-slot="carousel"]')
    expect(section).toBeInTheDocument()
  })

  it('InputOTPSeparator renders as hr', () => {
    const { container } = render(<InputOTPSeparator />)
    const hr = container.querySelector('hr[data-slot="input-otp-separator"]')
    expect(hr).toBeInTheDocument()
  })
})
