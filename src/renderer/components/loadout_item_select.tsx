import { MenuItem } from "@blueprintjs/core"
import { ItemRenderer, ItemPredicate, MultiSelect } from "@blueprintjs/select"
import { forwardRef, useEffect, useState } from "react"
import { useController } from "react-hook-form"

export interface LoadoutItem {
    id: number
    name: string
    tags?: string[]
    rank: number
    key: string
    type?: string
}

function LoadoutItemSelectTemp({name, availableItems, maxItems, ...props}: {name: string, availableItems: LoadoutItem[], maxItems?: number, minItems?: number}, ref: any) {
    const [selectedLoadoutItems, setSelectedLoadoutItems] = useState<LoadoutItem[]>([])
    const {field, fieldState} = useController({name})

    function itemGetName(item: LoadoutItem): string {
        return (item.name && item.name !== "" && item.name) || item.key
    }

    const filterItem: ItemPredicate<LoadoutItem> = (query, item, _index, exactMatch) => {
        const normalizedTitle = itemGetName(item).toLowerCase()
        const normalizedQuery = query.toLowerCase()

        if (exactMatch) return normalizedTitle === normalizedQuery
        return normalizedTitle.indexOf(normalizedQuery) >= 0
    }

    const itemIsEqual = (itemA: LoadoutItem, itemB: LoadoutItem) => {
        return itemA.key === itemB.key
    }

    const getSelectedItemIndex = (item: LoadoutItem) => {
        return selectedLoadoutItems?.indexOf(item)
    }

    const isItemSelected = (item: LoadoutItem) => {
        return getSelectedItemIndex(item) !== -1
    }

    const selectItem = (item: LoadoutItem) => {
        const newItems = [...selectedLoadoutItems || [], item]
        setSelectedLoadoutItems(newItems)
        field.onChange(newItems)
    }

    const deselectItem = (item: LoadoutItem) => {
        const newItems = selectedLoadoutItems?.filter((_, i) => i !== getSelectedItemIndex(item))
        setSelectedLoadoutItems(newItems)
        field.onChange(newItems)
    }

    const handleItemSelect = (item: LoadoutItem) => {
        if (maxItems && selectedLoadoutItems.length >= maxItems) return
        if (!isItemSelected(item)) return selectItem(item)
        deselectItem(item)
    }

    const handleItemRemove = (item: LoadoutItem) => {
        deselectItem(item)
    }

    // eslint-disable-next-line react/no-unstable-nested-components, react/function-component-definition, @typescript-eslint/no-unused-vars
    const LoadoutItemRender: ItemRenderer<LoadoutItem> = (loadoutItem, {modifiers, handleClick, handleFocus}) => {
        if (!modifiers.matchesPredicate) return null

        return (
            <MenuItem
                active={modifiers.active}
                disabled={modifiers.disabled}
                key={loadoutItem.key}
                label={loadoutItem.type}
                onClick={handleClick}
                onFocus={handleFocus}
                roleStructure="listoption"
                text={`${itemGetName(loadoutItem)}`}
            />
        )
    }

    const LoadoutTagRender = (item: LoadoutItem) => {
        return itemGetName(item)
    }

    return (
        <MultiSelect<LoadoutItem>
            {...props}
            ref={ref}
            items={availableItems}
            itemsEqual={itemIsEqual}
            itemPredicate={filterItem}
            itemRenderer={LoadoutItemRender}
            noResults={<MenuItem disabled text="No results" roleStructure="listoption"/>}
            onItemSelect={handleItemSelect}
            onRemove={handleItemRemove}
            selectedItems={selectedLoadoutItems}
            popoverProps={{position: "bottom-left", matchTargetWidth: true}}
            tagRenderer={LoadoutTagRender}
            fill
        />
    )
}

export const LoadoutItemSelect = forwardRef(LoadoutItemSelectTemp)
