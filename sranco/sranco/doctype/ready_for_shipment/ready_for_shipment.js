// Copyright (c) 2023, Dinesh Panchal and contributors
// For license information, please see license.txt

frappe.ui.form.on("Ready for Shipment", {
    order_confirmation: function (frm) {
        if (frm.doc.order_confirmation) {
            fetch_purchase_order_for_shipment(frm.doc.order_confirmation, frm);
            get_sales_order_number(frm.doc.order_confirmation, frm);
        }
    },

    onload: function (frm) {
        // Clear data when the document loads
        clear_doc_data(frm);

        frm.get_field("shipment_table").grid.cannot_add_rows = true;
        frm.get_field("shipment_table").grid.cannot_delete_rows = true;
        frm.fields_dict["shipment_table"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();
    },

    refresh: function (frm) {
        frm.get_field("shipment_table").grid.cannot_add_rows = true;
        frm.get_field("shipment_table").grid.cannot_delete_rows = true;
        frm.fields_dict["shipment_table"].grid.wrapper
            .find(".grid-remove-rows")
            .hide();

        // Add "Apply Changes" button to the child table
        frm.fields_dict["shipment_table"].grid.add_custom_button(
            __("Apply Changes"),
            function () {
                apply_shipment_changes(frm);
            }
        );

        // Add "Clear Data" button to the child table
        frm.fields_dict["shipment_table"].grid.add_custom_button(
            __("Clear Data"),
            function () {
                clear_doc_data(frm);
            }
        );

        // Change the button style to primary for visibility (optional)
        frm.fields_dict["shipment_table"].grid.grid_buttons
            .find(".btn-custom")
            .removeClass("btn-default")
            .addClass("btn-primary");
    },
});

frappe.ui.form.on("Shipment Table", {
    update_shipment_qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        console.log("row :: ", row);
        console.log(
            "row.ready_qty - row.shipment_qty :: ",
            row.ready_qty - row.shipment_qty
        );
        console.log("row.update_shipment_qty :: ", row.update_shipment_qty);
        var diff = row.ready_qty - row.shipment_qty;
        console.log("diff :: ", diff);
        if (row.update_shipment_qty !== row.ready_qty - row.shipment_qty) {
            frappe.model.set_value(cdt, cdn, "update_shipment_qty", 0.0);
            frappe.msgprint(
                "Update Shipment Quantity should be equal to the Ready Quantity - Shipment Quantity."
            );
        }
    },
});

function validate_transport_mode_qty(frm, cdt, cdn) {
    let row = locals[cdt][cdn];
    let air_qty = row.air_qty || 0;
    let express_qty = row.express_qty || 0;
    let sea_qty = row.sea_qty || 0;

    let total_transport_qty = air_qty + express_qty + sea_qty;

    if (total_transport_qty !== row.update_shipment_qty) {
        frappe.msgprint(
            "The sum of transport mode quantities must equal Update Shipment Quantity."
        );
    }
}

function fetch_purchase_order_for_shipment(order_confirmation, frm) {
    frappe.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Purchase Order",
            filters: {
                custom_order_confirmation: order_confirmation,
            },
            fields: ["name", "customer"], // Assuming tn_number is a field in Purchase Order
        },
        callback: function (response) {
            if (response.message && response.message.length) {
                let purchase_order_data = response.message[0];
                cur_frm.set_value("purchase_order", purchase_order_data.name);
                // cur_frm.set_value("customer", purchase_order_data.customer);
                // Fetching items from the Purchase Order and populating the shipment_table
                fetch_purchase_order_items(purchase_order_data, frm);
            } else {
                frappe.msgprint(
                    "No Purchase Order found with the given Order Confirmation number."
                );
            }
        },
    });

    frappe.call({
        method: "sranco.sales_order.get_purchase_order_from_items",
        args: {
            order_confirmation: order_confirmation,
        },
        callback: function (response) {
            console.log("response.message", response.message);
            if (response.message && response.message[0].po_no) {
                console.log("response.message", response.message);
                cur_frm.set_value("customers_purchase_order", response.message);
            } else {
                frappe.show_alert("No Customer's Purchase Order No.");
            }
        },
    });
}

