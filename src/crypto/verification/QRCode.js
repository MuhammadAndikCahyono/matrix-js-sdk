/*
Copyright 2018 New Vector Ltd
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * QR code key verification.
 * @module crypto/verification/QRCode
 */

import {VerificationBase as Base} from "./Base";
import {
    errorFactory,
    newKeyMismatchError, newUnknownTransactionError,
    newUserCancelledError,
    newUserMismatchError,
} from './Error';
import * as qs from "qs";

const MATRIXTO_REGEXP = /^(?:https?:\/\/)?(?:www\.)?matrix\.to\/#\/([#@!+][^?]+)\?(.+)$/;

const newQRCodeError = errorFactory("m.qr_code.invalid", "Invalid QR code");

export const SHOW_QR_CODE_METHOD = "m.qr_code.show.v1";
export const SCAN_QR_CODE_METHOD = "m.qr_code.scan.v1";

/**
 * @class crypto/verification/QRCode/ReciprocateQRCode
 * @extends {module:crypto/verification/Base}
 */
export class ReciprocateQRCode extends Base {
    static factory(...args) {
        return new ReciprocateQRCode(...args);
    }

    static get NAME() {
        return "m.reciprocate.v1";
    }

    async _doVerification() {
        if (!this.startEvent) {
            // TODO: Support scanning QR codes
            throw new Error("It is not currently possible to start verification" +
                "with this method yet.");
        }

        const targetUserId = this.startEvent.getSender();
        if (!this.userId) {
            console.log("Asking to confirm user ID");
            this.userId = await new Promise((resolve, reject) => {
                this.emit("confirm_user_id", {
                    userId: targetUserId,
                    confirm: resolve, // takes a userId
                    cancel: () => reject(newUserMismatchError()),
                });
            });
        } else if (targetUserId !== this.userId) {
            throw newUserMismatchError({
                expected: this.userId,
                actual: targetUserId,
            });
        }

        if (this.startEvent.getContent()['secret'] !== this.request.encodedSharedSecret) {
            throw newKeyMismatchError();
        }
    }
}
