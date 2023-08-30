/* eslint-disable */

/*
 * Copyright 2020 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import classNames from "classnames";
import * as React from "react";

import { DialogStepProps } from "@blueprintjs/core/src/components/dialog/dialogStep";
import { Classes, MultistepDialog } from "@blueprintjs/core";

type DialogStepElement = React.ReactElement<DialogStepProps & { children: React.ReactNode }>;


export class NoNavInputMultiStepDialog extends MultistepDialog {
    // Having issues? run `npx patch-package` to fix blueprintjs
    protected override renderDialogStep = (step: DialogStepElement, index: number) => {
        const stepNumber = index + 1;
        const hasBeenViewed = this.state.lastViewedIndex >= index;
        const currentlySelected = this.state.selectedIndex === index;

        return (
            <div
                className={classNames(Classes.DIALOG_STEP_CONTAINER, {
                    [Classes.ACTIVE]: currentlySelected,
                    [Classes.DIALOG_STEP_VIEWED]: hasBeenViewed,
                })}
                key={index}
                aria-selected={currentlySelected}
                role="tab"
            >
                <div
                    className={Classes.DIALOG_STEP}
                >
                    <div className={Classes.DIALOG_STEP_ICON}>{stepNumber}</div>
                    <div className={Classes.DIALOG_STEP_TITLE}>{step.props.title}</div>
                </div>
            </div>
        );
    };

}
