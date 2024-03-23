import { Button, MenuItem } from "@blueprintjs/core"
import { ItemRenderer, ItemPredicate, MultiSelect, Select } from "@blueprintjs/select"
import { forwardRef, useEffect, useState } from "react"
import { useController } from "react-hook-form"

export interface LoadoutItem {
    id: number
    name: string
    tags?: string[]
    key: string
    type?: string
}

function LoadoutItemSelectTemp({name, availableItems, noneOption = false, ...props}: {name: string, availableItems: LoadoutItem[], noneOption?: boolean}, ref: any) {
    const {field, fieldState, formState} = useController({name})

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

    const isItemSelected = (item: LoadoutItem) => {
        return field.value === item
    }

    const selectItem = (item: LoadoutItem) => {
        if (item.key === "none") return field.onChange(null)
        field.onChange(item)
    }

    const deselectItem = (item: LoadoutItem) => {
        field.onChange(undefined)
    }

    const handleItemSelect = (item: LoadoutItem) => {
        if (!isItemSelected(item)) return selectItem(item)
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

    return (
        <Select<LoadoutItem>
            {...props}
            ref={ref}
            items={noneOption && [...[{id: 0, key: "none", name: "None"}], ...availableItems] || availableItems}
            itemsEqual={itemIsEqual}
            itemPredicate={filterItem}
            itemRenderer={LoadoutItemRender}
            noResults={<MenuItem disabled text="No results" roleStructure="listoption"/>}
            onItemSelect={handleItemSelect}
            popoverProps={{position: "bottom-left", matchTargetWidth: true}}
            fill
        >
            <Button
                text={field.value && itemGetName(field.value) || "None"}
                rightIcon="double-caret-vertical"
                placeholder="Select a item"
                fill
                alignText="left"
            />
        </Select>
    )
}

export const LoadoutItemSelect = forwardRef(LoadoutItemSelectTemp)
