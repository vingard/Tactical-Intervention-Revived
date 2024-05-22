import { Button, MenuItem } from "@blueprintjs/core"
import { ItemRenderer, ItemPredicate, Select } from "@blueprintjs/select"
import { forwardRef } from "react"
import { useController } from "react-hook-form"


function MapSelectTemp({name, availableMaps, noneOption = false, ...props}: {name: string, availableMaps: string[], noneOption?: boolean}, ref: any) {
    const {field, fieldState, formState} = useController({name})

    const filterItem: ItemPredicate<string> = (query, map, _index, exactMatch) => {
        const normalizedTitle = map.toLowerCase()
        const normalizedQuery = query.toLowerCase()

        if (exactMatch) return normalizedTitle === normalizedQuery
        return normalizedTitle.indexOf(normalizedQuery) >= 0
    }

    const isItemSelected = (map: string) => {
        console.log(field.value === map, field.value, map)
        return field.value === map
    }

    const selectItem = (map: string) => {
        if (map === "None") return field.onChange(null)
        field.onChange(map)
    }

    const handleItemSelect = (map: string) => {
        selectItem(map)
    }

    // eslint-disable-next-line react/no-unstable-nested-components, react/function-component-definition, @typescript-eslint/no-unused-vars
    const MapRender: ItemRenderer<string> = (map, {modifiers, handleClick, handleFocus}) => {
        if (!modifiers.matchesPredicate) return null

        return (
            <MenuItem
                active={modifiers.active}
                disabled={modifiers.disabled}
                key={map}
                // label="Map type here"
                onClick={handleClick}
                onFocus={handleFocus}
                roleStructure="listoption"
                text={map}
            />
        )
    }

    return (
        <Select<string>
            {...props}
            ref={ref}
            items={noneOption && [...["None"], ...availableMaps] || availableMaps}
            activeItem={field.value}
            itemPredicate={filterItem}
            itemRenderer={MapRender}
            noResults={<MenuItem disabled text="No results" roleStructure="listoption"/>}
            onItemSelect={handleItemSelect}
            popoverProps={{position: "bottom-left", matchTargetWidth: true}}
            fill
        >
            <Button
                text={field.value && field.value || "None"}
                rightIcon="double-caret-vertical"
                icon="map"
                placeholder="Select a map"
                fill
                alignText="left"
            />
        </Select>
    )
}

export const MapSelect = forwardRef(MapSelectTemp)
