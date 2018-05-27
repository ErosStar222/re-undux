import * as React from 'react'
import { ComponentClass } from 'react'
import { Subscription } from 'rxjs'
import { Store, StoreDefinition, StoreSnapshot } from './'
import { equals, getDisplayName } from './utils'

export type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T]
export type Omit<T, K extends keyof T> = { [P in Diff<keyof T, K>]: T[P] }

export function connect<StoreState extends object>(store: StoreDefinition<StoreState>) {
  return function <
    Props,
    PropsWithStore extends { store: Store<StoreState> } & Props = { store: Store<StoreState> } & Props
    >(
      Component: React.ComponentType<PropsWithStore>
    ): React.ComponentClass<Omit<PropsWithStore, 'store'>> {

    type State = {
      store: StoreSnapshot<StoreState>
      subscription: Subscription
    }

    return class extends React.Component<Omit<PropsWithStore, 'store'>, State> {
      static displayName = `withStore(${getDisplayName(Component)})`
      state = {
        store: store['store'],
        subscription: store.onAll().subscribe(({ key, previousValue, value }) => {
          if (equals(previousValue, value)) {
            return false
          }
          this.setState({ store: store['store'] })
        })
      }
      componentWillUnmount() {
        this.state.subscription.unsubscribe()
      }
      shouldComponentUpdate(props: Omit<PropsWithStore, 'store'>, state: State) {
        return state.store !== this.state.store
          || Object.keys(props).some(_ => (props as any)[_] !== (this.props as any)[_])
      }
      render() {
        return <Component {...this.props} store={this.state.store} />
      }
    }
  }
}
