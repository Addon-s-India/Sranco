frappe.ui.form.on("Opportunity", {
    onload: function (frm) {
        frm.fields_dict["items"].grid.get_field("item_code").get_query =
            function (doc, cdt, cdn) {
                return {
                    query: "sranco.sranco.item_code_query.custom_item_query",
                };
            };
        // Check visibility on load
        update_field_visibility(frm);
        hide_fields(frm);
    },
    refresh: function (frm) {
        // Check visibility on refresh
        update_field_visibility(frm);
        hide_fields(frm);
    },
    before_save: function (frm) {
        frm.doc.items.forEach(function (item) {
            if (item.custom_new_enquiry == 1) {
                frm.fields_dict["items"].grid.toggle_reqd("rate", false);
                frm.fields_dict["items"].grid.toggle_reqd("base_rate", false);
                frm.fields_dict["items"].grid.toggle_reqd("amount", false);
                frm.fields_dict["items"].grid.toggle_reqd("base_amount", false);
            }
            // update_field_visibility(frm);
            // Existing logic for custom new enquiry
            // if (
            //   item.custom_new_enquiry == 1 &&
            //   (!item.item_code || !item.item_name)
            // ) {
            //   // Call the custom API method to create a new item and update the Opportunity Item
            //   frappe.call({
            //     method: "sranco.api.create_new_item",
            //     args: {
            //       item_data: item,
            //     },
            //     async: false,
            //     callback: function (response) {
            //       if (response.message) {
            //         item.item_code = response.message.item_code;
            //         item.item_name = response.message.item_name;
            //       }
            //     },
            //   });
            // }

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
                        if (!response.exc) {
                            frappe.msgprint(response.message);
                        }
                    },
                });
            }
        });
        frm.refresh_field("items"); // Refresh the child table to reflect changes
    },
});

frappe.ui.form.on("Opportunity Item", {
    custom_new_enquiry: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        set_field_visibility(row, frm);
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
                    },
                    fields: ["price_list_rate", "uom"],
                },
                callback: function (response) {
                    console.log("response :: ", response.message);
                    if (response.message) {
                        row.rate = response.message[0].price_list_rate;
                        row.base_rate = row.rate;
                        if (row.qty == 0) {
                            row.amount = 1 * row.rate;
                            row.base_amount = 1 * row.base_rate;
                        } else {
                            row.amount = row.qty * row.rate;
                            row.base_amount = row.qty * row.base_rate;
                        }
                        frm.refresh_field("items");
                        row.uom = response.message[0].uom;
                        frm.refresh_field("items");
                    }
                },
            });
        }

        if (row.item_code && frm.doc.party_name) {
            // Ensure item_code and party_name (customer) are present
            frappe.call({
                method: "sranco.api.get_customer_ref_code",
                args: {
                    item_code: row.item_code,
                    customer: frm.doc.party_name,
                },
                callback: function (response) {
                    if (response.message) {
                        console.log(response.message);
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
    custom_reference_tn_number: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (row.custom_reference_tn_number) {
            // fetch the rate of the item from item price based on custom_reference_tn_number (item_code)
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Item Price",
                    filters: {
                        item_code: row.custom_reference_tn_number,
                    },
                    order_by: "creation asc",
                    fields: ["price_list_rate", "uom", "customer"],
                },
                callback: function (response) {
                    console.log("response :: ", response.message);
                    if (response.message) {
                        // select the price list rate which does not have customer value
                        // if customer value is present, it means it is a custom price list rate
                        // and should not be used
                        response.message.forEach(function (item) {
                            if (item.customer === null) {
                                row.custom_standard_selling_rate =
                                    item.price_list_rate;
                                row.uom = item.uom;
                            }
                        });
                        // hide rate field
                        // frm.fields_dict["items"].grid.toggle_display(
                        //     "rate",
                        //     false
                        // );
                        frm.fields_dict["items"].grid.toggle_reqd("rate", true);
                        console.log(
                            "before save triggered the rate requirement"
                        );
                        frm.refresh_field("items");
                    }
                },
            });
        }
    },
    qty: function (frm, cdt, cdn) {
        var row = locals[cdt][cdn];
        if (row.custom_new_enquiry == 1) {
            row.rate = 0;
            row.base_rate = 0;
            row.amount = null;
            row.base_amount = null;
            frm.refresh_field("items");
        }
    },
});

function update_field_visibility(frm) {
    $.each(frm.doc.items || [], function (i, item) {
        set_field_visibility(item, frm);
    });
}

function set_field_visibility(row, frm) {
    if (row.custom_new_enquiry == 1) {
        frm.fields_dict["items"].grid.toggle_display("item_code", false);
        frm.fields_dict["items"].grid.toggle_display("item_name", false);
        frm.fields_dict["items"].grid.toggle_reqd("rate", false);
        frm.fields_dict["items"].grid.toggle_reqd("base_rate", false);
        frm.fields_dict["items"].grid.toggle_reqd("amount", false);
        frm.fields_dict["items"].grid.toggle_reqd("base_amount", false);
        // clear item_code and item_name
        row.item_code = "";
        row.item_name = "";
        row.rate = 0;
        row.base_rate = 0;
        row.amount = null;
        row.base_amount = null;
        frm.refresh_field("items");
    } else {
        frm.fields_dict["items"].grid.toggle_display("item_code", true);
        frm.fields_dict["items"].grid.toggle_display("item_name", true);
        frm.fields_dict["items"].grid.toggle_reqd("rate", true);
        frm.fields_dict["items"].grid.toggle_reqd("base_rate", true);
        frm.fields_dict["items"].grid.toggle_reqd("amount", true);
        frm.fields_dict["items"].grid.toggle_reqd("base_amount", true);
        // clear item code and item name
        row.item_code = "";
        row.item_name = "";
        frm.refresh_field("items");
    }
}

// function update_amount_rate(frm, cdt, cdn) {
//     var row = locals[cdt][cdn];
//     if (row.rate) {
//         row.rate = row.base_rate;
//         row.amount = row.qty * row.rate;
//         row.base_amount = row.qty * row.base_rate;
//         frm.refresh_field("items");
//     }
//     if (row.rate) {
//         row.base_rate = row.rate;
//         row.amount = row.qty * row.rate;
//         row.base_amount = row.qty * row.base_rate;
//         frm.refresh_field("items");
//     }
// }

function hide_fields(frm) {
    frm.toggle_display("organization_details_section", false);
    frm.toggle_display("section_break_14", false);
    frm.toggle_display("opportunity_type", false);
    frm.toggle_display("sales_stage", false);
    frm.toggle_display("source", false);
    frm.toggle_display("expected_closing", false);
    frm.toggle_display("opportunity_owner", false);
    frm.toggle_display("probability", false);
}
