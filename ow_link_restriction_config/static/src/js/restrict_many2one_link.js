/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { Many2OneField } from "@web/views/fields/many2one/many2one_field";
import { session } from "@web/session";

/**
 * Model-scoped, view-scoped restriction of the Many2one "Internal link"
 * open-record navigation (the hover arrow, and clicking the readonly
 * value, that jump to the linked record's form).
 *
 * Verified against Odoo 17.0 source (addons/web/static/src/views/...):
 * Many2OneField.hasExternalButton / onClick, env.config.viewType, and
 * record.resModel are all identical to 18.0 — this file is unchanged
 * from the 18.0 version.
 *
 * Note on view types: Odoo 17's list view arch tag is <tree> and
 * ir.actions.act_window uses view_mode="tree,form", but the JS view
 * registry key (and env.config.viewType at runtime) is still the
 * string "list" — registry.category("views").add("list", listView).
 * "tree" is only the XML/view_mode spelling; it is NOT the runtime
 * viewType string. So RESTRICTED_VIEW_TYPES below stays ["form", "list"]
 * on Odoo 17 too — do not change this to "tree".
 *
 * - Restricted models come from `ow.link.restriction` (active=True),
 *   pushed into the session at login via ir.http.session_info().
 * - Only applied when the CURRENT record's model (the model the form/list
 *   is displaying, e.g. "hr.leave") is in that restricted list — this is
 *   NOT about the target/linked model, it's about which model's own view
 *   you're restricting.
 * - Only applied when env.config.viewType is "form" or "list".
 *   Kanban (and any other view type) is always left untouched.
 */
const RESTRICTED_VIEW_TYPES = ["form", "list"];

patch(Many2OneField.prototype, {
    get isLinkRestricted() {
        const viewType = this.env.config && this.env.config.viewType;
        if (!RESTRICTED_VIEW_TYPES.includes(viewType)) {
            return false;
        }
        const resModel = this.props.record && this.props.record.resModel;
        const restrictedModels = session.ow_restricted_link_models || [];
        return restrictedModels.includes(resModel);
    },

    get hasExternalButton() {
        if (this.isLinkRestricted) {
            return false;
        }
        return super.hasExternalButton;
    },

    onClick(ev) {
        if (this.isLinkRestricted) {
            return;
        }
        return super.onClick(ev);
    },
});
