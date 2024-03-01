frappe.ui.form.on("Quotation", {
    onload: function (frm) {
        frm.fields_dict["items"].grid.get_field("item_code").get_query =
            function (doc, cdt, cdn) {
                return {
                    query: "sranco.sranco.item_code_query.custom_item_query",
                };
            };

        frm.get_field("custom_not_deliverables").grid.cannot_add_rows = true;
        frm.get_field("custom_not_deliverables").grid.cannot_delete_rows = true;
        // On form load, check and create the rows if needed
        $.each(frm.doc.items || [], function (i, item) {
            manage_not_deliverables_row(frm, item);
        });
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
    refresh: function (frm) {
        frm.get_field("custom_not_deliverables").grid.cannot_add_rows = true;
        frm.get_field("custom_not_deliverables").grid.cannot_delete_rows = true;
        frm.fields_dict["custom_not_deliverables"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
    validate: function (frm) {
        $.each(frm.doc.items || [], function (i, item) {
            // If custom_not_a_tyrolit_specification is 0, make custom_tn_number mandatory
            if (
                item.custom_not_a_tyrolit_specification == 0 &&
                !item.custom_tn_number
            ) {
                frappe.msgprint(
                    __("Please enter TN Number for the item: {0}", [
                        item.item_code,
                    ])
                );
                frappe.validated = false;
            }
            // Save the custom_tn_number to the related Item document
            if (item.custom_tn_number) {
                frappe.call({
                    method: "frappe.client.set_value",
                    args: {
                        doctype: "Item",
                        name: item.item_code,
                        fieldname: "custom_tn_number",
                        value: item.custom_tn_number,
                    },
                });
            }

            // New logic for updating ref_code in Customer Items
            if (item.custom_customer_item_code && item.item_code) {
                frappe.call({
                    method: "sranco.api.update_customer_item_ref_code",
                    args: {
                        item_code: item.item_code,
                        customer: frm.doc.party_name,
                        ref_code: item.custom_customer_item_code,
                    },
                    async: false,
                    callback: function (response) {
                        console.log("response :: ", response.message);
                        if (!response.exc) {
                            frappe.msgprint(response.message);
                        }
                    },
                });
            }
            if (item.custom_tyrolit_rate == 0 || !item.custom_tyrolit_rate) {
                frappe.msgprint(
                    __("Please enter Tyrolit Rate for the item: {0}", [
                        item.item_code,
                    ])
                );
                frappe.validated = false;
            }
        });
    },
});

frappe.ui.form.on("Quotation Item", {
    refresh: function (frm, cdt, cdn) {
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
    custom_not_a_tyrolit_specification: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        manage_not_deliverables_row(frm, row);

        if (row.custom_not_a_tyrolit_specification == 1) {
            // delete the row from the items table
            frm.fields_dict["items"].grid.grid_rows_by_docname[cdn].remove();
            // frm.fields_dict["items"].grid.toggle_reqd("custom_tn_number", true);
        }
    },
    custom_snc_commission_: function (frm, cdt, cdn) {
        update_snc_commission(frm, cdt, cdn);
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
    custom_rep_commission_: function (frm, cdt, cdn) {
        update_rep_commission(frm, cdt, cdn);
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
    custom_rep_commission_amount_per_qty: function (frm, cdt, cdn) {
        update_rep_commission(frm, cdt, cdn);
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
    custom_snc_commission_amount_per_qty: function (frm, cdt, cdn) {
        update_snc_commission(frm, cdt, cdn);
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
    custom_rep_commission_type: function (frm, cdt, cdn) {
        update_rep_commission(frm, cdt, cdn);
        calc_total_rep_commission(frm);
    },
    custom_snc_commission_type: function (frm, cdt, cdn) {
        update_snc_commission(frm, cdt, cdn);
        calc_total_snc_commission(frm);
    },
    qty: function (frm, cdt, cdn) {
        update_rep_commission(frm, cdt, cdn);
        update_snc_commission(frm, cdt, cdn);
        calc_total_rep_commission(frm);
        calc_total_snc_commission(frm);
    },
    item_code: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];

        if (row.item_code && frm.doc.party_name) {
            // fetch item price for customer and item code
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Item Price",
                    filters: {
                        item_code: row.item_code,
                        customer: frm.doc.party_name,
                        selling: 1,
                    },
                    fields: [
                        "name",
                        "price_list_rate",
                        "custom_snc_commission_type",
                        "custom_snc_commission_",
                        "custom_snc_commission_amount",
                        "custom_rep_commission_type",
                        "custom_rep_commission_amount",
                        "custom_rep_commission_",
                        "custom_representative",
                        "custom_has_representative_commission",
                    ],
                },
                callback: function (r) {
                    console.log("item price :: ", r.message);
                    if (r.message.length > 0) {
                        console.log("item price :: ", r.message);
                        row.rate = r.message[0].price_list_rate;
                        row.uom = r.message[0].stock_uom;

                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_snc_commission_type",
                            r.message[0].custom_snc_commission_type
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_snc_commission_",
                            r.message[0].custom_snc_commission_
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_snc_commission_amount_per_qty",
                            r.message[0].custom_snc_commission_amount
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_rep_commission_type",
                            r.message[0].custom_rep_commission_type
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_rep_commission_amount_per_qty",
                            r.message[0].custom_rep_commission_amount
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_rep_commission_",
                            r.message[0].custom_rep_commission_
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_representative",
                            r.message[0].custom_representative
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_has_representative_commission",
                            r.message[0].custom_has_representative_commission
                        );
                        frm.refresh_field("items");
                    }
                },
            });

            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "Item",
                    name: row.item_code,
                },
                callback: function (r) {
                    console.log("item :: ", r.message);
                    if (r.message) {
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_tn_number",
                            r.message.custom_tn_number
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_shape",
                            r.message.custom_shape
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_diameter",
                            r.message.custom_diameter
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_thickness",
                            r.message.custom_thickness
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_bore",
                            r.message.custom_bore
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_speed",
                            r.message.custom_speed
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_specification",
                            r.message.custom_specification
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_more_dimensions",
                            r.message.custom_more_dimensions
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_application",
                            r.message.custom_application
                        );

                        frm.refresh_field("items");
                    }
                },
            });

            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Item Price",
                    filters: {
                        item_code: row.item_code,
                        customer: frm.doc.party_name,
                        buying: 1,
                    },
                    fields: ["name", "price_list_rate"],
                },
                callback: function (r) {
                    console.log("item price :: ", r.message);
                    if (r.message.length > 0) {
                        console.log("item price :: ", r.message);
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_tyrolit_rate",
                            r.message[0].price_list_rate
                        );
                        frm.refresh_field("items");
                    }
                },
            });
        }
        if (row.item_code && frm.doc.party_name) {
            // Ensure item_code and customer are present
            frappe.call({
                method: "sranco.api.get_customer_ref_code",
                args: {
                    item_code: row.item_code,
                    customer: frm.doc.party_name,
                },
                callback: function (response) {
                    if (response.message.length > 0) {
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "custom_customer_item_code",
                            response.message
                        );
                    }
                },
            });
        }
    },
    custom_tn_number: function (frm, cdt, cdn) {
        // look for the item which has matching custom_tn_number and if found set the item_code and item_name
        var row = locals[cdt][cdn];
        if (row.custom_tn_number) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Item",
                    filters: {
                        custom_tn_number: row.custom_tn_number,
                    },
                    fields: ["name", "item_name"],
                },
                callback: function (response) {
                    console.log("response :: ", response.message);
                    if (response.message.length > 0) {
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "item_code",
                            response.message[0].name
                        );
                        frappe.model.set_value(
                            cdt,
                            cdn,
                            "item_name",
                            response.message[0].item_name
                        );
                        frm.refresh_field("items");
                    }
                    // if there is no item with matching custom_tn_number then clear the item_code and item_name and craete new item
                    else {
                        // frappe.model.set_value(cdt, cdn, "item_code", "");
                        // frappe.model.set_value(cdt, cdn, "item_name", "");
                        // create new item for the tn number
                        frappe.call({
                            method: "sranco.api.create_new_item",
                            args: {
                                item_data: row,
                            },
                            callback: function (response) {
                                console.log(
                                    "response from new item:: ",
                                    response.message
                                );
                                if (response.message) {
                                    // print the message
                                    frappe.msgprint(
                                        "New Item Created" +
                                            response.message.item_code
                                    );
                                    frappe.model.set_value(
                                        cdt,
                                        cdn,
                                        "item_code",
                                        response.message.item_code
                                    );
                                    frappe.model.set_value(
                                        cdt,
                                        cdn,
                                        "item_name",
                                        response.message.item_name
                                    );
                                    frm.refresh_field("items");
                                    frappe.msgprint(
                                        "New Item Created " +
                                            response.message.item_code
                                    );
                                }
                            },
                        });
                    }
                },
            });
        }
    },
});

