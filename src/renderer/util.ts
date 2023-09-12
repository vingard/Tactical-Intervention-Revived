import { KeyboardEvent } from "react"

export const preventEnterKeySubmission = (e: KeyboardEvent<HTMLFormElement>) => {
	const {target} = e
	// eslint-disable-next-line no-undef
	if (e.key === "Enter" && target instanceof HTMLInputElement) {
		e.preventDefault()
	}
};
