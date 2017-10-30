import * as React from 'react'
import { connect, createStore, Store } from '../src'
import { Simulate } from 'react-dom/test-utils'
import { test } from 'ava'
import { withElement } from './util'

type Actions = {
  isTrue: boolean
  users: string[]
}

let store = createStore<Actions>({
  isTrue: true,
  users: []
})

type Props = {
  store: Store<Actions>
}

let MyComponent = connect(store)()(
  class extends React.Component<Props> {
    render() {
      return <div>
        {this.props.store.get('isTrue') ? 'True' : 'False'}
        <button onClick={() => this.props.store.set('isTrue')(false)}>Update</button>
      </div>
    }
  }
)

let MyComponentWithLens = connect(store)('isTrue')(
  class extends React.Component<Props> {
    render() {
      return <div>
        {this.props.store.get('isTrue') ? 'True' : 'False'}
        <button onClick={() => this.props.store.set('isTrue')(!store.get('isTrue'))}>Update</button>
      </div>
    }
  }
)

test('[stateful] it should render a component', t =>
  withElement(MyComponent, _ =>
    t.regex(_.innerHTML, /True/)
  )
)

test('[stateful] it should update the component', t =>
  withElement(MyComponent, _ => {
    t.regex(_.innerHTML, /True/)
    Simulate.click(_.querySelector('button')!)
    t.regex(_.innerHTML, /False/)
  })
)

// nb: test order matters because store is shared!
test('[stateful] it should support lenses', t =>
  withElement(MyComponentWithLens, _ => {
    t.regex(_.innerHTML, /False/)
    Simulate.click(_.querySelector('button')!)
    t.regex(_.innerHTML, /True/)
  })
)

test('[stateful] it should support effects', t =>
  withElement(MyComponentWithLens, _ => {
    t.plan(1)
    store.on('isTrue').subscribe(_ => t.is(_, false))
    Simulate.click(_.querySelector('button')!)
  })
)