function manage_not_deliverables_row(frm, item) {
    if (item.custom_not_a_tyrolit_specification == 1) {
        // Check if a row already exists for this item in 'Not Deliverables' table
        var exists = false;
        $.each(frm.doc.custom_not_deliverables || [], function (i, nd_row) {
            if (nd_row.item_code === item.item_code) {
                exists = true;
            }
        });

        // If row doesn't exist, add a new row and copy custom fields
        if (!exists) {
            var nd = frm.add_child("custom_not_deliverables");
            nd.item_code = item.item_code;
            copy_custom_fields(item, nd);
        }
    } else {
        // Remove the row from 'Not Deliverables' table if it exists
        var rows_to_remove = [];
        $.each(frm.doc.custom_not_deliverables || [], function (i, nd_row) {
            if (nd_row.item_code === item.item_code) {
                rows_to_remove.push(nd_row);
            }
        });

        $.each(rows_to_remove, function (i, row) {
            frm.get_field("custom_not_deliverables").grid.grid_rows_by_docname[
                row.name
            ].remove();
        });
    }

    frm.refresh_field("custom_not_deliverables");
}

function copy_custom_fields(source, target) {
    for (var key in source) {
        if (key.startsWith("custom_")) {
            var new_key = key.replace("custom_", ""); // Removing the 'custom_' prefix
            target[new_key] = source[key];
        }
    }
}

