import * as React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { JSDOM } from 'jsdom'

export function withElement<T>(Component: React.ComponentType<T>, f: (div: HTMLDivElement) => void) {
  let { window: { document } } = new JSDOM
  let div = document.createElement('div')
  render(<Component />, div)
  f(div)
  unmountComponentAtNode(div)
}
