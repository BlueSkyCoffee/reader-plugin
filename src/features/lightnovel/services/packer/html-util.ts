export function removeElements(elements: Element[]) {
  elements.forEach(element => element.remove())
}

export function removeLineBreak(element: Element) {
  if (element.children.length > 0) {
    Array.from(element.children).forEach(child => removeLineBreak(child))
  }
  else if (element.textContent) {
    element.textContent = element.textContent.replace(/\n/g, "")
  }
}

export function wrapDuoKanImage(element: Element) {
  const images = Array.from(element.querySelectorAll("img"))
  images.forEach((img) => {
    const wrapper = element.ownerDocument?.createElement("div")
    if (!wrapper)
      return
    wrapper.className = "duokan-image-single"
    img.replaceWith(wrapper)
    wrapper.append(img)
  })
}

export function unwrap(element: Element) {
  const parent = element.parentElement
  if (!parent)
    return
  const children = Array.from(element.childNodes)
  children.forEach(child => parent.insertBefore(child, element))
  element.remove()
}

export function removeElementsByPattern(
  element: Element,
  pattern: string,
  options: {
    matchId?: boolean
    matchTagName?: boolean
    matchClassName?: boolean
  } = {},
) {
  const {
    matchId = false,
    matchTagName = true,
    matchClassName = false,
  } = options
  const regex = new RegExp(pattern)
  const id = element.id
  const tagName = element.tagName?.toLowerCase() ?? ""
  const className = element.className ?? ""

  if (matchId && id && regex.test(id)) {
    element.remove()
    return
  }
  if (matchTagName && tagName && regex.test(tagName)) {
    element.remove()
    return
  }
  if (matchClassName && className && regex.test(className)) {
    element.remove()
    return
  }
  Array.from(element.children).forEach(child => removeElementsByPattern(child, pattern, options))
}