function fetch_purchase_order_items(purchase_order_data, frm) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Purchase Order",
            name: purchase_order_data.name,
        },
        callback: function (response) {
            if (response.message) {
                let purchase_order = response.message;
                cur_frm.set_value("shipment_table", []);
                $.each(purchase_order.items, function (index, item) {
                    console.log("Item :: ", item);
                    console.log(
                        "Custom order confirmation :: ",
                        purchase_order.custom_order_confirmation
                    );
                    cur_frm.add_child("shipment_table", {
                        sequence_no: item.idx,
                        item_name: item.item_name,
                        item_code: item.item_code,
                        delivery_date: item.schedule_date,
                        ready_qty: item.custom_ready_qty,
                        shipment_qty: item.custom_shipped_qty,
                        remaining_shipment_qty:
                            item.custom_ready_qty - item.custom_shipped_qty,
                        tn_number: item.custom_tn_number,
                        customer_item_code: item.custom_customer_item_code,
                        customer: frm.doc.customer,
                        purchase_order: purchase_order.name,
                        sales_order: frm.doc.sales_order,
                        order_confirmation:
                            purchase_order.custom_order_confirmation,
                        air_qty: 0,
                        express_qty: 0,
                        sea_qty: 0,
                    });
                });
                cur_frm.refresh_field("shipment_table");
            }
        },
    });
}

function apply_shipment_changes(frm) {
    // Filter out valid rows
    let valid_rows = frm.doc.shipment_table.filter(
        (row) =>
            row.update_shipment_qty > 0 &&
            row.update_shipment_qty === row.ready_qty - row.shipment_qty &&
            row.air_qty + row.express_qty + row.sea_qty ===
                row.update_shipment_qty
    );
    console.log("valid_rows :: ", valid_rows);
    if (valid_rows.length) {
        create_shipment_tracker_and_update_po(frm);
    } else {
        frappe.msgprint("No valid rows found to apply shipment changes.");
    }
}

function create_shipment_tracker_and_update_po(frm) {
    // Call server-side method
    var sales_order = "";
    if (!frm.doc.sales_order) {
        sales_order = null;
    } else {
        sales_order = frm.doc.sales_order;
    }
    frappe.call({
        method: "sranco.api.create_shipment_tracker_and_update_po",
        args: {
            shipment_data: frm.doc.shipment_table,
            purchase_order: frm.doc.purchase_order,
            sales_order: sales_order,
            order_confirmation: frm.doc.order_confirmation,
            date: frm.doc.date,
        },
        callback: function (response) {
            if (response.message) {
                frappe.msgprint(response.message);

                // Fetch updated shipment_qty values for the Purchase Order items
                fetch_updated_shipment_qty_and_update_child_table(frm);
            } else {
                frappe.msgprint("There was an error processing your request.");
            }
        },
    });
}

function fetch_updated_shipment_qty_and_update_child_table(frm) {
    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Purchase Order",
            name: frm.doc.purchase_order,
        },
        callback: function (response) {
            if (response.message) {
                let purchase_order = response.message;

                // Update the shipment_table with new shipment_qty values
                $.each(frm.doc.shipment_table, function (index, row) {
                    let matching_po_item = purchase_order.items.find(
                        (item) => item.item_code === row.item_code
                    );

                    if (matching_po_item) {
                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "shipment_qty",
                            matching_po_item.custom_shipped_qty
                        );

                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "remaining_shipment_qty",
                            matching_po_item.custom_ready_qty -
                                matching_po_item.custom_shipped_qty
                        );

                        // Reset the values of update_shipment_qty, air_qty, express_qty, and sea_qty
                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "update_shipment_qty",
                            0
                        );
                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "air_qty",
                            0
                        );
                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "express_qty",
                            0
                        );
                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "sea_qty",
                            0
                        );
                    }
                });

                // Refresh the form to show the updated values
                frm.refresh_field("shipment_table");
            }
        },
    });
}

function clear_doc_data(frm) {
    // Clear main fields
    frm.set_value("order_confirmation", "");
    frm.set_value("customer", "");
    frm.set_value("date", "");
    frm.set_value("purchase_order", "");
    frm.set_value("sales_order", "");
    frm.set_value("customers_purchase_order", "");

    // Clear the child table data
    frm.clear_table("shipment_table");

    // Refresh the form to reflect the changes
    frm.refresh();
}

function get_sales_order_number(order_confirmation, frm) {
    frappe.call({
        method: "sranco.sales_order.get_sales_order_from_items",
        args: {
            order_confirmation: order_confirmation,
        },
        callback: function (response) {
            console.log("response.message", response.message);
            if (response.message && response.message.sales_order) {
                console.log("response.message", response.message);
                frm.set_value("sales_order", response.message.sales_order);
                frm.set_value("customer", response.message.customer);
            } else {
                frappe.show_alert("No Sales Order No.");
            }
        },
    });
}
