import * as React from 'react'
import { IDisposable } from 'rx'
import { Store } from './'
import { ComponentClass } from 'react';

type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T]
type Omit<T, K extends keyof T> = { [P in Diff<keyof T, K>]: T[P] }
type Overwrite<T, U> = { [P in Diff<keyof T, keyof U>]: T[P] } & U

export function connect<Actions extends object>(store: Store<Actions>) {
  return (...listenOn: (keyof Actions)[]) => {
    return function <Props extends { store: Store<Actions> }>(
      Component: React.ComponentType<Props>
    ): React.ComponentType<Omit<Props, 'store'>> {

      let state: IDisposable[][]

      let Class: ComponentClass<Omit<Props, 'store'>> = class extends React.Component<Omit<Props, 'store'>> {
        componentDidMount() {
          state = listenOn.map(key => {
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
                this.forceUpdate()
              })
            ]
          })
        }
        componentWillUnmount() {
          state.forEach(_ => _.forEach(_ => _.dispose()))
        }
        render() {
          return <Component {...this.props} store={store} />
        }
      }

      Class.displayName = `withStore(${getDisplayName(Component)})`

      return Class
    }
  }
}

function getDisplayName<T>(Component: React.ComponentType<T>): string {
  return Component.displayName || Component.name || 'Component'
}

/**
 * TODO: Avoid diffing by passing individual values into a React component
 * rather than the whole `store`, and letting React and `shouldComponentUpdate`
 * handle diffing for us.
 */
function equals<T>(a: T, b: T): boolean {
  return a === b
}
