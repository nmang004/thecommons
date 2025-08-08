import React from 'react'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { SuggestionProps } from '@tiptap/suggestion'

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface MentionListProps {
  items: string[]
  command: (props: { id: string }) => void
}

class MentionList {
  component: ReactRenderer<MentionListRef, MentionListProps>
  popup: any
  items: string[]
  selectedIndex: number

  constructor({ items, command }: MentionListProps) {
    this.items = items
    this.selectedIndex = 0

    this.component = new ReactRenderer(MentionListComponent, {
      props: {
        items: this.items,
        command,
      },
      editor: null as any,
    })

    if (!this.component.ref) {
      return
    }

    this.popup = tippy('body', {
      getReferenceClientRect: () => ({
        width: 0,
        height: 0,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }),
      appendTo: () => document.body,
      content: this.component.element,
      showOnCreate: true,
      interactive: true,
      trigger: 'manual',
      placement: 'bottom-start',
      theme: 'light-border',
      maxWidth: 'none',
    })
  }

  updateProps(props: Partial<MentionListProps>) {
    this.component.updateProps(props)

    if (props.items) {
      this.items = props.items
      this.selectedIndex = 0
    }
  }

  onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === 'ArrowUp') {
      this.upHandler()
      return true
    }

    if (event.key === 'ArrowDown') {
      this.downHandler()
      return true
    }

    if (event.key === 'Enter') {
      this.enterHandler()
      return true
    }

    return false
  }

  upHandler() {
    this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length
    this.updateSelection()
  }

  downHandler() {
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length
    this.updateSelection()
  }

  enterHandler() {
    this.selectItem(this.selectedIndex)
  }

  selectItem(index: number) {
    const item = this.items[index]
    if (item) {
      this.component.props.command({ id: item })
    }
  }

  updateSelection() {
    this.component.updateProps({
      items: this.items,
      command: this.component.props.command,
    })
  }

  destroy() {
    this.popup?.[0]?.destroy()
    this.component?.destroy()
  }
}

// React component for the mention list
function MentionListComponent({ items, command }: MentionListProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 px-0 max-h-48 overflow-y-auto">
      {items.length ? (
        items.map((item) => (
          <button
            key={item}
            onClick={() => command({ id: item })}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none font-mono"
          >
            <span className="text-blue-600">@</span>{item}
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-gray-500">No variables found</div>
      )}
    </div>
  )
}

export const suggestion = (variables: string[], onVariableInsert?: (variable: string) => void) => ({
  items: ({ query }: { query: string }) => {
    return variables
      .filter(item => item.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10)
  },

  render: () => {
    let component: MentionList
    let popup: any

    return {
      onStart: (props: SuggestionProps) => {
        component = new MentionList({
          items: props.items,
          command: (props) => {
            onVariableInsert?.(props.id)
            component.component.props.command(props)
          },
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          theme: 'light-border',
          maxWidth: 'none',
        })
      },

      onUpdate(props: SuggestionProps) {
        component.updateProps({
          items: props.items,
          command: (props) => {
            onVariableInsert?.(props.id)
            component.component.props.command(props)
          },
        })

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }

        return component.onKeyDown(props)
      },

      onExit() {
        popup?.[0]?.destroy()
        component?.destroy()
      },
    }
  },
})