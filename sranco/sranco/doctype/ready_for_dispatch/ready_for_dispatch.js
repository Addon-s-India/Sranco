// Copyright (c) 2023, Dinesh Panchal and contributors
// For license information, please see license.txt

frappe.ui.form.on("Ready For Dispatch", {
    onload: function (frm) {
        // clear items table data and all the other fields when the document loads
        clear_doc_data(frm);
        frm.get_field("dispatch_table").grid.cannot_add_rows = true;
        frm.get_field("dispatch_table").grid.cannot_delete_rows = true;
        frm.fields_dict["dispatch_table"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();

        // Clear data when the document loads
        clear_doc_data(frm);
    },
    refresh: function (frm) {
        frm.get_field("dispatch_table").grid.cannot_add_rows = true;
        frm.get_field("dispatch_table").grid.cannot_delete_rows = true;
        frm.fields_dict["dispatch_table"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();

        // frm.add_custom_button("Apply Changes", function () {
        //   apply_changes_function(frm);
        // });

        // // Add "Clear Data" button
        // frm.add_custom_button("Clear Data", function () {
        //   clear_doc_data(frm);
        // });

        // Add "Apply Changes" button to the child table
        frm.fields_dict["dispatch_table"].grid.add_custom_button(
            __("Apply Changes"),
            function () {
                apply_changes_function(frm);
            }
        );

        // Add "Clear Data" button to the child table
        frm.fields_dict["dispatch_table"].grid.add_custom_button(
            __("Clear Data"),
            function () {
                clear_doc_data(frm);
            }
        );

        // Change the button style to primary for visibility (optional)
        frm.fields_dict["dispatch_table"].grid.grid_buttons
            .find(".btn-custom")
            .removeClass("btn-default")
            .addClass("btn-primary");
    },
    order_confirmation: function (frm) {
        if (frm.doc.order_confirmation) {
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Purchase Order",
                    filters: {
                        custom_order_confirmation: frm.doc.order_confirmation,
                    },
                    fields: ["name"],
                },
                callback: function (response) {
                    if (response.message && response.message.length) {
                        let purchase_order_name = response.message[0].name;
                        cur_frm.set_value(
                            "purchase_order",
                            purchase_order_name
                        );
                        fetch_purchase_order_items(purchase_order_name, frm);
                    } else {
                        frappe.msgprint(
                            "No Purchase Order found with the given Order Confirmation number."
                        );
                    }
                },
            });

            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "Sales Order",
                    filters: {
                        custom_order_confirmation: frm.doc.order_confirmation,
                    },
                    fields: ["name", "po_no"],
                },
                callback: function (response) {
                    if (response.message && response.message[0].po_no) {
                        console.log("response.message", response.message);
                        cur_frm.set_value(
                            "customers_purchase_order",
                            response.message[0].po_no
                        );
                    } else {
                        frappe.show_alert("No Customer's Purchase Order No.");
                    }
                },
            });
        }
    },
});

frappe.ui.form.on("Dispatch Table", {
    // Assuming "Dispatch Table" is the name of your child table Doctype
    update_ready_qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn]; // Get the current row

        if (
            row.update_ready_qty > row.qty - row.ready_qty ||
            row.update_ready_qty < 0
        ) {
            frappe.model.set_value(cdt, cdn, "update_ready_qty", 0); // Resetting the value to 0 or you can keep it to previous value
            frappe.msgprint(
                "Update Ready Quantity cannot exceed the remaining quantity or be negative."
            );
        }

        if (row.qty - row.ready_qty === 0) {
            frappe.msgprint("No more quantity left to update.");
        }
    },
});

function fetch_purchase_order_items(purchase_order_name, frm) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Purchase Order",
            name: purchase_order_name,
        },
        callback: function (response) {
            if (response.message) {
                let purchase_order = response.message;
                cur_frm.set_value("dispatch_table", []);
                cur_frm.set_value("customer", purchase_order.customer);
                //   set purchase order using item.parent
                let sales_order;
                $.each(purchase_order.items, function (index, item) {
                    console.log("item", item);
                    sales_order = item.sales_order;
                    cur_frm.add_child("dispatch_table", {
                        sequence_no: item.idx,
                        item_name: item.item_name,
                        item_code: item.item_code,
                        gi_date: item.schedule_date,
                        tn_number: item.custom_tn_number,
                        customer_item_code: item.custom_customer_item_code,
                        qty: item.qty,
                        ready_qty: item.custom_ready_qty,
                        customer: purchase_order.customer,
                        purchase_order: purchase_order_name,
                        sales_order: item.sales_order,
                        order_confirmation: frm.doc.order_confirmation,
                    });
                });
                cur_frm.set_value("sales_order", sales_order);
                cur_frm.refresh_field("dispatch_table");
            }
        },
    });
}

function apply_changes_function(frm) {
    // Filter out valid rows
    let valid_rows = frm.doc.dispatch_table.filter(
        (row) =>
            row.update_ready_qty > 0 &&
            row.update_ready_qty <= row.qty - row.ready_qty
    );

    if (valid_rows.length) {
        frappe.call({
            method: "sranco.api.create_gi_date_tracker_and_update_po",
            args: {
                dispatch_data: valid_rows,
                date: frm.doc.date,
            },
            callback: function (response) {
                if (response.message) {
                    frappe.msgprint(response.message);
                    fetch_updated_ready_qty_and_update_child_table(frm);
                } else {
                    frappe.msgprint(
                        response.message ||
                            "There was an error processing your request."
                    );
                }
            },
        });
    } else {
        frappe.msgprint("No valid rows found to apply changes.");
    }
}

function fetch_updated_ready_qty_and_update_child_table(frm) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Purchase Order",
            name: frm.doc.purchase_order,
        },
        callback: function (response) {
            if (response.message) {
                let purchase_order = response.message;

                // Update the dispatch_table with new ready_qty values
                $.each(frm.doc.dispatch_table, function (index, row) {
                    let matching_po_item = purchase_order.items.find(
                        (item) => item.item_code === row.item_code
                    );

                    if (matching_po_item) {
                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "ready_qty",
                            matching_po_item.custom_ready_qty
                        );
                        // reset the update_ready_qty field
                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "update_ready_qty",
                            0
                        );
                    }
                });

                // Refresh the form to show the updated values
                frm.refresh_field("dispatch_table");
            }
        },
    });
}

function clear_doc_data(frm) {
    // Clear main fields
    frm.set_value("order_confirmation", "");
    frm.set_value("customer", "");
    frm.set_value("sales_order", "");
    frm.set_value("purchase_order", "");
    frm.set_value("customers_purchase_order", "");
    frm.set_value("date", "");

    // Clear the child table data
    frm.clear_table("dispatch_table");

    // Refresh the form to reflect the changes
    frm.refresh();
}
