export const crossSellMap: Record<string, string[]> = {
  'Pães & Confeitaria': ['Bebidas & Cafés', 'Empório'],
  'Bebidas & Cafés':    ['Pães & Confeitaria', 'Empório'],
  'Empório':            ['Bebidas & Cafés', 'Pães & Confeitaria'],
  'Congelados':         ['Bebidas & Cafés', 'Empório'],
  'Kits':               ['Pães & Confeitaria', 'Bebidas & Cafés'],
}

export type CrossSellHint = {
  categories: string[]
  priorityFilter?: string
}

// Returns suggested complement categories + optional name priority filter.
// Keyword rules override the category-level map.
export function getCrossSellHint(itemName: string, categoria: string): CrossSellHint {
  const lower = itemName.toLowerCase()

  if (lower.includes('pão de queijo') || lower.includes('pão')) {
    return { categories: ['Bebidas & Cafés', 'Empório'], priorityFilter: 'café' }
  }
  if (lower.includes('craquelado') || lower.includes('cookie')) {
    return { categories: ['Bebidas & Cafés'] }
  }
  if (lower.includes('grissini')) {
    return { categories: ['Bebidas & Cafés'] }
  }

  return { categories: crossSellMap[categoria] ?? [] }
}

// Merges hints from multiple cart items into a single hint.
export function mergeCrossSellHints(
  items: { name: string; categoria: string }[]
): CrossSellHint {
  if (items.length === 0) return { categories: [] }

  const catSet = new Set<string>()
  let priorityFilter: string | undefined

  for (const item of items) {
    const hint = getCrossSellHint(item.name, item.categoria)
    hint.categories.forEach((c) => catSet.add(c))
    if (hint.priorityFilter && !priorityFilter) {
      priorityFilter = hint.priorityFilter
    }
  }

  return { categories: Array.from(catSet), priorityFilter }
}
