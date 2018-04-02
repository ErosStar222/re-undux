import * as React from 'react'
import { ComponentClass } from 'react'
import { Subscription } from 'rxjs'
import { Store, StoreProxy, StoreSnapshot } from './'
import { equals, getDisplayName } from './utils'

export type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T]
export type Omit<T, K extends keyof T> = { [P in Diff<keyof T, K>]: T[P] }

export function connect<Actions extends object>(store: StoreProxy<Actions>) {
  return (...listenOn: (keyof Actions)[]) => {
    return function <
      Props,
      PropsWithStore extends { store: Store<Actions> } & Props = { store: Store<Actions> } & Props
    >(
      Component: React.ComponentType<PropsWithStore>
    ): React.ComponentClass<Omit<PropsWithStore, 'store'>> {

      type State = {
        store: StoreSnapshot<Actions>
        subscriptions: Subscription[][]
      }

      return class extends React.Component<Omit<PropsWithStore, 'store'>, State> {
        static displayName = `withStore(${getDisplayName(Component)})`
        state: State = {
          store: store['store'],
          subscriptions: []
        }
        componentDidMount() {
          this.setState({
            subscriptions: listenOn.map(key => {
              let ignore = false
              return [
                store.before(key).subscribe(({ previousValue, value }) => {
                  if (equals(previousValue, value)) {
                    return ignore = true
                  }
                }),
                store.on(key).subscribe(() => {
                  if (ignore) {
                    return ignore = false
                  }
                  this.setState({ store: store['store'] })
                })
              ]
            })
          })
        }
        componentWillUnmount() {
          this.state.subscriptions.forEach(_ => _.forEach(_ => _.unsubscribe()))
        }
        shouldComponentUpdate(_: Omit<PropsWithStore, 'store'>, state: State) {
          return state.store !== this.state.store
        }
        render() {
          return <Component {...this.props} store={this.state.store} />
        }
      }
    }
  }
}
