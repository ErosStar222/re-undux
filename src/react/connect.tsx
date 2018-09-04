import * as React from 'react'
import { Subscription } from 'rxjs-observable'
import { Store, StoreDefinition, StoreSnapshot } from '../'
import { Diff, equals, getDisplayName } from '../utils'

/**
 * @deprecated Use `createConnectedStore` instead.
 */
export function connect<StoreState extends object>(
  store: StoreDefinition<StoreState>
) {
  return function<
    Props,
    PropsWithStore extends { store: Store<StoreState> } & Props = {
      store: Store<StoreState>
    } & Props
  >(
    Component: React.ComponentType<PropsWithStore>
  ): React.ComponentClass<Diff<PropsWithStore, { store: Store<StoreState> }>> {
    type State = {
      store: StoreSnapshot<StoreState>
      subscription: Subscription
    }

    return class extends React.Component<
      Diff<PropsWithStore, { store: Store<StoreState> }>,
      State
    > {
      static displayName = `withStore(${getDisplayName(Component)})`
      state = {
        store: store.getCurrentSnapshot(),
        subscription: store.onAll().subscribe(({ previousValue, value }) => {
          if (equals(previousValue, value)) {
            return false
          }
          this.setState({ store: store.getCurrentSnapshot() })
        }) as any
      }
      componentWillUnmount() {
        this.state.subscription.unsubscribe()
      }
      shouldComponentUpdate(
        props: Readonly<Diff<PropsWithStore, { store: Store<StoreState> }>>,
        state: State
      ) {
        return (
          state.store !== this.state.store ||
          Object.keys(props).some(
            _ => (props as any)[_] !== (this.props as any)[_]
          )
        )
      }
      render() {
        return <Component {...this.props} store={this.state.store} />
      }
    }
  }
}