function calc_total_rep_commission(frm) {
    // calculate total representative commission and set it to custom_total_representative_commission field
    var total_rep_commission = 0;
    frm.doc.items.forEach(function (item) {
        total_rep_commission += item.custom_rep_commission_amount;
    });
    frm.set_value(
        "custom_total_representative_commission",
        total_rep_commission
    );
    frm.refresh_field("custom_total_representative_commission");
}

function calc_total_snc_commission(frm) {
    // calculate total snc commission and set it to custom_total_snc_commission field
    var total_snc_commission = 0;
    frm.doc.items.forEach(function (item) {
        total_snc_commission += item.custom_snc_commission_amount;
    });
    frm.set_value("custom_total_snc_commission", total_snc_commission);
    frm.refresh_field("custom_total_snc_commission");
}

function update_rep_commission(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.custom_rep_commission_type == "Percent") {
        row.custom_rep_commission_amount =
            (row.custom_rep_commission_ * row.rate * row.qty) / 100;
        frm.refresh_field("items");
    } else if (row.custom_rep_commission_type == "Amount") {
        row.custom_rep_commission_amount =
            row.custom_rep_commission_amount_per_qty * row.qty;
        frm.refresh_field("items");
    }
}

function update_snc_commission(frm, cdt, cdn) {
    var row = locals[cdt][cdn];
    if (row.custom_snc_commission_type == "Percent") {
        row.custom_snc_commission_amount =
            (row.custom_snc_commission_ * row.rate * row.qty) / 100;
        frm.refresh_field("items");
    } else if (row.custom_snc_commission_type == "Amount") {
        row.custom_snc_commission_amount =
            row.custom_snc_commission_amount_per_qty * row.qty;
        frm.refresh_field("items");
    }
}
