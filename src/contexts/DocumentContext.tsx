import { createContext, useContext, useEffect } from 'react'

export const DocumentContext = createContext<string>('')

export const useDocumentName = () => {
  const name = useContext(DocumentContext)

  // Fallback observer to ensure any hardcoded "Gerando minuta..." is replaced dynamically
  // across the entire generation workflow, even in components that are not directly modified.
  useEffect(() => {
    if (!name) return

    const replaceText = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.nodeValue?.includes('Gerando minuta...')) {
          node.nodeValue = node.nodeValue.replace('Gerando minuta...', `Gerando ${name}...`)
        } else if (node.nodeValue?.includes('Gerando minuta')) {
          node.nodeValue = node.nodeValue.replace('Gerando minuta', `Gerando ${name}`)
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.childNodes.forEach(replaceText)
      }
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          if (mutation.target.nodeValue?.includes('Gerando minuta...')) {
            mutation.target.nodeValue = mutation.target.nodeValue.replace(
              'Gerando minuta...',
              `Gerando ${name}...`,
            )
          }
        } else if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(replaceText)
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    replaceText(document.body)

    return () => observer.disconnect()
  }, [name])

  return name
}
